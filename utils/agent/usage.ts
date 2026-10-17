import { createHash, createHmac } from "node:crypto";
import { isIP } from "node:net";
import type { NextApiRequest } from "next";

export function agentModel() {
  return process.env.SEARCH_AGENT_MODEL?.trim() || "gpt-5.6-terra";
}

export function missingAgentSettings() {
  const missing = ["OPENAI_API_KEY", "SEARCH_AGENT_IP_SALT"].filter((key) => !process.env[key]?.trim());
  if (process.env.UPSTASH_REDIS_REST_URL?.trim() || process.env.UPSTASH_REDIS_REST_TOKEN?.trim()) {
    for (const key of ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]) if (!process.env[key]?.trim()) missing.push(key);
  }
  return missing;
}

export function agentConfigured() {
  return missingAgentSettings().length === 0;
}

function sharedStorageConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim());
}

// Vercel instances may restart or scale independently; these limits are local to this instance.
const memoryUsage = new Map<number, { total: number; ips: Map<string, number> }>();
const memoryAnswers = new Map<string, { value: string; expiresAt: number }>();
const MAX_MEMORY_ANSWERS = 100;
const MAX_ANSWER_BYTES = 64 * 1024;

export async function getAnswerCache(key: string): Promise<string | null> {
  if (sharedStorageConfigured()) return redisCommand("GET", key);
  const now = Date.now();
  for (const [id, item] of memoryAnswers) if (item.expiresAt <= now) memoryAnswers.delete(id);
  const cached = memoryAnswers.get(key);
  if (!cached) return null;
  memoryAnswers.delete(key);
  memoryAnswers.set(key, cached);
  return cached.value;
}

export async function setAnswerCache(key: string, value: string) {
  if (Buffer.byteLength(value, "utf8") > MAX_ANSWER_BYTES) return;
  if (sharedStorageConfigured()) { await redisCommand("SET", key, value, "EX", 600); return; }
  const now = Date.now();
  for (const [id, item] of memoryAnswers) if (item.expiresAt <= now) memoryAnswers.delete(id);
  memoryAnswers.delete(key);
  while (memoryAnswers.size >= MAX_MEMORY_ANSWERS) memoryAnswers.delete(memoryAnswers.keys().next().value!);
  memoryAnswers.set(key, { value, expiresAt: now + 600_000 });
}

export async function redisCommand(...command: (string | number)[]) {
  const response = await fetch(process.env.UPSTASH_REDIS_REST_URL!, {
    method: "POST", headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command), signal: AbortSignal.timeout(4_000),
  });
  if (!response.ok) throw new Error("Usage storage unavailable");
  const data = await response.json();
  if (data.error) throw new Error("Usage storage unavailable");
  return data.result;
}

// Vercel replaces this header. Other hosts use the actual socket peer, never a caller's forwarded header.
export function clientAddress(req: NextApiRequest) {
  const forwarded = process.env.VERCEL === "1" ? req.headers["x-vercel-forwarded-for"] : undefined;
  const address = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket.remoteAddress;
  if (!address || !isIP(address)) throw new Error("Client address unavailable");
  return address;
}

export async function reserveUsage(req: NextApiRequest) {
  const address = createHmac("sha256", process.env.SEARCH_AGENT_IP_SALT!).update(clientAddress(req)).digest("hex");
  const hour = Math.floor(Date.now() / 3_600_000);
  if (!sharedStorageConfigured()) {
    for (const key of memoryUsage.keys()) if (key !== hour) memoryUsage.delete(key);
    const usage = memoryUsage.get(hour) || { total: 0, ips: new Map<string, number>() };
    const used = usage.ips.get(address) || 0;
    if (used >= 15 || usage.total >= 100) return false;
    usage.total++;
    usage.ips.set(address, used + 1);
    memoryUsage.set(hour, usage);
    return true;
  }
  const script = `
    local ip = tonumber(redis.call('GET', KEYS[1]) or '0')
    local total = tonumber(redis.call('GET', KEYS[2]) or '0')
    if ip >= 15 or total >= 100 then return 0 end
    redis.call('INCR', KEYS[1]); redis.call('EXPIRE', KEYS[1], 7200)
    redis.call('INCR', KEYS[2]); redis.call('EXPIRE', KEYS[2], 7200)
    return 1
  `;
  return await redisCommand("EVAL", script, 2, `blog:agent:ip:${hour}:${address}`, `blog:agent:total:${hour}`) === 1;
}

export function answerCacheKey(question: string, scope: string, folder: string, revision: string) {
  return `blog:agent:answer:v1:${createHash("sha256").update(JSON.stringify([question.trim().toLowerCase(), scope, folder, revision, agentModel()])).digest("hex")}`;
}

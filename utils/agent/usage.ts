import { createHash, createHmac } from "node:crypto";
import { isIP } from "node:net";
import type { NextApiRequest } from "next";

export function agentConfigured() {
  return !!(process.env.OPENAI_API_KEY && process.env.SEARCH_AGENT_MODEL && process.env.SEARCH_AGENT_IP_SALT && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
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
  return `blog:agent:answer:v1:${createHash("sha256").update(JSON.stringify([question.trim().toLowerCase(), scope, folder, revision, process.env.SEARCH_AGENT_MODEL])).digest("hex")}`;
}

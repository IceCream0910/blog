import type { NextApiRequest, NextApiResponse } from "next";
import { getSearchCatalog } from "../../../utils/search/search-service";
import { normalizeFolderPath } from "../../../utils/search/folders";
import { isSearchScope } from "../../../utils/search/types";
import { agentConfigured, answerCacheKey, redisCommand, reserveUsage } from "../../../utils/agent/usage";
import { runSearchAgent } from "../../../utils/agent/search-agent";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });
  const { question, scope = "all", folder = "" } = req.body || {};
  if (typeof question !== "string" || !question.trim() || question.length > 300 || !isSearchScope(scope) || typeof folder !== "string" || folder.length > 500) {
    return res.status(400).json({ error: "질문과 검색 범위를 확인해 주세요." });
  }
  if (!agentConfigured()) return res.status(503).json({ error: "AI 검색 설정이 준비되지 않았습니다. 일반 검색을 이용해 주세요." });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 50_000);
  const disconnect = () => { if (!res.writableEnded) controller.abort(); };
  res.on("close", disconnect);
  const emit = (event: Record<string, unknown>) => {
    controller.signal.throwIfAborted();
    res.write(`${JSON.stringify(event)}\n`);
  };
  try {
    if (!await reserveUsage(req)) {
      res.setHeader("Retry-After", "3600");
      return res.status(429).json({ error: "AI 검색 사용량 한도에 도달했습니다. 잠시 후 다시 시도하거나 일반 검색을 이용해 주세요." });
    }
    const catalog = await getSearchCatalog();
    const revision = catalog.map((item) => `${item.id}:${item.lastEditedTime}:${item.folderPath}:${item.type}`).sort().join("|");
    const key = answerCacheKey(question, scope, normalizeFolderPath(folder), revision);
    const cached = await redisCommand("GET", key);
    controller.signal.throwIfAborted();
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    if (cached) {
      const result = JSON.parse(cached);
      emit({ type: "sources", sources: result.sources }); emit({ type: "delta", text: result.answer });
    } else {
      const result = await runSearchAgent({ question, scope, folder: normalizeFolderPath(folder), catalog, signal: controller.signal, emit });
      // Cache loss must not discard an otherwise completed answer.
      try { await redisCommand("SET", key, JSON.stringify(result), "EX", 600); } catch {}
    }
    emit({ type: "done" });
    res.end();
  } catch {
    if (res.destroyed) return;
    const error = "AI 답변을 완료하지 못했습니다. 잠시 후 다시 시도하거나 일반 검색을 이용해 주세요.";
    if (res.headersSent) { res.write(`${JSON.stringify({ type: "error", error })}\n`); res.end(); }
    else res.status(503).json({ error });
  } finally {
    clearTimeout(timeout); res.off("close", disconnect);
  }
}

export const config = { maxDuration: 60, api: { bodyParser: { sizeLimit: "8kb" }, responseLimit: "128kb" } };

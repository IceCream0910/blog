import type { NextApiRequest, NextApiResponse } from "next";
import { getSearchCatalog } from "../../../utils/search/search-service";
import { normalizeFolderPath } from "../../../utils/search/folders";
import { isSearchScope } from "../../../utils/search/types";
import { missingAgentSettings, answerCacheKey, getAnswerCache, setAnswerCache, reserveUsage } from "../../../utils/agent/usage";
import { createAnswerEmitter } from "../../../utils/search/answer-stream";
import { runSearchAgent } from "../../../utils/agent/search-agent";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store, no-transform");
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });
  const { question, scope = "all", folder = "" } = req.body || {};
  if (typeof question !== "string" || !question.trim() || question.length > 300 || !isSearchScope(scope) || typeof folder !== "string" || folder.length > 500) {
    return res.status(400).json({ error: "질문과 검색 범위를 확인해 주세요." });
  }
  const missing = missingAgentSettings();
  if (missing.length) {
    console.warn("AI search configuration missing:", missing.join(", "));
    return res.status(503).json({ error: "AI 검색 설정이 준비되지 않았습니다. 일반 검색을 이용해 주세요." });
  }
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
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    emit({ type: "progress", id: "catalog", kind: "status", label: "검색 가능한 글 확인", state: "running" });
    const catalog = await getSearchCatalog();
    emit({ type: "progress", id: "catalog", kind: "status", label: "검색 가능한 글 확인", state: "completed", detail: `${catalog.length}개 공개 글` });
    const revision = catalog.map((item) => `${item.id}:${item.lastEditedTime}:${item.folderPath}:${item.type}`).sort().join("|");
    const key = answerCacheKey(question, scope, normalizeFolderPath(folder), revision);
    const cached = await getAnswerCache(key);
    controller.signal.throwIfAborted();
    if (cached) {
      const result = JSON.parse(cached);
      emit({ type: "progress", id: "cache", kind: "status", label: "저장된 답변 확인", state: "completed" });
      emit({ type: "sources", sources: result.sources });
      createAnswerEmitter(emit)(result.answer);
    } else {
      const result = await runSearchAgent({ question, scope, folder: normalizeFolderPath(folder), catalog, signal: controller.signal, emit });
      // Cache loss must not discard an otherwise completed answer.
      try { await setAnswerCache(key, JSON.stringify(result)); } catch {}
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

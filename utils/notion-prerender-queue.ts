type QueueOptions = {
  deadline: number;
  attemptMs: number;
  maxAttempts: number;
  now?: () => number;
  wait: (ms: number) => Promise<unknown>;
  onFailure?: (id: string, error: unknown) => void;
};

function retryAfterMs(value: string | null | undefined, now: number) {
  if (!value) return 0;
  const seconds = Number(value);
  return Math.max(0, Number.isFinite(seconds) ? seconds * 1000 : Date.parse(value) - now) || 0;
}

export async function drainNotionPrerenderQueue(
  ids: string[],
  prepare: (id: string, signal: AbortSignal) => Promise<void>,
  { deadline, attemptMs, maxAttempts, now = Date.now, wait, onFailure }: QueueOptions,
) {
  const queue = [...new Set(ids)].map((id) => ({ id, attempts: 0, readyAt: 0 }));
  const completed: string[] = [];
  let cooldownUntil = 0;
  while (queue.length && now() < deadline) {
    const time = now();
    const index = time >= cooldownUntil ? queue.findIndex((job) => job.readyAt <= time) : -1;
    if (index === -1) {
      const next = Math.max(cooldownUntil, Math.min(...queue.map((job) => job.readyAt)));
      if (next >= deadline) break;
      await wait(next - time);
      continue;
    }

    const [job] = queue.splice(index, 1);
    const signal = AbortSignal.timeout(Math.min(attemptMs, Math.max(1, deadline - now())));
    try {
      await prepare(job.id, signal);
      completed.push(job.id);
    } catch (error) {
      onFailure?.(job.id, error);
      const status = error?.statusCode ?? error?.status ?? error?.response?.status;
      const delay = 1500 * 2 ** job.attempts++;
      const rateLimited = status === 429 || status === 529;
      if (rateLimited) {
        cooldownUntil = now() + Math.max(delay, retryAfterMs(error?.response?.headers?.get('retry-after'), now()));
      }
      if (job.attempts < maxAttempts && (!status || status === 408 || rateLimited || status >= 500)) {
        job.readyAt = now() + delay;
        queue.push(job);
      }
    }
  }
  return completed;
}

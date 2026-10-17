export function chunkAnswerText(text: string, size = 24) {
  const characters = Array.from(text);
  const chunks: string[] = [];
  const width = Math.max(1, Math.floor(size) || 24);
  for (let index = 0; index < characters.length; index += width) chunks.push(characters.slice(index, index + width).join(""));
  return chunks;
}

export function createAnswerEmitter(emit: (event: Record<string, unknown>) => void) {
  let chunkId = 0;
  return (text: string) => {
    for (const chunk of chunkAnswerText(text)) emit({ type: "delta", text: chunk, chunkId: chunkId++ });
  };
}

// Network frames may contain many deltas; render a bounded amount per UI update.
export class AnswerStreamQueue {
  private pending = "";
  private timer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  private waiters: (() => void)[] = [];
  constructor(private append: (text: string) => void, private interval = 40) {}
  enqueue(text: string) {
    if (this.stopped || !text) return;
    this.pending += text;
    if (this.timer === null) this.tick();
  }
  private tick = () => {
    this.timer = null;
    if (this.stopped) return;
    const characters = Array.from(this.pending);
    if (!characters.length) { this.resolve(); return; }
    const size = Math.max(24, Math.ceil(characters.length / 80));
    this.append(characters.slice(0, size).join(""));
    this.pending = characters.slice(size).join("");
    this.timer = setTimeout(this.tick, this.interval);
  };
  whenIdle() {
    if (this.timer === null && !this.pending) return Promise.resolve();
    return new Promise<void>((resolve) => this.waiters.push(resolve));
  }
  private resolve() { this.waiters.splice(0).forEach((resolve) => resolve()); }
  cancel() {
    this.stopped = true;
    this.pending = "";
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.resolve();
  }
}

export type AgentProgress = {
  id: string;
  kind: "status" | "tool";
  label: string;
  detail?: string;
  state: "running" | "completed" | "error" | "stopped";
};

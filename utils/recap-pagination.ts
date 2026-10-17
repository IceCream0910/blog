export type RecapBodyLayout = "standard" | "scrap" | "hero" | "inline" | "immersive" | "stack";
export type MeasuredRecapBlock = { id: string; type: string; height: number; characters: number; imageRatio?: number };
export type RecapPagePlan = { blockIds: string[]; layout: RecapBodyLayout; visualMaxHeight: number; textMaxHeight: number };
const VISUAL = new Set(["image", "video", "embed", "bookmark", "file", "pdf", "audio"]);
type Unit = { blocks: MeasuredRecapBlock[]; visual: boolean; images: boolean; height: number };

export function paginateRecapSection(blocks: MeasuredRecapBlock[], options: { budget: number; gap: number; sideBySide: boolean; lineHeight: number }): RecapPagePlan[] {
  const { budget, gap, sideBySide, lineHeight } = options;
  const units: Unit[] = [];
  for (const block of blocks) {
    if (block.type === "text" && !block.characters) continue;
    const previous = units.at(-1);
    if (block.type === "image" && previous?.images) {
      previous.blocks.push(block);
      previous.height = Math.max(...previous.blocks.map((image) => image.height)) + 84;
    } else units.push({ blocks: [block], visual: VISUAL.has(block.type), images: block.type === "image", height: block.height });
  }
  const height = (items: Unit[]) => items.reduce((sum, unit) => sum + unit.height, 0) + Math.max(0, items.length - 1) * gap;
  const textLimit = (mixed: boolean) => Math.max(96, Math.min(budget * (mixed ? .52 : .66), lineHeight * (mixed ? 8 : 10)));
  const fits = (items: Unit[]) => {
    const media = items.filter((unit) => unit.visual);
    const text = items.filter((unit) => !unit.visual);
    const required = sideBySide && media.length && text.length ? Math.max(height(media), height(text)) : height(items);
    return required <= budget * .9 && height(text) <= textLimit(!!media.length) && text.length <= (media.length ? 2 : 3);
  };
  const pages: Unit[][] = [];
  let current: Unit[] = [];
  const flush = () => { if (current.length) pages.push(current); current = []; };
  for (const unit of units) {
    if (current.some((item) => item.visual) && !unit.visual) flush();
    if (current.length && !fits([...current, unit])) {
      const copy = unit.visual && !current.at(-1)!.visual ? current.pop()! : null;
      flush();
      if (copy) current.push(copy);
    }
    current.push(unit);
  }
  flush();

  // A visual that exceeded the inline budget still belongs to its nearby passage.
  for (let index = 0; index < pages.length; index++) {
    if (!pages[index].length || !pages[index].every((unit) => unit.visual)) continue;
    const before = pages[index - 1];
    const after = pages[index + 1];
    if (before?.length && !before.at(-1)!.visual) pages[index].unshift(before.pop()!);
    else if (before?.some((unit) => !unit.visual)) { before.push(...pages[index]); pages[index] = []; }
    else if (index === 0 && after?.length && !after[0].visual) pages[index].push(after.shift()!);
  }
  return pages.filter((items) => items.length).map((items) => {
    const visual = items.filter((unit) => unit.visual);
    const text = items.filter((unit) => !unit.visual);
    const allImages = visual.length > 0 && visual.every((unit) => unit.images);
    const stacked = visual.some((unit) => unit.images && unit.blocks.length > 1);
    let layout: RecapBodyLayout = "standard";
    if (visual.length) {
      if (allImages && text.length && !fits(items)) layout = "immersive";
      else if (stacked) layout = "stack";
      else if (allImages && text.length) layout = (visual[0].blocks[0].imageRatio || 1) >= 1.6 ? "hero" : "scrap";
      else layout = "inline";
    }
    const column = sideBySide && visual.length && text.length && layout !== "hero";
    const mediaBudget = column || !text.length ? budget : Math.max(96, budget - Math.min(height(text), textLimit(true)) - gap);
    return {
      blockIds: items.flatMap((unit) => unit.blocks.map((block) => block.id)), layout,
      visualMaxHeight: layout === "immersive" ? budget : Math.max(72, Math.min(budget * (text.length ? .48 : .82), mediaBudget / Math.max(1, visual.length) - (stacked ? 84 : 0))),
      textMaxHeight: layout === "immersive" ? Math.max(96, budget * .55) : textLimit(!!visual.length),
    };
  });
}

export function recapMonthTitle(date: string) {
  const match = date?.match(/^(\d{4}-\d{2})/);
  return match?.[1] || "월말결산";
}

export function recapCoverTitle(post: { date: string; subtitle?: string }) {
  return post.subtitle?.trim().replace(/\\n/g, "\n") || recapMonthTitle(post.date);
}

const HEADING_TYPES = new Set(["header", "sub_header", "sub_sub_header"]);

function blockValue(entry) {
  return entry?.value?.value || entry?.value || entry;
}

function blockText(block) {
  return (block?.properties?.title || []).map((part) => part?.[0] || "").join("").trim();
}

function splitSentences(text, limit = 360) {
  if (text.length <= limit) return [text];
  const sentences = text.match(/[^.!?。！？\n]+[.!?。！？]?|\n+/g) || [text];
  const chunks = [];
  let current = "";
  sentences.forEach((sentence) => {
    const candidate = `${current}${sentence}`;
    if (current && candidate.length > limit) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = candidate;
    }
  });
  if (current.trim()) chunks.push(current.trim());
  return chunks.flatMap((chunk) => chunk.length > limit * 1.5 ? chunk.match(new RegExp(`.{1,${limit}}`, "g")) : [chunk]);
}

export function prepareRecapRecordMap(recordMap, pageId) {
  Object.keys(recordMap.block || {}).forEach((key) => {
    const entry = recordMap.block[key];
    if (entry?.value?.value && entry?.value?.role) recordMap.block[key] = entry.value;
  });

  const normalizedId = Object.keys(recordMap.block || {}).find((key) => key.replace(/-/g, "") === pageId.replace(/-/g, ""));
  const root = blockValue(recordMap.block?.[normalizedId]);
  const sections = [];
  let current = null;

  (root?.content || []).forEach((blockId, index) => {
    const block = blockValue(recordMap.block?.[blockId]);
    if (!block) return;
    if (HEADING_TYPES.has(block.type)) {
      current = { id: `section-${index}`, title: blockText(block) || "기록", blockIds: [] };
      sections.push(current);
      return;
    }
    if (!current) {
      current = { id: "section-intro", title: "이번 달의 기록", blockIds: [] };
      sections.push(current);
    }

    if (block.type === "text") {
      const chunks = splitSentences(blockText(block));
      if (chunks.length > 1) {
        chunks.forEach((chunk, chunkIndex) => {
          const syntheticId = `${blockId}-recap-${chunkIndex}`;
          recordMap.block[syntheticId] = {
            role: recordMap.block[blockId]?.role || "reader",
            value: {
              ...block,
              id: syntheticId,
              content: undefined,
              properties: { ...block.properties, title: [[chunk]] },
            },
          };
          current.blockIds.push(syntheticId);
        });
        return;
      }
    }
    current.blockIds.push(blockId);
  });

  return { recordMap, sections: sections.filter((section) => section.title || section.blockIds.length) };
}

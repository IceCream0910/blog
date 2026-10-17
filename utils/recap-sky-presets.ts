// Sky Presets from https://feralui.dev/gradients, used with the supplied Sky shader.
export const SKY_PRESETS = [
  { name: "Blue sky", stops: ["#E6F2FF", "#B3D9FF", "#80B3FF", "#6699E6"], scale: 45, distortion: 50, swirl: 40, speed: 22, grain: 4 },
  { name: "Madder dusk", stops: ["#FFE3C7", "#F2B8A0", "#C77E9E", "#7A5E9E"], scale: 45, distortion: 50, swirl: 40, speed: 20, grain: 6 },
  { name: "Golden hour", stops: ["#FFF3D6", "#FFD9A0", "#FFAE66", "#E07A52"], scale: 45, distortion: 54, swirl: 34, speed: 18, grain: 5 },
  { name: "Night sky", stops: ["#B9C8F2", "#6E7FBF", "#4A5AA0", "#33406E"], scale: 42, distortion: 46, swirl: 28, speed: 14, grain: 8 },
  { name: "Storm light", stops: ["#E8EAEE", "#B7BDC9", "#8C94A4", "#596273"], scale: 52, distortion: 62, swirl: 58, speed: 30, grain: 8 },
  { name: "Blossom sky", stops: ["#FFEFF6", "#F2C4DC", "#C9A6E8", "#7E8FD0"], scale: 45, distortion: 50, swirl: 40, speed: 22, grain: 4 },
  { name: "Mint sky", stops: ["#EAFBF4", "#A9E6D2", "#64BFC2", "#3E7FA6"], scale: 45, distortion: 50, swirl: 40, speed: 22, grain: 4 },
  { name: "Coral haze", stops: ["#FFEDE8", "#FFC2B0", "#F28C9C", "#D96C8F"], scale: 48, distortion: 52, swirl: 36, speed: 20, grain: 5 },
  { name: "Grape dusk", stops: ["#EFD9FF", "#C9A6F2", "#9B7BD9", "#6E5AB8"], scale: 44, distortion: 50, swirl: 30, speed: 18, grain: 6 },
  { name: "Deep sea", stops: ["#C7F2EC", "#6FC2C4", "#3E8FA8", "#2A5E8C"], scale: 46, distortion: 56, swirl: 40, speed: 22, grain: 6 },
  { name: "Ink sky", stops: ["#F2F2F0", "#C4C6C9", "#8E9094", "#55585E"], scale: 48, distortion: 58, swirl: 44, speed: 24, grain: 10 },
  { name: "Crimson sky", stops: ["#FFD9D0", "#F29A8C", "#D9556B", "#A63D6E"], scale: 44, distortion: 56, swirl: 36, speed: 20, grain: 6 },
] as const;

export function chooseSkyPreset(random = Math.random) {
  return SKY_PRESETS[Math.min(SKY_PRESETS.length - 1, Math.max(0, Math.floor(random() * SKY_PRESETS.length)))];
}

export function skyTones(stops: readonly string[]) {
  const rgb = (hex: string) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  return { high: rgb(stops[0]), main: rgb(stops[1]), mid: rgb(stops[2]), low: rgb(stops[3]) };
}

export function skyPresetForPost(postId: string) {
  const key = postId.replace(/-/g, "").toLowerCase();
  let hash = 2166136261;
  for (let index = 0; index < key.length; index++) hash = Math.imul(hash ^ key.charCodeAt(index), 16777619);
  return SKY_PRESETS[(hash >>> 0) % SKY_PRESETS.length];
}

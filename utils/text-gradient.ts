export type TextGradient = {
  from: string;
  to: string;
};

export const textGradientPalette: TextGradient[] = [
  { from: "#d65858", to: "#f54e4e" },
  { from: "#8534bf", to: "#8b5cf6" },
  { from: "#ffc870", to: "#ffbf00" },
  { from: "#2ee8ab", to: "#09b881" },
  { from: "#3b82f6", to: "#2563eb" },
  { from: "#f29a3d", to: "#faa748" },
  { from: "#ffa6d2", to: "#f06eae" },
];

export function getTextGradient(text: string): TextGradient {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = text.charCodeAt(index) + ((hash << 5) - hash);
  }
  return textGradientPalette[Math.abs(hash) % textGradientPalette.length];
}

export function getGradientTextColor(gradient: TextGradient) {
  const hex = gradient.from.replace("#", "");
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
  return brightness > 128 ? "#000000" : "#ffffff";
}

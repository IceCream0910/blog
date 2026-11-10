type Point = { x: number; y: number };
type Size = { width: number; height: number };

export function compactGraphBounds({ width, height }: Size) {
  const padding = Math.min(18, width / 2, height / 2);
  return { left: padding, top: padding, right: width - padding, bottom: height - padding };
}

export function fitCompactGraph(points: Point[], size: Size) {
  const { left, top, right, bottom } = compactGraphBounds(size);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const { x, y } of points) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const scale = Math.min(1, (right - left) / Math.max(1, maxX - minX), (bottom - top) / Math.max(1, maxY - minY));
  return {
    scale,
    points: points.map(({ x, y }) => ({
      x: size.width / 2 + (x - (minX + maxX) / 2) * scale,
      y: size.height / 2 + (y - (minY + maxY) / 2) * scale,
    })),
  };
}

export const clampNumber = (value, min, max) =>
  Math.min(Math.max(Number(value) || 0, min), max);

export const screenPointToPdf = ({ clientX, clientY, bounds, pageWidth, pageHeight }) => ({
  x: clampNumber(((clientX - bounds.left) / bounds.width) * pageWidth, 0, pageWidth),
  y: clampNumber(((clientY - bounds.top) / bounds.height) * pageHeight, 0, pageHeight),
});

export const normalizedRectangle = (start, end) => ({
  x: Math.min(start.x, end.x),
  y: Math.min(start.y, end.y),
  width: Math.abs(end.x - start.x),
  height: Math.abs(end.y - start.y),
});

export const movePdfShape = (shape, dx, dy, pageWidth, pageHeight) => {
  if (shape.type === "pen") {
    const points = shape.points || [];
    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));
    const boundedDx = clampNumber(dx, -minX, pageWidth - maxX);
    const boundedDy = clampNumber(dy, -minY, pageHeight - maxY);
    return {
      ...shape,
      points: points.map((point) => ({ x: point.x + boundedDx, y: point.y + boundedDy })),
    };
  }

  if (shape.type === "arrow") {
    const minX = Math.min(shape.x, shape.x2);
    const maxX = Math.max(shape.x, shape.x2);
    const minY = Math.min(shape.y, shape.y2);
    const maxY = Math.max(shape.y, shape.y2);
    const boundedDx = clampNumber(dx, -minX, pageWidth - maxX);
    const boundedDy = clampNumber(dy, -minY, pageHeight - maxY);
    return {
      ...shape,
      x: shape.x + boundedDx,
      y: shape.y + boundedDy,
      x2: shape.x2 + boundedDx,
      y2: shape.y2 + boundedDy,
    };
  }

  const width = shape.width || 0;
  const height = shape.height || 0;
  return {
    ...shape,
    x: clampNumber(shape.x + dx, 0, Math.max(0, pageWidth - width)),
    y: clampNumber(shape.y + dy, 0, Math.max(0, pageHeight - height)),
  };
};

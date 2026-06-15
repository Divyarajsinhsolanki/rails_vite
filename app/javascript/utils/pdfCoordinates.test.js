import { describe, expect, it } from "vitest";
import {
  movePdfShape,
  normalizedRectangle,
  screenPointToPdf,
} from "./pdfCoordinates";

describe("PDF coordinate helpers", () => {
  it("maps screen positions into unscaled page coordinates", () => {
    expect(screenPointToPdf({
      clientX: 150,
      clientY: 250,
      bounds: { left: 50, top: 50, width: 400, height: 800 },
      pageWidth: 200,
      pageHeight: 400,
    })).toEqual({ x: 50, y: 100 });
  });

  it("normalizes rectangles drawn in any direction", () => {
    expect(normalizedRectangle({ x: 80, y: 60 }, { x: 20, y: 10 }))
      .toEqual({ x: 20, y: 10, width: 60, height: 50 });
  });

  it("keeps moved shapes inside page bounds", () => {
    expect(movePdfShape(
      { type: "rectangle", x: 90, y: 90, width: 20, height: 20 },
      30,
      30,
      100,
      100
    )).toMatchObject({ x: 80, y: 80 });
  });
});

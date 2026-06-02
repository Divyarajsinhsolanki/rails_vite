import React, { useEffect, useState } from "react";
import Draggable from "react-draggable";
import { Check, X } from "lucide-react";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const safeDimension = (value) => (Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : 0);

/**
 * Allows users to place elements (Text, Stamps, Signatures) on top of the PDF page.
 * Coordinates emitted to the form are unscaled PDF coordinates, while the marker is
 * rendered in screen pixels so it stays accurate at every zoom level.
 */
const DraggableOverlay = ({
  activeTool,
  onConfirmPosition,
  onPlacementChange,
  onCancel,
  placementCoordinates,
  scale = 1,
  pageWidth,
  pageHeight,
}) => {
  const nodeRef = React.useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [bounds, setBounds] = useState("parent");

  const markerWidth = 120;
  const markerHeight = 90;
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;

  const getMaxPosition = () => ({
    x: Math.max(0, safeDimension(pageWidth) - markerWidth),
    y: Math.max(0, safeDimension(pageHeight) - markerHeight),
  });

  const clampPosition = (nextPosition) => {
    const maxPosition = getMaxPosition();

    return {
      x: clamp(Number(nextPosition.x) || 0, 0, maxPosition.x),
      y: clamp(Number(nextPosition.y) || 0, 0, maxPosition.y),
    };
  };

  useEffect(() => {
    const maxPosition = getMaxPosition();
    setBounds({
      left: 0,
      top: 0,
      right: maxPosition.x,
      bottom: maxPosition.y,
    });
  }, [pageWidth, pageHeight]);

  useEffect(() => {
    if (!placementCoordinates) return;

    const maxPosition = getMaxPosition();
    const nextX = clamp(Math.max(0, Number(placementCoordinates.x) || 0) * safeScale, 0, maxPosition.x);
    const nextY = clamp(Math.max(0, Number(placementCoordinates.y) || 0) * safeScale, 0, maxPosition.y);

    setPosition({ x: nextX, y: nextY });
  }, [placementCoordinates, safeScale, pageWidth, pageHeight]);

  const emitPosition = (nextPosition) => {
    const boundedPosition = clampPosition(nextPosition);
    const nextCoordinates = {
      x: Math.round(boundedPosition.x / safeScale),
      y: Math.round(boundedPosition.y / safeScale),
      scale: safeScale,
    };

    onPlacementChange?.(nextCoordinates);
    return nextCoordinates;
  };

  const handleDrag = (e, data) => {
    const nextPosition = clampPosition({ x: data.x, y: data.y });
    setPosition(nextPosition);
    emitPosition(nextPosition);
  };

  const handleConfirm = () => {
    onConfirmPosition(emitPosition(position));
  };

  if (!activeTool) return null;

  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      <Draggable
        nodeRef={nodeRef}
        position={position}
        onDrag={handleDrag}
        onStop={handleDrag}
        bounds={bounds}
        handle=".handle"
      >
        <div ref={nodeRef} className="pointer-events-auto absolute flex flex-col items-center group">
          <div className="handle cursor-move rounded-lg bg-indigo-600 px-3 py-2 text-white shadow-lg shadow-indigo-200 flex items-center gap-2 select-none transition-all hover:bg-indigo-700">
            <span className="text-sm font-bold capitalize">{activeTool.replace(/([A-Z])/g, ' $1').trim()}</span>
          </div>

          <div className="mt-2 flex min-h-[44px] min-w-[112px] items-center justify-center rounded-lg border-2 border-dashed border-indigo-400 bg-indigo-50/80 p-2 shadow-sm">
            <span className="text-xs font-bold text-indigo-700">
              X {Math.round(position.x / safeScale)}, Y {Math.round(position.y / safeScale)}
            </span>
          </div>

          <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handleConfirm}
              className="bg-green-500 text-white p-1 rounded-full hover:bg-green-600 shadow-md"
              title="Confirm Position"
            >
              <Check size={16} />
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-md"
              title="Cancel"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </Draggable>
    </div>
  );
};

export default DraggableOverlay;

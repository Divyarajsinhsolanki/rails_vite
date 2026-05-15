import React, { useEffect, useState } from "react";
import Draggable from "react-draggable";
import { Check, X } from "lucide-react";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

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

  useEffect(() => {
    if (pageWidth && pageHeight) {
      setBounds({
        left: 0,
        top: 0,
        right: Math.max(0, pageWidth - markerWidth),
        bottom: Math.max(0, pageHeight - markerHeight),
      });
    } else {
      setBounds("parent");
    }
  }, [pageWidth, pageHeight]);

  useEffect(() => {
    if (!placementCoordinates) return;

    const maxX = Math.max(0, (pageWidth || 0) - markerWidth);
    const maxY = Math.max(0, (pageHeight || 0) - markerHeight);
    const nextX = clamp((Number(placementCoordinates.x) || 0) * scale, 0, maxX || Infinity);
    const nextY = clamp((Number(placementCoordinates.y) || 0) * scale, 0, maxY || Infinity);

    setPosition({ x: nextX, y: nextY });
  }, [placementCoordinates, scale, pageWidth, pageHeight]);

  const emitPosition = (nextPosition) => {
    const nextCoordinates = {
      x: Math.round(nextPosition.x / scale),
      y: Math.round(nextPosition.y / scale),
      scale,
    };

    onPlacementChange?.(nextCoordinates);
    return nextCoordinates;
  };

  const handleDrag = (e, data) => {
    const nextPosition = { x: data.x, y: data.y };
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
          <div className="handle cursor-move bg-[var(--theme-color)] bg-opacity-90 text-white p-2 rounded shadow-lg flex items-center gap-2 select-none hover:bg-opacity-100 transition-all">
            <span className="text-sm font-bold capitalize">{activeTool.replace(/([A-Z])/g, ' $1').trim()}</span>
          </div>

          <div className="mt-2 border-2 border-dashed border-[var(--theme-color)] bg-[rgba(var(--theme-color-rgb),0.1)] p-2 rounded min-w-[100px] min-h-[40px] flex items-center justify-center">
            <span className="text-xs text-[var(--theme-color)] opacity-70">
              X {Math.round(position.x / scale)}, Y {Math.round(position.y / scale)}
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

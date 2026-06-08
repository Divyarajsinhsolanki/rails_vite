import React, { useEffect, useState } from "react";
import Draggable from "react-draggable";
import { Check, GripVertical, Type, X } from "lucide-react";

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
  textDraft,
  setTextDraft,
  scale = 1,
  pageWidth,
  pageHeight,
}) => {
  const nodeRef = React.useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [bounds, setBounds] = useState("parent");

  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const isTextTool = activeTool === "addText";
  const toolLabel = activeTool.replace(/([A-Z])/g, " $1").trim();
  const markerWidth = isTextTool
    ? Math.min(Math.max(safeDimension(pageWidth) * 0.42, 220), 340)
    : 120;
  const markerHeight = isTextTool ? 172 : 90;
  const textValue = textDraft?.text ?? "";
  const textColor = textDraft?.color || "#111827";
  const textFontSize = Math.min(Math.max(Number(textDraft?.fontSize || 14) * safeScale, 12), 32);

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
    onConfirmPosition?.(emitPosition(position));
  };

  const handleTextChange = (event) => {
    const nextText = event.target.value;
    setTextDraft?.((previous) => ({ ...(previous || {}), text: nextText }));
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
        <div ref={nodeRef} className="pointer-events-auto absolute group" style={{ width: markerWidth }}>
          {isTextTool ? (
            <div className="rounded-lg border border-indigo-200 bg-white/95 p-2 shadow-2xl shadow-indigo-950/20 backdrop-blur">
              <div className="handle flex cursor-move select-none items-center justify-between gap-2 rounded-md bg-slate-950 px-2.5 py-2 text-white">
                <div className="flex min-w-0 items-center gap-2">
                  <GripVertical className="h-4 w-4 shrink-0 text-indigo-200" />
                  <Type className="h-4 w-4 shrink-0 text-indigo-200" />
                  <span className="truncate text-xs font-black uppercase tracking-wide">Add Text</span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500 text-white shadow-sm transition hover:bg-emerald-600"
                    title="Use this position"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-white transition hover:bg-red-500"
                    title="Cancel"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <textarea
                value={textValue}
                onChange={handleTextChange}
                placeholder="Type text"
                rows={3}
                spellCheck={false}
                style={{ color: textColor, fontSize: `${textFontSize}px` }}
                className="mt-2 min-h-[92px] w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold leading-snug shadow-inner outline-none transition placeholder:text-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              <div className="mt-2 flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-wide text-slate-400">
                <span>X {Math.round(position.x / safeScale)}, Y {Math.round(position.y / safeScale)}</span>
                <span>{Math.round(Number(textDraft?.fontSize || 14))}px</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="handle flex cursor-move select-none items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700">
                <GripVertical className="h-4 w-4" />
                <span className="text-sm font-bold capitalize">{toolLabel}</span>
              </div>

              <div className="mt-2 flex min-h-[44px] min-w-[112px] items-center justify-center rounded-lg border-2 border-dashed border-indigo-400 bg-indigo-50/80 p-2 shadow-sm">
                <span className="text-xs font-bold text-indigo-700">
                  X {Math.round(position.x / safeScale)}, Y {Math.round(position.y / safeScale)}
                </span>
              </div>

              <div className="mt-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="rounded-full bg-green-500 p-1 text-white shadow-md hover:bg-green-600"
                  title="Use this position"
                >
                  <Check size={16} />
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-full bg-red-500 p-1 text-white shadow-md hover:bg-red-600"
                  title="Cancel"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </Draggable>
    </div>
  );
};

export default DraggableOverlay;

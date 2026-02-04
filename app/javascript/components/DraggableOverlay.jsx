import React, { useState, useEffect } from "react";
import Draggable from "react-draggable";
import { X, Check } from "lucide-react";

/**
 * DraggableOverlay Component
 * 
 * Allows users to place elements (Text, Stamps, Signatures) on top of the PDF page.
 * returns the X/Y coordinates relative to the page.
 */
const DraggableOverlay = ({
  activeTool,
  onConfirmPosition,
  onCancel,
  scale = 1,
  pageWidth,
  pageHeight
}) => {
  const nodeRef = React.useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [bounds, setBounds] = useState("parent");

  useEffect(() => {
    if (pageWidth && pageHeight) {
      setBounds({
        left: 0,
        top: 0,
        right: pageWidth - 100, // Approximate width of the element
        bottom: pageHeight - 50 // Approximate height
      });
    } else {
      setBounds("parent");
    }
  }, [pageWidth, pageHeight]);

  const handleStop = (e, data) => {
    setPosition({ x: data.x, y: data.y });
  };

  const handleConfirm = () => {
    // Return coordinates normalized to the PDF scale (unscaled)
    // If the PDF is displayed at 1.5x (scale=1.5), we need to divide by scale to get original PDF points
    // However, react-pdf usually handles scale internally. 
    // We typically want the coordinates relative to the *rendered* size, 
    // and then the parent component converts them to PDF points.
    // Let's pass the raw rendered coordinates and the scale.
    onConfirmPosition({ x: position.x, y: position.y, scale });
  };

  if (!activeTool) return null;

  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      <Draggable
        nodeRef={nodeRef}
        position={position}
        onStop={handleStop}
        bounds={bounds}
        handle=".handle"
      >
        <div ref={nodeRef} className="pointer-events-auto absolute flex flex-col items-center group">
          <div className="handle cursor-move bg-[var(--theme-color)] bg-opacity-90 text-white p-2 rounded shadow-lg flex items-center gap-2 select-none hover:bg-opacity-100 transition-all">
            <span className="text-sm font-bold capitalize">{activeTool.replace(/([A-Z])/g, ' $1').trim()}</span>
          </div>

          {/* Visual Preview of the Element */}
          <div className="mt-2 border-2 border-dashed border-[var(--theme-color)] bg-[rgba(var(--theme-color-rgb),0.1)] p-2 rounded min-w-[100px] min-h-[40px] flex items-center justify-center">
            <span className="text-xs text-[var(--theme-color)] opacity-70">Drop Here</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleConfirm}
              className="bg-green-500 text-white p-1 rounded-full hover:bg-green-600 shadow-md"
              title="Confirm Position"
            >
              <Check size={16} />
            </button>
            <button
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

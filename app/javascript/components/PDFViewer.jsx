// app/javascript/components/PDFViewer.jsx
import React, { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerSrc;

const PDFViewer = ({ pdfPath }) => {
  const [pdf, setPdf] = useState(null);
  const [scale, setScale] = useState(1.5);
  const [annotations, setAnnotations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const containerRef = useRef(null);
  const toolbarRef = useRef(null);
  const annotationId = useRef(0);

  useEffect(() => {
    const loadPDF = async () => {
      const loadingTask = getDocument(pdfPath);
      const loadedPdf = await loadingTask.promise;
      setPdf(loadedPdf);
    };
    loadPDF();
  }, [pdfPath]);

  const renderPage = async (pageNum, canvas) => {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const context = canvas.getContext('2d');

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;
    return { width: viewport.width, height: viewport.height };
  };

  useEffect(() => {
    if (!pdf) return;

    const renderAllPages = async () => {
      const container = containerRef.current;
      container.innerHTML = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const wrapper = document.createElement('div');
        wrapper.className = 'relative mb-6';

        const canvas = document.createElement('canvas');
        canvas.className = 'border shadow';
        const dim = await renderPage(i, canvas);

        const overlay = document.createElement('div');
        overlay.className = 'editor-layer absolute top-0 left-0';
        overlay.style.width = `${dim.width}px`;
        overlay.style.height = `${dim.height}px`;
        overlay.dataset.page = i;

        overlay.onclick = (e) => {
          const rect = overlay.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const id = annotationId.current++;

          setAnnotations((prev) => [...prev, { id, x, y, text: 'Edit me', page: i, style: {} }]);
        };

        wrapper.appendChild(canvas);
        wrapper.appendChild(overlay);
        container.appendChild(wrapper);
      }
    };

    renderAllPages();
  }, [pdf, scale]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    annotations.forEach(({ id, x, y, text, page, style }) => {
      if (document.getElementById(`annotation-${id}`)) return;

      const overlay = container.querySelector(`.editor-layer[data-page="${page}"]`);
      if (!overlay) return;

      const div = document.createElement('div');
      div.id = `annotation-${id}`;
      div.contentEditable = true;
      div.innerText = text;
      div.className = 'absolute bg-yellow-100 border border-yellow-300 px-2 py-1 rounded cursor-move text-sm';
      div.style.left = `${x}px`;
      div.style.top = `${y}px`;
      Object.assign(div.style, style);

      div.onmousedown = (e) => {
        const offsetX = e.offsetX;
        const offsetY = e.offsetY;

        const onMouseMove = (ev) => {
          div.style.left = `${ev.clientX - overlay.getBoundingClientRect().left - offsetX}px`;
          div.style.top = `${ev.clientY - overlay.getBoundingClientRect().top - offsetY}px`;
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };

      div.onclick = (e) => {
        setSelectedId(id);
        const rect = div.getBoundingClientRect();
        const toolbar = toolbarRef.current;
        toolbar.style.left = `${rect.left}px`;
        toolbar.style.top = `${rect.top - 40}px`;
        toolbar.style.display = 'flex';
      };

      div.onblur = () => {
        const newText = div.innerText;
        setAnnotations((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, text: newText } : a
          )
        );
      };

      overlay.appendChild(div);
    });
  }, [annotations]);

  const updateStyle = (styleKey, value) => {
    setAnnotations((prev) =>
      prev.map((a) =>
        a.id === selectedId ? { ...a, style: { ...a.style, [styleKey]: value } } : a
      )
    );
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-4xl relative">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => setScale((s) => s + 0.25)} className="px-3 py-1 bg-blue-500 text-white rounded">Zoom In</button>
          <button onClick={() => setScale((s) => Math.max(0.5, s - 0.25))} className="px-3 py-1 bg-blue-500 text-white rounded">Zoom Out</button>
          <button onClick={() => setScale(1.5)} className="px-3 py-1 bg-gray-500 text-white rounded">Reset</button>
          <span className="ml-4 text-sm text-gray-600">Zoom: {scale.toFixed(2)}x</span>
        </div>

        <div
          ref={toolbarRef}
          style={{ display: 'none' }}
          className="absolute z-50 bg-white border border-gray-300 p-1 rounded shadow flex gap-1"
        >
          <button onClick={() => updateStyle('fontWeight', 'bold')} className="px-2 py-1 text-sm">B</button>
          <button onClick={() => updateStyle('fontStyle', 'italic')} className="px-2 py-1 text-sm">I</button>
          <button onClick={() => updateStyle('textDecoration', 'underline')} className="px-2 py-1 text-sm">U</button>
          <select onChange={(e) => updateStyle('fontSize', e.target.value)} className="text-sm">
            <option value="12px">12</option>
            <option value="16px">16</option>
            <option value="20px">20</option>
            <option value="24px">24</option>
          </select>
          <input type="color" onChange={(e) => updateStyle('color', e.target.value)} />
        </div>

        <div ref={containerRef} className="overflow-auto max-h-[80vh] p-2 bg-white rounded shadow-inner" />
      </div>
    </div>
  );
};

export default PDFViewer;

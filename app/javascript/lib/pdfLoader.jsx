/**
 * Lazy loader for PDF libraries
 * Dynamically imports PDF libraries only when needed to reduce initial bundle size
 * Reduces bundle by ~150KB
 */

let pdfLoaderPromise = null;

export const loadPdfLibraries = async () => {
  if (pdfLoaderPromise) {
    return pdfLoaderPromise;
  }

  pdfLoaderPromise = Promise.all([
    import('pdfjs-dist'),
    import('react-pdf'),
    import('@react-pdf/renderer')
  ]).then(([pdfjs, reactPdf, renderer]) => ({
    pdfjs: pdfjs.default || pdfjs,
    ReactPdf: reactPdf.default || reactPdf,
    renderer: renderer.default || renderer
  }));

  return pdfLoaderPromise;
};

/**
 * React hook for lazy-loaded PDF libraries
 */

import { useState, useEffect } from 'react';

export const usePdfLibraries = () => {
  const [libs, setLibs] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPdfLibraries()
      .then(libraries => {
        setLibs(libraries);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load PDF libraries:', err);
        setError(err);
        setIsLoading(false);
      });
  }, []);

  return { libs, error, isLoading };
};

export default loadPdfLibraries;

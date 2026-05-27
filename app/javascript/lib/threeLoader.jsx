/**
 * Lazy loader for Three.js
 * Dynamically imports Three.js only when needed to reduce initial bundle size
 */

let threeLoadPromise = null;

export const loadThree = async () => {
  if (threeLoadPromise) {
    return threeLoadPromise;
  }

  threeLoadPromise = import('three').then(module => module.default || module);
  return threeLoadPromise;
};

/**
 * React wrapper for lazy-loaded Three.js
 * Usage:
 * const THREE = useThree();
 */

import { useState, useEffect } from 'react';

export const useThree = () => {
  const [THREE, setTHREE] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadThree()
      .then(three => {
        setTHREE(three);
      })
      .catch(err => {
        console.error('Failed to load Three.js:', err);
        setError(err);
      });
  }, []);

  return { THREE, error, isLoaded: !!THREE };
};

export default loadThree;

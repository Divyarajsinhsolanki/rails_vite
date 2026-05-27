/**
 * Global Loading Manager
 * Centralized loading state to prevent multiple spinners
 * 
 * Usage:
 * import { useGlobalLoading } from './globalLoadingManager';
 * 
 * const { isLoading, startLoading, stopLoading } = useGlobalLoading();
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

const GlobalLoadingContext = createContext();

export const GlobalLoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Loading...');
  
  const startLoading = useCallback((msg = 'Loading...') => {
    setMessage(msg);
    setIsLoading(true);
  }, []);
  
  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);
  
  const value = {
    isLoading,
    message,
    startLoading,
    stopLoading,
  };
  
  return (
    <GlobalLoadingContext.Provider value={value}>
      {children}
    </GlobalLoadingContext.Provider>
  );
};

/**
 * Hook to access global loading state
 * @returns {Object} { isLoading, message, startLoading, stopLoading }
 */
export const useGlobalLoading = () => {
  const context = useContext(GlobalLoadingContext);
  if (!context) {
    throw new Error('useGlobalLoading must be used within GlobalLoadingProvider');
  }
  return context;
};

export default GlobalLoadingContext;

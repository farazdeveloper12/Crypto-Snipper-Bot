// src/components/ErrorDetector.js
import React, { useEffect } from 'react';

const ErrorDetector = () => {
  useEffect(() => {
    // Override console.error to capture more details
    const originalError = console.error;
    console.error = function(...args) {
      if (args[0] && args[0].includes && args[0].includes('Objects are not valid as a React child')) {
        console.warn('STYLE OBJECT ERROR DETECTED');
        console.warn(new Error().stack);
      }
      return originalError.apply(console, args);
    };
    
    return () => {
      console.error = originalError;
    };
  }, []);
  
  return null;
};

export default ErrorDetector;
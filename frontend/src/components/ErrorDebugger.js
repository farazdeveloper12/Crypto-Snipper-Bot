// src/components/ErrorDebugger.js
import React, { useState, useEffect } from 'react';

// This component doesn't actually render anything
// It just searches for style object misuse patterns in your components
const ErrorDebugger = () => {
  useEffect(() => {
    // Look for potential issues in the DOM
    setTimeout(() => {
      console.log('Scanning for style object misuse...');
      
      // Common incorrect patterns to look for
      const incorrectPatterns = [
        'my', 'display', 'alignItems',    // Style object property names from the error
        'sx: {', '{...style',             // Spread syntax misuse
        'sx={{...', 'children: {'         // Common incorrect patterns
      ];
      
      // Get all script tags (where your component code might be)
      const scripts = document.querySelectorAll('script');
      
      scripts.forEach(script => {
        if (script.textContent) {
          const content = script.textContent;
          incorrectPatterns.forEach(pattern => {
            if (content.includes(pattern)) {
              const index = content.indexOf(pattern);
              const context = content.substring(
                Math.max(0, index - 100), 
                Math.min(content.length, index + 100)
              );
              console.log(`Potential issue found near: ${pattern}`);
              console.log(context);
            }
          });
        }
      });
      
      console.log('Debugging scan complete.');
    }, 2000);
  }, []);
  
  return null; // This component doesn't render anything
};

export default ErrorDebugger;
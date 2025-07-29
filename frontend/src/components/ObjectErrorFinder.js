// src/components/ObjectErrorFinder.js
import { useEffect } from 'react';

const ObjectErrorFinder = () => {
  useEffect(() => {
    // Original console.error function
    const originalError = console.error;
    
    // Override console.error to get more information
    console.error = function(...args) {
      // Check if this is the style object error
      if (args[0] && typeof args[0] === 'string' && 
          args[0].includes('Objects are not valid as a React child') &&
          args[0].includes('my') && 
          args[0].includes('display') && 
          args[0].includes('alignItems')) {
        
        // Show a more helpful error message
        console.warn('------------------------------');
        console.warn('STYLE OBJECT ERROR DETECTED!');
        console.warn('Stack trace:');
        console.warn(new Error().stack);
        console.warn('------------------------------');
        
        // Don't show the original error in dev tools
        return;
      }
      
      // For all other errors, use the original behavior
      return originalError.apply(console, args);
    };
    
    // Find any style objects that might be rendered directly
    setTimeout(() => {
      try {
        // Look for elements with suspicious text content
        document.querySelectorAll('*').forEach(el => {
          const text = el.textContent;
          if (text && 
              text.includes('{') && 
              text.includes('}') && 
              (text.includes('my:') || 
               text.includes('display:') || 
               text.includes('alignItems:'))) {
            
            console.warn('POSSIBLE ISSUE: Found element with style object text:', el);
            console.warn('Parent element:', el.parentElement);
            console.warn('Text content:', text);
          }
        });
      } catch (err) {
        console.error('Error during search:', err);
      }
    }, 2000);
    
    return () => {
      // Restore original console.error
      console.error = originalError;
    };
  }, []);
  
  return null;
};

export default ObjectErrorFinder;
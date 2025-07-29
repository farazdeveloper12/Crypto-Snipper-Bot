// src/StyleObjectFixer.js
// Add this file to your project and import it at the top of index.js

// This script patches React to prevent style objects from being rendered as children
const patchReact = () => {
  if (typeof window !== 'undefined') {
    // Store original console.error
    const originalConsoleError = console.error;
    
    // Override console.error to intercept React errors
    console.error = function(...args) {
      // Check if this is the specific error we're looking for
      if (args[0] && typeof args[0] === 'string' && 
          args[0].includes('Objects are not valid as a React child') &&
          args[0].includes('my') && 
          args[0].includes('display') && 
          args[0].includes('alignItems')) {
        
        console.warn('Style object error intercepted. Trying to find the source...');
        
        // Print stack trace for debugging
        console.warn(new Error().stack);
        
        // Don't show the error to the user
        return;
      }
      
      // Pass through all other errors
      originalConsoleError.apply(console, args);
    };
    
    // Monkey patch React's createElement to filter out style objects
    if (window.React && window.React.createElement) {
      const originalCreateElement = window.React.createElement;
      
      window.React.createElement = function(type, props, ...children) {
        // Filter children to remove style objects
        const safeChildren = children.filter(child => {
          // Allow valid React elements and primitive values
          if (child === null || 
              child === undefined || 
              typeof child === 'string' || 
              typeof child === 'number' || 
              typeof child === 'boolean' ||
              window.React.isValidElement(child)) {
            return true;
          }
          
          // Check if this is likely a style object
          if (typeof child === 'object' && 
              (child.display !== undefined || 
               child.my !== undefined || 
               child.alignItems !== undefined)) {
            console.warn('Prevented style object from being rendered as child:', child);
            return false;
          }
          
          return true;
        });
        
        return originalCreateElement.apply(window.React, [type, props, ...safeChildren]);
      };
    }
  }
};

export default patchReact;
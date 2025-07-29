import { useEffect } from 'react';

const ErrorFinder = () => {
  useEffect(() => {
    console.log("Starting error search...");
    
    // Give time for components to render
    setTimeout(() => {
      // Search for elements that might have style objects rendered as text
      document.querySelectorAll('*').forEach(element => {
        if (element.childNodes) {
          // Check each text node
          element.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && node.textContent) {
              const text = node.textContent.trim();
              // Look for text that resembles a style object
              if (text.startsWith('{') && text.includes('my:') || text.includes('display:') || text.includes('alignItems:')) {
                console.error("FOUND POTENTIAL ERROR HERE:", element);
                console.error("TEXT CONTENT:", text);
                console.error("PARENT:", element.parentElement);
                
                // Highlight the problematic element with a red border
                element.style.border = "3px solid red";
              }
            }
          });
        }
      });
      
      console.log("Error search complete.");
    }, 2000);
  }, []);
  
  return null;
};

export default ErrorFinder;
"use client";

import { useEffect } from "react";

export default function DevErrorSuppressor() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    // Add script to suppress FullStory errors
    const script = document.createElement("script");
    script.innerHTML = `
      // Override console.error to filter out FullStory errors
      (function() {
        const originalError = console.error;
        console.error = function(...args) {
          const message = args.join(' ');
          if (
            message.includes('Failed to fetch') && 
            (message.includes('fullstory') || message.includes('edge.fullstory.com'))
          ) {
            console.warn('🔇 Suppressed FullStory error');
            return;
          }
          originalError.apply(console, args);
        };

        // Suppress unhandled promise rejections from FullStory
        window.addEventListener('unhandledrejection', function(event) {
          const message = event.reason?.message || String(event.reason);
          if (
            message.includes('Failed to fetch') && 
            (message.includes('fullstory') || message.includes('edge.fullstory.com'))
          ) {
            console.warn('🔇 Suppressed FullStory rejection');
            event.preventDefault();
          }
        });

        console.log('🛡️ Development error suppression active');
      })();
    `;
    
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return null;
}

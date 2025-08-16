"use client";

import { ReactNode, useEffect } from "react";

interface DevErrorSuppressorProps {
  children: ReactNode;
}

export default function DevErrorSuppressor({ children }: DevErrorSuppressorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // Suppress common development errors in console
      const originalError = console.error;
      console.error = (...args) => {
        // Filter out common development noise
        const message = args.join(" ");
        if (
          message.includes("Warning: ReactDOM.render is no longer supported") ||
          message.includes("Warning: Legacy context API") ||
          message.includes("Failed to fetch") ||
          message.includes("RSC payload")
        ) {
          return; // Skip these errors
        }
        originalError.apply(console, args);
      };

      return () => {
        console.error = originalError;
      };
    }
  }, []);

  return <>{children}</>;
}

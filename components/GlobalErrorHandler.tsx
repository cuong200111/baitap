"use client";

import { useEffect } from "react";

export function GlobalErrorHandler() {
  useEffect(() => {
    // Handle unhandled promise rejections (like AbortError)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;

      // Suppress AbortError and cancellation errors
      if (
        error?.name === "AbortError" ||
        error?.message?.includes("aborted") ||
        error?.message?.includes("cancelled") ||
        error?.code === "ERR_CANCELED" ||
        error?.cancelled
      ) {
        console.log("Suppressed AbortError:", error.message || error);
        event.preventDefault();
        return;
      }

      // Let other errors propagate normally
      console.error("Unhandled promise rejection:", error);
    };

    // Handle global errors
    const handleGlobalError = (event: ErrorEvent) => {
      const error = event.error;

      // Suppress AbortError and cancellation errors
      if (
        error?.name === "AbortError" ||
        error?.message?.includes("aborted") ||
        error?.message?.includes("cancelled")
      ) {
        console.log("Suppressed global AbortError:", error.message || error);
        event.preventDefault();
        return;
      }

      // Let other errors propagate normally
      console.error("Global error:", error);
    };

    // Add event listeners
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleGlobalError);

    // Cleanup
    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
      window.removeEventListener("error", handleGlobalError);
    };
  }, []);

  return null; // This component doesn't render anything
}

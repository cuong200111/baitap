// Global error handling for development environment
export function setupGlobalErrorHandling() {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "development") {
    return;
  }

  // Suppress specific development errors
  const originalError = console.error;
  console.error = (...args) => {
    const message = args.join(" ");

    // Ignore FullStory and RSC payload errors in development
    if (
      message.includes("Failed to fetch") &&
      (message.includes("fullstory") ||
        message.includes("RSC payload") ||
        message.includes("edge.fullstory.com") ||
        message.includes("fetchServerResponse"))
    ) {
      console.warn("🔇 Suppressed development error:", message);
      return;
    }

    originalError.apply(console, args);
  };

  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const message = event.reason?.message || String(event.reason);

    if (
      message.includes("Failed to fetch") &&
      (message.includes("fullstory") ||
        message.includes("RSC payload") ||
        message.includes("edge.fullstory.com"))
    ) {
      console.warn("🔇 Suppressed unhandled rejection:", message);
      event.preventDefault();
      return;
    }
  });

  // Override fetch to catch and handle specific errors
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      return await originalFetch.apply(window, args);
    } catch (error: any) {
      // Check if it's a FullStory related error
      if (
        error.message?.includes("fullstory") ||
        args[0]?.toString().includes("fullstory") ||
        args[0]?.toString().includes("edge.fullstory.com")
      ) {
        console.warn("🔇 Suppressed FullStory fetch error:", error.message);
        // Return a fake response to prevent cascading errors
        return new Response("", { status: 204 });
      }
      throw error;
    }
  };

  console.log("🛡️ Global error handling initialized for development");
}

// Auto-setup when module is imported in browser
if (typeof window !== "undefined") {
  setupGlobalErrorHandling();
}

"use client";

import React, { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details in development
    if (process.env.NODE_ENV === "development") {
      console.warn("🛡️ ErrorBoundary caught error:", error);
      console.warn("Error info:", errorInfo);

      // Ignore common development fetch errors
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError") ||
        error.message.includes("FullStory") ||
        error.message.includes("RSC payload")
      ) {
        console.warn("⚠️ Ignoring development fetch error, continuing...");
        // Reset error state after a short delay
        setTimeout(() => {
          this.setState({ hasError: false, error: undefined });
        }, 100);
        return;
      }
    }
  }

  render() {
    if (this.state.hasError) {
      // In development, show minimal error info and auto-recover
      if (process.env.NODE_ENV === "development") {
        return (
          this.props.fallback || (
            <div
              style={{
                padding: "20px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
              }}
            >
              <h3 style={{ color: "#dc2626", margin: "0 0 10px 0" }}>
                Development Error (Auto-recovering...)
              </h3>
              <p style={{ color: "#7f1d1d", margin: "0", fontSize: "14px" }}>
                {this.state.error?.message || "An error occurred"}
              </p>
            </div>
          )
        );
      }

      // In production, show user-friendly error
      return (
        this.props.fallback || (
          <div style={{ padding: "20px", textAlign: "center" }}>
            <h2>Something went wrong</h2>
            <p>Please refresh the page or try again later.</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Hook-based error boundary for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo: ErrorInfo) => {
    if (process.env.NODE_ENV === "development") {
      // Ignore common development errors
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError") ||
        error.message.includes("FullStory") ||
        error.message.includes("RSC payload")
      ) {
        console.warn("🛡️ Ignoring development error:", error.message);
        return;
      }
    }
    console.error("Application error:", error, errorInfo);
  };
}

export default ErrorBoundary;

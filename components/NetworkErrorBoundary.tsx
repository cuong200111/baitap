"use client";

import React from "react";

interface NetworkErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class NetworkErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  NetworkErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): NetworkErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Only log network-related errors to reduce noise
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError") ||
      error.message.includes("AbortError")
    ) {
      console.warn("Network error caught by boundary:", error);
    } else {
      console.error("Error caught by boundary:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // If it's a network error, just render children anyway (graceful degradation)
      const error = this.state.error;
      if (
        error &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError") ||
          error.message.includes("AbortError"))
      ) {
        return this.props.children;
      }

      // For other errors, show a fallback UI
      return (
        <div className="text-center py-4">
          <p className="text-gray-500">Đã xảy ra lỗi, vui lòng tải lại trang</p>
        </div>
      );
    }

    return this.props.children;
  }
}

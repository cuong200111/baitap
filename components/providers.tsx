"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { GlobalErrorHandler } from "./GlobalErrorHandler";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // During SSR, render without AuthProvider to avoid context issues
  if (!isClient) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GlobalErrorHandler />
        {children}
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

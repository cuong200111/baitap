"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { SeoProvider } from "@/contexts/SeoContext";
import { AdminSeoProvider } from "@/contexts/AdminSeoContext";
import { Toaster } from "sonner";
import { useState } from "react";
import { GlobalErrorHandler } from "./GlobalErrorHandler";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AdminSeoProvider>
        <SeoProvider>
          <AuthProvider>
            <GlobalErrorHandler />
            {children}
            <Toaster position="top-right" />
          </AuthProvider>
        </SeoProvider>
      </AdminSeoProvider>
    </QueryClientProvider>
  );
}

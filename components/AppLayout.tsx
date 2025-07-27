"use client";

import { EnhancedHeader } from "./EnhancedHeader";
import { Footer } from "./Footer";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <EnhancedHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

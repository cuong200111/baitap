"use client";

import { ReactNode } from "react";

interface PerformanceOptimizerProps {
  children: ReactNode;
}

export default function PerformanceOptimizer({ children }: PerformanceOptimizerProps) {
  // Simple passthrough component for now
  return <>{children}</>;
}

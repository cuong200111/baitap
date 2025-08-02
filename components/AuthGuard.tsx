"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
  showLoader?: boolean;
}

export function AuthGuard({
  children,
  requireAuth = true,
  requireAdmin = false,
  redirectTo = "/login",
  showLoader = true,
}: AuthGuardProps) {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to complete before deciding whether to redirect
    if (authLoading) {
      return; // Still loading, don't do anything yet
    }

    if (requireAuth && (!isAuthenticated || !user)) {
      // Auth completed and user is not authenticated
      router.push(redirectTo);
      return;
    }

    if (requireAdmin && user?.role !== "admin") {
      // User is authenticated but not an admin
      router.push("/");
      return;
    }
  }, [
    authLoading,
    isAuthenticated,
    user,
    requireAuth,
    requireAdmin,
    redirectTo,
    router,
  ]);

  // Show loading screen while authentication is in progress
  if (authLoading && showLoader) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Đang xác thực...</p>
          <p className="text-gray-500 text-sm mt-2">
            Vui lòng chờ trong giây lát
          </p>
        </div>
      </div>
    );
  }

  // Don't render anything while redirecting or if auth requirements aren't met
  if (authLoading) {
    return null;
  }

  if (requireAuth && (!isAuthenticated || !user)) {
    return null;
  }

  if (requireAdmin && user?.role !== "admin") {
    return null;
  }

  return <>{children}</>;
}

// Helper component for pages that need auth
export function WithAuth({ children }: { children: React.ReactNode }) {
  return <AuthGuard requireAuth={true}>{children}</AuthGuard>;
}

// Helper component for admin pages
export function WithAdminAuth({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={true} requireAdmin={true}>
      {children}
    </AuthGuard>
  );
}

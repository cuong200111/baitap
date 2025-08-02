"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/config";
import { apiWrappers } from "@/lib/api-wrapper";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string,
    phone?: string,
  ) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Helper functions for token management
const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

const setToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
};

const removeToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();

  // Optimistic authentication - check token immediately without API call
  const initializeAuth = () => {
    const token = getToken();
    if (token) {
      // We have a token, assume user is authenticated initially
      // This prevents immediate redirects while we verify the token
      setLoading(true);
      setInitializing(false);
      // Verify token in background
      verifyToken();
    } else {
      // No token, user is definitely not authenticated
      setLoading(false);
      setInitializing(false);
    }
  };

  const verifyToken = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiWrappers.auth.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        console.log("Profile fetch failed:", response);

        // Handle specific error codes
        if (response.code === "TOKEN_EXPIRED") {
          console.log("🔑 Token expired, removing...");
          removeToken();
          setUser(null);
        } else if (response.code === "INVALID_TOKEN") {
          console.log("🔑 Invalid token, removing...");
          removeToken();
          setUser(null);
        } else if (response.code === "NO_TOKEN") {
          console.log("🔑 No token provided");
          removeToken();
          setUser(null);
        } else if (response.status === 401 || response.status === 403) {
          console.log("🔑 Auth error, removing token");
          removeToken();
          setUser(null);
        } else {
          console.log(
            "🔄 Profile fetch failed but token might be valid, keeping it",
          );
          // Keep token for server errors - might be temporary
        }
      }
    } catch (error: any) {
      console.error("Auth check failed:", error);

      // Only remove token for authentication errors, not network errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.log("Authentication error, removing token");
        removeToken();
        setUser(null);
      } else {
        console.log("Network error during auth check, keeping token for retry");
        // Keep the token for network errors - user might be offline temporarily
      }
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    setLoading(true);
    await verifyToken();
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiWrappers.auth.login(email, password);

      if (response.success && response.data) {
        setToken(response.data.token);
        setUser(response.data.user);

        // Clear guest customer info from localStorage when user logs in
        localStorage.removeItem("guest_customer_info");
        localStorage.removeItem("guest_purchase");

        // Check for redirect URL in localStorage
        const redirectUrl = localStorage.getItem("redirect_after_login");

        if (redirectUrl) {
          localStorage.removeItem("redirect_after_login");
          router.push(redirectUrl);
        } else {
          // Default redirect based on role
          if (response.data.user.role === "admin") {
            router.push("/admin");
          } else {
            router.push("/");
          }
        }
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error: any) {
      // Handle different error formats
      let errorMessage = "Đăng nhập thất bại";

      if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.message && typeof error.message === "string") {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      }

      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    phone?: string,
  ) => {
    try {
      setLoading(true);
      const response = await apiWrappers.auth.register({
        email,
        password,
        full_name: fullName,
        phone,
      });

      if (response.success && response.data) {
        // Don't auto-login after registration, redirect to login page
        router.push("/login?message=Đăng ký thành công! Vui lòng đăng nhập.");
      } else {
        throw new Error(response.message || "Registration failed");
      }
    } catch (error: any) {
      console.error("Register error:", error);

      // Handle different error formats
      let errorMessage = "Đăng ký thất bại";

      if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.message && typeof error.message === "string") {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      }

      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
    router.push("/login");
  };

  const refreshUser = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await apiWrappers.auth.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error("Refresh user failed:", error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin: user?.role === "admin",
    isAuthenticated: !!user,
    checkAuth,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

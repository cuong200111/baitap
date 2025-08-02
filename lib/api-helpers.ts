// API Helper utilities with full domain URLs
import { API_CONFIG } from "./config-client";

// Get the backend domain from config
export const Domain = API_CONFIG.BASE_URL;

// Export for easy import in components
export const API_DOMAIN = Domain;

// Helper function to construct full API URLs
export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith("/api/")
    ? endpoint.substring(4) // Remove /api/ prefix
    : endpoint.startsWith("/")
      ? endpoint.substring(1) // Remove / prefix
      : endpoint;

  return `${Domain}/api/${cleanEndpoint}`;
}

// Helper function for API calls with authentication
export function getApiUrlAndHeaders(endpoint: string) {
  const url = getApiUrl(endpoint);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add authentication token if available
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return { url, headers };
}

// Helper function to make authenticated fetch calls
export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {},
) {
  const { url, headers } = getApiUrlAndHeaders(endpoint);

  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
}

// Helper function for common API patterns
export const apiHelpers = {
  // GET request with auth
  get: (endpoint: string) => fetchWithAuth(endpoint),

  // POST request with auth and JSON body
  post: (endpoint: string, data: any) =>
    fetchWithAuth(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // PUT request with auth and JSON body
  put: (endpoint: string, data: any) =>
    fetchWithAuth(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // DELETE request with auth
  delete: (endpoint: string) => fetchWithAuth(endpoint, { method: "DELETE" }),
};

// Helper to test API endpoints directly
const API_BASE = "http://localhost:4000";

export const testAPI = {
  health: async () => {
    const response = await fetch(`${API_BASE}/api/health`);
    return response.json();
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  getCategories: async (token?: string) => {
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/api/categories`, {
      headers,
    });
    return response.json();
  },

  createCategory: async (token: string, data: any) => {
    const response = await fetch(`${API_BASE}/api/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  updateCategory: async (token: string, id: number, data: any) => {
    const response = await fetch(`${API_BASE}/api/categories/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  deleteCategory: async (token: string, id: number) => {
    const response = await fetch(`${API_BASE}/api/categories/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    return response.json();
  },
};

// Make it available in browser console for debugging
if (typeof window !== "undefined") {
  (window as any).testAPI = testAPI;
}

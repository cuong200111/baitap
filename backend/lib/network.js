import fetch from 'node-fetch';

// Network utility functions for backend
export async function fetchWithRetry(url, options = {}, retryOptions = {}) {
  const {
    retries = 3,
    timeout = 15000,
    retryDelay = 1000,
    onRetry,
  } = retryOptions;

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        onRetry?.(attempt + 1, lastError);
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * (attempt + 1)),
        );
      }
    }
  }

  throw lastError;
}

export function isNetworkError(error) {
  if (error instanceof Error) {
    return (
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError") ||
      error.message.includes("ERR_NETWORK") ||
      error.message.includes("ERR_INTERNET_DISCONNECTED") ||
      error.name === "AbortError" ||
      error.code === "ECONNREFUSED" ||
      error.code === "ETIMEDOUT"
    );
  }
  return false;
}

export function getErrorMessage(error) {
  if (error instanceof Error) {
    if (isNetworkError(error)) {
      return "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.";
    }
    return error.message;
  }
  return "Có lỗi không xác định xảy ra";
}

// Health check function
export async function healthCheck(url) {
  try {
    const response = await fetchWithRetry(url, { method: 'GET' }, { retries: 1 });
    return {
      success: true,
      status: response.status,
      message: "Service is healthy"
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      message: getErrorMessage(error)
    };
  }
}

// API request wrapper
export async function apiRequest(url, options = {}) {
  try {
    const response = await fetchWithRetry(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

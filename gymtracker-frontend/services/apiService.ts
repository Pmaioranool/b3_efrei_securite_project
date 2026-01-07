import authService from "./authService";
import csrfService from "./csrfService";

const API_URL = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace(/\/$/, "");

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
  requiresCsrf?: boolean;
}

class ApiService {
  private static instance: ApiService;

  private constructor() { }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const {
      requiresAuth = true,
      requiresCsrf = true,
      headers = {},
      ...restOptions
    } = options;

    const config: RequestInit = {
      ...restOptions,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    // Add authorization header if required
    if (requiresAuth) {
      const token = authService.getAccessToken();
      if (token) {
        (config.headers as Record<string, string>)[
          "Authorization"
        ] = `Bearer ${token}`;
      }
    }

    // Add CSRF token for state-changing requests
    const method = (config.method || "GET").toUpperCase();
    if (requiresCsrf && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      try {
        const csrfToken = await csrfService.getToken();
        (config.headers as Record<string, string>)["X-CSRF-Token"] = csrfToken;
      } catch (error) {
        console.error("Failed to get CSRF token:", error);
        // Continue without CSRF token, server will reject if required
      }
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, config);

      // Handle 403 CSRF error - try to refresh CSRF token and retry
      if (response.status === 403 && requiresCsrf) {
        const errorData = await response.json().catch(() => ({}));
        if (
          errorData.error === "CSRF protection" ||
          errorData.message?.includes("CSRF")
        ) {
          try {
            // Refresh CSRF token
            const newCsrfToken = await csrfService.refreshToken();
            (config.headers as Record<string, string>)["X-CSRF-Token"] =
              newCsrfToken;

            // Retry the request with new CSRF token
            const retryResponse = await fetch(`${API_URL}${endpoint}`, config);

            if (!retryResponse.ok) {
              const retryError = await retryResponse.json().catch(() => ({}));
              throw new Error(
                retryError.message ||
                `HTTP error! status: ${retryResponse.status}`
              );
            }

            const contentType = retryResponse.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              return await retryResponse.json();
            }
            return {} as T;
          } catch (csrfError) {
            console.error("CSRF token refresh failed:", csrfError);
            throw csrfError;
          }
        }
      }

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && requiresAuth) {
        try {
          const newToken = await authService.refreshAccessToken();
          // Retry the request with new token
          (config.headers as Record<string, string>)[
            "Authorization"
          ] = `Bearer ${newToken}`;

          // Also refresh CSRF token if needed
          if (
            requiresCsrf &&
            ["POST", "PUT", "PATCH", "DELETE"].includes(method)
          ) {
            const newCsrfToken = await csrfService.refreshToken();
            (config.headers as Record<string, string>)["X-CSRF-Token"] =
              newCsrfToken;
          }

          const retryResponse = await fetch(`${API_URL}${endpoint}`, config);

          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }

          return await retryResponse.json();
        } catch (refreshError) {
          // Refresh failed, redirect to login
          window.location.href = "#/login";
          throw new Error("Session expired. Please login again.");
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      // Handle empty responses
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }

      return {} as T;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export default ApiService.getInstance();

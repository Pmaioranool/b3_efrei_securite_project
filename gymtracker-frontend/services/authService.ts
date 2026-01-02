const API_URL = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace(/\/$/, "");
import csrfService from "./csrfService";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  pseudonym: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: {
    id: string;
    pseudonym: string;
    email: string;
    role: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

class AuthService {
  private static instance: AuthService;

  private constructor() { }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Get CSRF token
    const csrfToken = await csrfService.getToken();

    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      // If CSRF error, try to refresh and retry once
      if (response.status === 403 && data.error === "CSRF protection") {
        const newCsrfToken = await csrfService.refreshToken();
        const retryResponse = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": newCsrfToken,
          },
          body: JSON.stringify(credentials),
        });

        const retryData = await retryResponse.json();
        if (!retryResponse.ok) {
          throw new Error(retryData.message || "Erreur lors de la connexion");
        }

        this.setTokens(
          retryData.tokens.accessToken,
          retryData.tokens.refreshToken
        );
        this.setUser(retryData.user);
        return retryData;
      }

      throw new Error(data.message || "Erreur lors de la connexion");
    }

    this.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    this.setUser(data.user);

    return data;
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    // Get CSRF token
    const csrfToken = await csrfService.getToken();

    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      // If CSRF error, try to refresh and retry once
      if (response.status === 403 && data.error === "CSRF protection") {
        const newCsrfToken = await csrfService.refreshToken();
        const retryResponse = await fetch(`${API_URL}/api/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": newCsrfToken,
          },
          body: JSON.stringify(credentials),
        });

        const retryData = await retryResponse.json();
        if (!retryResponse.ok) {
          throw new Error(retryData.message || "Erreur lors de l'inscription");
        }

        this.setTokens(
          retryData.tokens.accessToken,
          retryData.tokens.refreshToken
        );
        this.setUser(retryData.user);
        return retryData;
      }

      throw new Error(data.message || "Erreur lors de l'inscription");
    }

    this.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    this.setUser(data.user);

    return data;
  }

  async logout(): Promise<void> {
    try {
      const token = this.getAccessToken();
      const csrfToken = await csrfService.getToken();

      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-CSRF-Token": csrfToken,
          },
        });
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    } finally {
      this.clearTokens();
    }
  }

  async refreshAccessToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      this.clearTokens();
      throw new Error(
        data.message || "Erreur lors du rafraîchissement du token"
      );
    }

    this.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    return data.tokens.accessToken;
  }

  getAccessToken(): string | null {
    return localStorage.getItem("accessToken");
  }

  getRefreshToken(): string | null {
    return localStorage.getItem("refreshToken");
  }

  getUser(): any {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  }

  private setUser(user: any): void {
    localStorage.setItem("user", JSON.stringify(user));
  }

  private clearTokens(): void {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  }
}

export default AuthService.getInstance();

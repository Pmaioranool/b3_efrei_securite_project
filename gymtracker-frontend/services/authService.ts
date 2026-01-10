const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");
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
}

class AuthService {
  private static instance: AuthService;
  private user: any = null;

  private constructor() { }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const csrfToken = await csrfService.getToken();

    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      credentials: "include", // Important for cookies
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      // CSRF Retry logic could go here if needed, but apiService handles generic requests usually.
      // For login, we implement retry manually if we want robustness, or trust the user to try again.
      // Simplifying for now as apiService handles most logic, but login uses fetch directly here.
      // Let's add basic CSRF retry logic.
      if (response.status === 403 && data.error === "CSRF protection") {
        const newCsrfToken = await csrfService.refreshToken();
        const retryResponse = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": newCsrfToken,
          },
          credentials: "include",
          body: JSON.stringify(credentials),
        });
        const retryData = await retryResponse.json();
        if (!retryResponse.ok) throw new Error(retryData.message || "Erreur lors de la connexion");
        this.setUser(retryData.user);
        return retryData;
      }
      throw new Error(data.message || "Erreur lors de la connexion");
    }

    this.setUser(data.user);
    return data;
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const csrfToken = await csrfService.getToken();

    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      credentials: "include",
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 403 && data.error === "CSRF protection") {
        const newCsrfToken = await csrfService.refreshToken();
        const retryResponse = await fetch(`${API_URL}/api/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": newCsrfToken,
          },
          credentials: "include",
          body: JSON.stringify(credentials),
        });
        const retryData = await retryResponse.json();
        if (!retryResponse.ok) throw new Error(retryData.message || "Erreur lors de l'inscription");
        this.setUser(retryData.user);
        return retryData;
      }
      throw new Error(data.message || "Erreur lors de l'inscription");
    }

    this.setUser(data.user);
    return data;
  }

  async logout(): Promise<void> {
    try {
      const csrfToken = await csrfService.getToken();
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
      });
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    } finally {
      this.clearUser();
    }
  }

  // Check session status from server
  async checkAuthStatus(): Promise<any> {
    try {
      // We use apiService here? No, circular dependency potential if apiService uses authService. 
      // Better use fetch directly or keep it simple.
      // However, checkAuthStatus is usually called by AppContext. 
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (response.ok) {
        const data = await response.json();
        this.setUser(data.user);
        return data.user;
      } else {
        this.clearUser();
        return null;
      }
    } catch (e) {
      this.clearUser();
      return null;
    }
  }

  getUser(): any {
    // In session based, we might want to trust local state until refresh, 
    // but ultimately source of truth is server.
    // For UI responsiveness, we return local cache if present.
    // Ideally AppContext manages key state.
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.user;
  }

  // Helpers
  private setUser(user: any): void {
    this.user = user;
    // We can verify/persist to localStorage if we want "remember me" UI feel before network load,
    // but strictly speaking session is HTTP-only.
    // Let's NOT use localStorage for user data to avoid sync issues.
    // AppContext will hold the truth.
  }

  private clearUser(): void {
    this.user = null;
  }
}

export default AuthService.getInstance();

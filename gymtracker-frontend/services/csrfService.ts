const API_URL = import.meta.env.VITE_API_URL || "https://localhost:3000";

class CsrfService {
  private static instance: CsrfService;
  private currentToken: string | null = null;
  private tokenPromise: Promise<string> | null = null;

  private constructor() {}

  public static getInstance(): CsrfService {
    if (!CsrfService.instance) {
      CsrfService.instance = new CsrfService();
    }
    return CsrfService.instance;
  }

  /**
   * Fetch a new CSRF token from the API
   */
  async fetchToken(): Promise<string> {
    // Si une requête est déjà en cours, retourner la même promesse
    if (this.tokenPromise) {
      return this.tokenPromise;
    }

    this.tokenPromise = (async () => {
      try {
        const response = await fetch(`${API_URL}/api/csrf-token`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch CSRF token: ${response.status}`);
        }

        const data = await response.json();
        this.currentToken = data.token;
        return data.token;
      } catch (error) {
        console.error("Error fetching CSRF token:", error);
        throw error;
      } finally {
        this.tokenPromise = null;
      }
    })();

    return this.tokenPromise;
  }

  /**
   * Get the current CSRF token or fetch a new one if not available
   */
  async getToken(): Promise<string> {
    if (this.currentToken) {
      return this.currentToken;
    }
    return this.fetchToken();
  }

  /**
   * Clear the current token (force refresh on next request)
   */
  clearToken(): void {
    this.currentToken = null;
  }

  /**
   * Retry fetching token if previous attempt failed
   */
  async refreshToken(): Promise<string> {
    this.clearToken();
    return this.fetchToken();
  }
}

export default CsrfService.getInstance();

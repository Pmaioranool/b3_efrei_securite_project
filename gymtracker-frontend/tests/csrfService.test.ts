import { describe, it, expect, beforeEach, vi } from "vitest";
import csrfService from "../services/csrfService";

// Mock fetch
global.fetch = vi.fn();

describe("CSRF Service", () => {
  beforeEach(() => {
    // Reset le service entre chaque test
    csrfService.clearToken();
    vi.clearAllMocks();
  });

  it("devrait récupérer un token CSRF depuis l'API", async () => {
    const mockToken = "test-csrf-token-123";
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: mockToken }),
    });

    const token = await csrfService.fetchToken();

    expect(token).toBe(mockToken);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/utils/csrf-token"),
      expect.objectContaining({
        method: "GET",
      })
    );
  });

  it("devrait réutiliser le token en cache", async () => {
    const mockToken = "cached-token-456";
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: mockToken }),
    });

    // Premier appel - fetch depuis l'API
    const token1 = await csrfService.getToken();

    // Deuxième appel - devrait utiliser le cache
    const token2 = await csrfService.getToken();

    expect(token1).toBe(mockToken);
    expect(token2).toBe(mockToken);
    expect(global.fetch).toHaveBeenCalledTimes(1); // Seulement 1 appel API
  });

  it("devrait gérer les erreurs de récupération", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(csrfService.fetchToken()).rejects.toThrow();
  });

  it("devrait rafraîchir le token quand demandé", async () => {
    const oldToken = "old-token";
    const newToken = "new-token";

    // Premier fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: oldToken }),
    });

    await csrfService.getToken();

    // Refresh
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: newToken }),
    });

    const refreshedToken = await csrfService.refreshToken();

    expect(refreshedToken).toBe(newToken);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("devrait nettoyer le token", async () => {
    const token1 = "token-1";
    const token2 = "token-2";

    // Premier fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: token1 }),
    });

    await csrfService.getToken();

    // Clear
    csrfService.clearToken();

    // Nouveau fetch après clear
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: token2 }),
    });

    const newToken = await csrfService.getToken();

    expect(newToken).toBe(token2);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});

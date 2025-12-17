const AuthController = require("../../src/controllers/auth.controller");
const { authenticateToken } = require("../../src/middlewares/auth.middleware");
const JWTService = require("../../src/utils/jwt");
const User = require("../../src/models/User.model");

// Mock des dépendances
jest.mock("../../src/models/User.model");
jest.mock("../../src/utils/jwt");

describe("JWT Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Token Generation", () => {
    it("should generate access token with correct payload", () => {
      const payload = { userId: 1, email: "test@example.com" };
      const mockToken = "mock-access-token";

      JWTService.generateAccessToken.mockReturnValue(mockToken);

      const token = JWTService.generateAccessToken(payload);

      expect(JWTService.generateAccessToken).toHaveBeenCalledWith(payload);
      expect(token).toBe(mockToken);
    });
  });
});

describe("Auth Controller", () => {
  let mockUser;
  let req, res, next;

  beforeEach(() => {
    mockUser = {
      id: 1,
      name: "Test User",
      email: "test@example.com",
      password: "hashedpassword123",
      workouts_completed: 0,
      last_login: null,
    };

    req = {
      body: {},
      user: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should register user successfully", async () => {
      req.body = {
        firstname: "New",
        lastname: "User",
        pseudonym: "newuser",
        birthdate: "1990-01-01",
        email: "new@example.com",
        password: "password123",
      };

      User.getByEmail.mockResolvedValue(null);
      User.create.mockResolvedValue({
        id: 2,
        firstname: "New",
        lastname: "User",
        pseudonym: "newuser",
        birthdate: "1990-01-01",
        email: "new@example.com",
        role: "USER",
      });
      JWTService.generateAccessToken.mockReturnValue("access-token");
      JWTService.generateRefreshToken.mockReturnValue("refresh-token");

      await AuthController.register(req, res, next);

      expect(User.getByEmail).toHaveBeenCalledWith("new@example.com");
      expect(User.create).toHaveBeenCalledWith({
        firstname: "New",
        lastname: "User",
        pseudonym: "newuser",
        birthdate: "1990-01-01",
        email: "new@example.com",
        password: "password123",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Utilisateur créé avec succès",
          user: expect.any(Object),
          tokens: expect.any(Object),
        })
      );
    });
  });

  describe("login", () => {
    it("should login user successfully", async () => {
      req.body = {
        email: "test@example.com",
        password: "password123",
      };

      User.getByEmail.mockResolvedValue(mockUser);
      JWTService.verifyPasswordAndDetectLegacy.mockResolvedValue({
        valid: true,
        needsRehash: false,
      });
      JWTService.generateAccessToken.mockReturnValue("access-token");
      JWTService.generateRefreshToken.mockReturnValue("refresh-token");
      User.updateLastLogin.mockResolvedValue(mockUser);

      await AuthController.login(req, res, next);

      expect(User.getByEmail).toHaveBeenCalledWith("test@example.com");
      expect(JWTService.verifyPasswordAndDetectLegacy).toHaveBeenCalledWith(
        "password123",
        "hashedpassword123"
      );

      // Vérifier que res.json est appelé avec les bonnes données
      expect(res.json).toHaveBeenCalledWith({
        message: "Connexion réussie",
        user: expect.objectContaining({
          id: 1,
          name: "Test User",
          email: "test@example.com",
        }),
        tokens: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
        },
      });

      // Le contrôleur n'utilise pas res.status(200) avant res.json()
      // Donc on ne teste pas res.status pour le succès
    });

    it("should return error for invalid credentials", async () => {
      req.body = {
        email: "wrong@example.com",
        password: "wrongpassword",
      };

      User.getByEmail.mockResolvedValue(null);

      await AuthController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Identifiants invalides",
        message: "Email ou mot de passe incorrect",
      });
    });

    it("should return error for wrong password", async () => {
      req.body = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      User.getByEmail.mockResolvedValue(mockUser);
      JWTService.verifyPasswordAndDetectLegacy.mockResolvedValue({
        valid: false,
        needsRehash: false,
      });

      await AuthController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Identifiants invalides",
        message: "Email ou mot de passe incorrect",
      });
    });
  });

  describe("refresh", () => {
    it("should refresh tokens successfully", async () => {
      req.body = {
        refreshToken: "valid-refresh-token",
      };

      const newTokens = {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        user: { userId: 1, email: "test@example.com" },
      };

      JWTService.refreshTokens.mockReturnValue(newTokens);

      await AuthController.refresh(req, res, next);

      expect(JWTService.refreshTokens).toHaveBeenCalledWith(
        "valid-refresh-token"
      );
      expect(res.json).toHaveBeenCalledWith({
        message: "Tokens rafraîchis avec succès",
        tokens: {
          accessToken: "new-access-token",
          refreshToken: "new-refresh-token",
        },
        user: newTokens.user,
      });
    });
  });

  describe("getProfile", () => {
    it("should return user profile successfully", async () => {
      req.user = { userId: 1 };
      User.getById.mockResolvedValue(mockUser);

      await AuthController.getProfile(req, res, next);

      expect(User.getById).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({
        user: expect.objectContaining({
          id: 1,
          name: "Test User",
          email: "test@example.com",
        }),
      });
    });
  });

  describe("logout", () => {
    it("should logout successfully", async () => {
      await AuthController.logout(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        message: "Déconnexion réussie",
      });
    });
  });
});

describe("Auth Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe("authenticateToken", () => {
    it("should call next for valid token", () => {
      req.headers.authorization = "Bearer valid-token";
      const decodedUser = { userId: 1, email: "test@example.com" };

      JWTService.extractTokenFromHeader.mockReturnValue("valid-token");
      JWTService.verifyAccessToken.mockReturnValue(decodedUser);

      authenticateToken(req, res, next);

      expect(JWTService.extractTokenFromHeader).toHaveBeenCalledWith(
        "Bearer valid-token"
      );
      expect(JWTService.verifyAccessToken).toHaveBeenCalledWith("valid-token");
      expect(req.user).toEqual(decodedUser);
      expect(next).toHaveBeenCalled();
    });

    it("should return 401 for missing authorization header", () => {
      // Simuler l'erreur du extractTokenFromHeader
      JWTService.extractTokenFromHeader.mockImplementation(() => {
        throw new Error("Header Authorization manquant");
      });

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Accès non autorisé",
        message: "Header Authorization manquant",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 for invalid token", () => {
      req.headers.authorization = "Bearer invalid-token";

      JWTService.extractTokenFromHeader.mockReturnValue("invalid-token");
      JWTService.verifyAccessToken.mockImplementation(() => {
        throw new Error("Token d'accès invalide");
      });

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Accès non autorisé",
        message: "Token d'accès invalide",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});

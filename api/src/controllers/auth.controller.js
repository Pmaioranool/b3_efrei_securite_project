const User = require("../models/User.model");
const JWTService = require("../utils/jwt");

const isRefreshCookieEnabled = process.env.USE_REFRESH_COOKIE === "true";
const cookieBaseOptions = {
  httpOnly: true,
  sameSite: "strict",
  path: "/api/auth/refresh",
};

const setRefreshCookie = (res, token) => {
  if (!isRefreshCookieEnabled) return;
  res.cookie("refresh_token", token, {
    ...cookieBaseOptions,
    secure: process.env.NODE_ENV === "PRODUCTION",
    maxAge: 7 * 24 * 60 * 60 * 1000, //  7 days
  });
};

const clearRefreshCookie = (res) => {
  if (!isRefreshCookieEnabled) return;
  res.clearCookie("refresh_token", {
    ...cookieBaseOptions,
    secure: process.env.NODE_ENV === "PRODUCTION",
  });
};

const extractRefreshToken = (req) => {
  if (req.body && req.body.refreshToken) {
    return req.body.refreshToken;
  }
  if (!isRefreshCookieEnabled) return null;

  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").reduce((acc, part) => {
    const [key, ...val] = part.trim().split("=");
    if (!key) return acc;
    acc[decodeURIComponent(key)] = decodeURIComponent(val.join("="));
    return acc;
  }, {});

  return cookies["refresh_token"] || null;
};

class AuthController {
  async register(req, res, next) {
    try {
      const { pseudonym, email, password, role: inputRole } = req.body;
      let role = inputRole || "USER";
      role === "ADMIN" && (role = "USER"); // Prevent users from self-assigning admin role

      if (!email || !password || !pseudonym) {
        return res.status(400).json({
          error: "Données manquantes",
          message: "Le pseudonyme, email et mot de passe sont requis",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          error: "Mot de passe trop court",
          message: "Le mot de passe doit contenir au moins 6 caractères",
        });
      }

      const existingUser = await User.getByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          error: "Utilisateur déjà existant",
          message: "Un utilisateur avec cet email existe déjà",
        });
      }

      if (await User.getByPseudonym(pseudonym)) {
        return res.status(409).json({
          error: "Pseudonyme déjà utilisé",
          message: "Ce pseudonyme est déjà pris, veuillez en choisir un autre",
        });
      }

      const newUser = await User.create({
        pseudonym,
        email,
        password,
      });

      const userPayload = {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        tokenVersion: newUser.refresh_token_version,
      };

      const accessToken = JWTService.generateAccessToken(userPayload);
      const refreshToken = JWTService.generateRefreshToken(userPayload);

      setRefreshCookie(res, refreshToken);

      res.status(201).json({
        message: "Utilisateur créé avec succès",
        user: {
          id: newUser.id,
          pseudonym: newUser.pseudonym,
          email: newUser.email,
          role: role,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async registerAdmin(req, res, next) {
    try {
      const { pseudonym, email, password } = req.body;
      const role = "ADMIN";
      if (!email || !password || !pseudonym) {
        return res.status(400).json({
          error: "Données manquantes",
          message:
            "Le nom, prénom, pseudonyme, email et mot de passe sont requis",
        });
      }
      if (password.length < 6) {
        return res.status(400).json({
          error: "Mot de passe trop court",
          message: "Le mot de passe doit contenir au moins 6 caractères",
        });
      }
      const existingUser = await User.getByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          error: "Utilisateur déjà existant",
          message: "Un utilisateur avec cet email existe déjà",
        });
      }
      if (await User.getByPseudonym(pseudonym)) {
        return res.status(409).json({
          error: "Pseudonyme déjà utilisé",
          message: "Ce pseudonyme est déjà pris, veuillez en choisir un autre",
        });
      }
      const newUser = await User.create({
        pseudonym,
        email,
        password,
        role,
      });
      res.status(201).json({
        message: "Administrateur créé avec succès",
        user: {
          id: newUser.id,
          pseudonym: newUser.pseudonym,
          email: newUser.email,
          role: role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: "Données manquantes",
          message: "L'email et le mot de passe sont requis",
        });
      }

      const user = await User.getByEmail(email);
      if (!user) {
        return res.status(401).json({
          error: "Identifiants invalides",
          message: "Email ou mot de passe incorrect",
        });
      }

      // Vérifie le mot de passe et détecte un éventuel hash "legacy" (sans pepper)
      // needsRehash=true => on déclenche une mise à niveau transparente du hash
      const { valid, needsRehash } =
        await JWTService.verifyPasswordAndDetectLegacy(password, user.password);
      if (!valid) {
        return res.status(401).json({
          error: "Identifiants invalides",
          message: "Email ou mot de passe incorrect",
        });
      }

      // Si un hash "legacy" est détecté, on met à niveau immédiatement
      // (ré-hachage avec paramètres actuels : pepper + salt rounds configurés)
      if (needsRehash) {
        try {
          await User.updatePassword(user.id, password);
        } catch (e) {
          // Non bloquant pour la connexion, mais loggable si un logger existe
        }
      }

      const rotatedUser = await User.bumpRefreshTokenVersion(user.id);

      const userPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        tokenVersion: rotatedUser.refresh_token_version,
      };

      const accessToken = JWTService.generateAccessToken(userPayload);
      const refreshToken = JWTService.generateRefreshToken(userPayload);

      setRefreshCookie(res, refreshToken);

      const loginUpdated = await User.updateLastLogin(
        user.id,
        new Date().toISOString()
      );

      res.json({
        message: "Connexion réussie",
        user: {
          id: user.id,
          pseudonym: user.pseudonym,
          email: user.email,
          last_login: loginUpdated ? loginUpdated.last_login : user.last_login,
          role: user.role,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const refreshToken = extractRefreshToken(req);

      if (!refreshToken) {
        return res.status(400).json({
          error: "Refresh token requis",
          message: "Fournir le token en body ou via cookie sécurisé",
        });
      }

      const decoded = JWTService.verifyRefreshToken(refreshToken);
      const user = await User.getAuthState(decoded.userId);

      if (!user) {
        return res.status(401).json({
          error: "Utilisateur non trouvé ou inactif",
        });
      }

      if (decoded.tokenVersion === undefined) {
        return res.status(401).json({
          error: "Refresh token invalide",
          message: "Version du token manquante",
        });
      }

      if (decoded.tokenVersion !== user.refresh_token_version) {
        return res.status(401).json({
          error: "Refresh token invalide",
          message: "Version du token expirée",
        });
      }

      const rotatedUser = await User.bumpRefreshTokenVersion(user.id);

      const userPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        tokenVersion: rotatedUser.refresh_token_version,
      };

      const accessToken = JWTService.generateAccessToken(userPayload);
      const newRefreshToken = JWTService.generateRefreshToken(userPayload);

      setRefreshCookie(res, newRefreshToken);

      res.json({
        message: "Tokens rafraîchis avec succès",
        tokens: {
          accessToken,
          refreshToken: newRefreshToken,
        },
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          pseudonym: user.pseudonym,
        },
      });
    } catch (error) {
      return res.status(401).json({
        error: "Refresh token invalide",
        message: error.message,
      });
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await User.getById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          error: "Utilisateur non trouvé",
        });
      }

      const { password, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      clearRefreshCookie(res);
      res.json({
        message: "Déconnexion réussie",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();

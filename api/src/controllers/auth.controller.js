const User = require("../models/User.model");
const JWTService = require("../utils/jwt");

class AuthController {
  async register(req, res, next) {
    try {
      const {
        firstname,
        lastname,
        pseudonym,
        email,
        password,
        birthdate,
        role: inputRole,
      } = req.body;
      let role = inputRole || "USER";
      role === "ADMIN" && (role = "USER"); // Prevent users from self-assigning admin role

      if (
        !firstname ||
        !lastname ||
        !email ||
        !password ||
        !pseudonym ||
        !birthdate
      ) {
        return res.status(400).json({
          error: "Données manquantes",
          message:
            "Le nom, prénom, pseudonyme, email, date de naissance et mot de passe sont requis",
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
        firstname,
        lastname,
        pseudonym,
        birthdate,
        email,
        password,
      });

      const userPayload = {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      };

      const accessToken = JWTService.generateAccessToken(userPayload);
      const refreshToken = JWTService.generateRefreshToken(userPayload);

      res.status(201).json({
        message: "Utilisateur créé avec succès",
        user: {
          id: newUser.id,
          firstname: newUser.firstname,
          lastname: newUser.lastname,
          pseudonym: newUser.pseudonym,
          birthdate: newUser.birthdate,
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
      const { firstname, lastname, pseudonym, email, password, birthdate } =
        req.body;
      const role = "ADMIN";
      if (
        !firstname ||
        !lastname ||
        !email ||
        !password ||
        !pseudonym ||
        !birthdate
      ) {
        return res.status(400).json({
          error: "Données manquantes",
          message:
            "Le nom, prénom, pseudonyme, email, date de naissance et mot de passe sont requis",
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
        firstname,
        lastname,
        pseudonym,
        birthdate,
        email,
        password,
        role,
      });
      res.status(201).json({
        message: "Administrateur créé avec succès",
        user: {
          id: newUser.id,
          firstname: newUser.firstname,
          lastname: newUser.lastname,
          pseudonym: newUser.pseudonym,
          birthdate: newUser.birthdate,
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

      const userPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = JWTService.generateAccessToken(userPayload);
      const refreshToken = JWTService.generateRefreshToken(userPayload);

      await User.updateLastLogin(user.id, new Date().toISOString());

      res.json({
        message: "Connexion réussie",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          last_login: user.last_login,
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
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          error: "Refresh token requis",
        });
      }

      const tokens = JWTService.refreshTokens(refreshToken);

      res.json({
        message: "Tokens rafraîchis avec succès",
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
        user: tokens.user,
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
      res.json({
        message: "Déconnexion réussie",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();

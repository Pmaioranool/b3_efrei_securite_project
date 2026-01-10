const User = require("../models/User.model");
const JWTService = require("../utils/jwt"); // Restoring for password logic

class AuthController {
  async register(req, res, next) {
    try {
      const { pseudonym, email, password, role: inputRole } = req.body;
      let role = inputRole || "USER";
      role === "ADMIN" && (role = "USER");

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

      // Auto-login: Create Session
      req.session.user = {
        id: newUser.id,
        userId: newUser.id, // Compat
        email: newUser.email,
        role: newUser.role,
        pseudonym: newUser.pseudonym
      };

      res.status(201).json({
        message: "Utilisateur créé avec succès",
        user: {
          id: newUser.id,
          pseudonym: newUser.pseudonym,
          email: newUser.email,
          role: role,
        }
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

      // Verify password using JWTService to handle pepper/legacy
      const { valid, needsRehash } = await JWTService.verifyPasswordAndDetectLegacy(password, user.password);

      if (!valid) {
        return res.status(401).json({
          error: "Identifiants invalides",
          message: "Email ou mot de passe incorrect",
        });
      }

      // Rehash if needed (legacy format updated to peppered)
      if (needsRehash) {
        try {
          await User.updatePassword(user.id, password);
        } catch (e) {
          // Non-blocking
        }
      }

      // Create Session
      req.session.user = {
        id: user.id,
        userId: user.id, // Compat
        email: user.email,
        role: user.role,
        pseudonym: user.pseudonym
      };

      // Update last login
      await User.updateLastLogin(
        user.id,
        new Date().toISOString()
      );

      res.json({
        message: "Connexion réussie",
        user: {
          id: user.id,
          pseudonym: user.pseudonym,
          email: user.email,
          role: user.role,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: "Erreur lors de la déconnexion" });
        }
        res.clearCookie('connect.sid'); // Default name
        res.json({ message: "Déconnexion réussie" });
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "Non connecté" });
      }
      // Return session info directly, or fetch from DB if we want latest data
      // Fetching from DB is safer for "profile" to get updates
      const user = await User.getById(req.session.user.id);

      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      const userObj = user.toObject ? user.toObject() : user;
      const { password, ...userWithoutPassword } = userObj;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();

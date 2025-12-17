const JWTService = require("../utils/jwt");

/**
 * Middleware d'authentification JWT
 * Vérifie le token dans le header Authorization et décode les informations utilisateur
 * Ajoute req.user contenant les données du token décodé (userId, email, role)
 *
 * @example
 * router.get('/profile', authenticateToken, controller.getProfile);
 */
exports.authenticateToken = (req, res, next) => {
  try {
    const token = JWTService.extractTokenFromHeader(req.headers.authorization);
    const decoded = JWTService.verifyAccessToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Accès non autorisé",
      message: error.message,
    });
  }
};

/**
 * Middleware factory pour l'autorisation basée sur les rôles
 * Décode le token JWT et vérifie que l'utilisateur possède l'un des rôles autorisés
 *
 * @param {...string} allowedRoles - Liste des rôles autorisés (ex: 'admin', 'coach', 'user')
 * @returns {Function} Middleware Express de validation de rôles
 *
 * @example
 * // Route admin uniquement
 * router.delete('/users/:id', authorizeRoles('admin'), controller.deleteUser);
 *
 * @example
 * // Route admin ou coach
 * router.post('/workouts', authorizeRoles('admin', 'coach'), controller.create);
 *
 * @example
 * // Route accessible à user, coach ou admin
 * router.get('/profile', authorizeRoles('user', 'coach', 'admin'), controller.getProfile);
 */
exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Extraire et décoder le token depuis le header Authorization
      const token = JWTService.extractTokenFromHeader(
        req.headers.authorization
      );
      const decoded = JWTService.verifyAccessToken(token);

      // Ajouter les données utilisateur à req.user
      req.user = decoded;

      // Récupérer le rôle de l'utilisateur depuis le token décodé
      const userRole = (decoded.role || "").toLowerCase();

      // Normaliser les rôles autorisés en minuscules pour comparaison insensible à la casse
      const normalizedAllowedRoles = allowedRoles.map((role) =>
        role.toLowerCase()
      );

      // Vérifier si le rôle de l'utilisateur est dans la liste des rôles autorisés
      if (!normalizedAllowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: "Accès refusé",
          message: `Accès réservé aux rôles: ${allowedRoles.join(", ")}`,
          userRole: userRole,
        });
      }

      // Autorisation accordée
      next();
    } catch (error) {
      return res.status(401).json({
        error: "Accès non autorisé",
        message: error.message,
      });
    }
  };
};

/**
 * Middleware pour vérifier que l'utilisateur accède à ses propres ressources
 * ou qu'il est admin
 *
 * @param {string} paramName - Nom du paramètre dans req.params à comparer avec userId
 * @returns {Function} Middleware Express
 *
 * @example
 * // L'utilisateur ne peut modifier que son propre profil (sauf admin)
 * router.put('/users/:userId', authenticateToken, authorizeOwnResource('userId'), controller.update);
 */
exports.authorizeOwnResource = (paramName = "id") => {
  return (req, res, next) => {
    try {
      const token = JWTService.extractTokenFromHeader(
        req.headers.authorization
      );
      const decoded = JWTService.verifyAccessToken(token);

      const userRole = decoded.role || "";
      const requestedResourceId = req.params[paramName];
      const authenticatedUserId = decoded.userId;

      // Admin a accès à toutes les ressources
      if (userRole === "ADMIN") {
        return next();
      }

      // Vérifier que l'utilisateur accède à sa propre ressource
      if (String(authenticatedUserId) !== String(requestedResourceId)) {
        return res.status(403).json({
          error: "Accès refusé",
          message: "Vous ne pouvez accéder qu'à vos propres ressources.",
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        error: "Erreur du serveur",
        message: error.message,
      });
    }
  };
};

/**
 * Middleware optionnel d'authentification
 * Décode le token si présent, mais ne bloque pas si absent
 * Utile pour les routes publiques avec contenu personnalisé pour les utilisateurs connectés
 *
 * @example
 * router.get('/public-workouts', optionalAuth, controller.getPublicWorkouts);
 */
exports.optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // Pas de token, continuer sans req.user
      return next();
    }

    const token = JWTService.extractTokenFromHeader(authHeader);
    const decoded = JWTService.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    // Token invalide, continuer quand même sans req.user
    next();
  }
};

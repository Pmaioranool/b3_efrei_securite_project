/**
 * Middleware d'authentification Session
 * Vérifie si une session active existe
 * Ajoute req.user contenant les données utilisateur de la session
 */
exports.authenticateToken = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user; // Compatibility with existing controllers relying on req.user
    // Ensure userId is present (mapped from session user.id if needed)
    if (!req.user.userId && req.user.id) {
      req.user.userId = req.user.id;
    }
    return next();
  } else {
    return res.status(401).json({
      error: "Accès non autorisé",
      message: "Session expirée ou invalide. Veuillez vous reconnecter.",
    });
  }
};

/**
 * Middleware factory pour l'autorisation basée sur les rôles
 */
exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Check session first (should be used after authenticateToken, but double check)
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const userRole = (req.session.user.role || "").toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map((role) => role.toLowerCase());

    if (!normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: "Accès refusé",
        message: `Accès réservé aux rôles: ${allowedRoles.join(", ")}`,
        userRole: userRole,
      });
    }
    next();
  };
};

/**
 * Middleware pour vérifier que l'utilisateur accède à ses propres ressources
 */
exports.authorizeOwnResource = (paramName = "id") => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const userRole = req.session.user.role || "";
    const requestedResourceId = req.params[paramName];
    const authenticatedUserId = req.session.user.id || req.session.user.userId;

    if (userRole === "ADMIN") {
      return next();
    }

    if (String(authenticatedUserId) !== String(requestedResourceId)) {
      return res.status(403).json({
        error: "Accès refusé",
        message: "Vous ne pouvez accéder qu'à vos propres ressources.",
      });
    }

    next();
  };
};

/**
 * Middleware pour vérifier que l'utilisateur peut accéder à un workout
 */
exports.authorizeWorkoutAccess = async (req, res, next) => {
  // Authenticate session
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      error: "Accès non autorisé",
      message: "Session invalide"
    });
  }

  req.user = req.session.user;
  // Map userId/id
  if (!req.user.userId && req.user.id) req.user.userId = req.user.id;

  const userRole = req.user.role || "";
  const workoutId = req.params.id;
  const authenticatedUserId = req.user.userId;

  if (userRole === "ADMIN") return next();

  try {
    const Workout = require("../models/Workout.model");
    const workout = await Workout.getById(workoutId);

    if (!workout) {
      return res.status(404).json({ error: "Workout non trouvé" });
    }

    if (!workout.userId || workout.template === true) {
      return next();
    }

    if (String(workout.userId) !== String(authenticatedUserId)) {
      return res.status(403).json({ error: "Accès refusé aux workouts d'autrui" });
    }

    req.workout = workout;
    next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Middleware optionnel d'authentification
 */
exports.optionalAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    if (!req.user.userId && req.user.id) req.user.userId = req.user.id;
  }
  next();
};

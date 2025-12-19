const crypto = require("crypto");

/**
 * Stockage simple de tokens CSRF en mémoire
 * ⚠️ En production, utiliser Redis ou une session
 */
const csrfTokens = new Map();
const TOKEN_EXPIRY = 30 * 60 * 1000; // 30 minutes

/**
 * Middleware pour générer un token CSRF
 * Doit être appelé AVANT les formulaires
 *
 * @example
 * router.get('/form', generateCSRFToken, (req, res) => {
 *   res.json({ token: req.csrfToken });
 * });
 */
const generateCSRFToken = (req, res, next) => {
  // Identifier l'utilisateur par IP uniquement pour cohérence entre généré et validé
  // (userId n'existe pas encore lors de la génération du token pour login)
  const identifier = req.ip || "unknown";

  // Générer un token sécurisé
  const token = crypto.randomBytes(32).toString("hex");

  // Stocker avec timestamp
  csrfTokens.set(token, {
    identifier,
    createdAt: Date.now(),
  });

  // Exposer le token
  req.csrfToken = token;

  next();
};

/**
 * Middleware pour valider un token CSRF
 * À appliquer sur les routes POST/PUT/DELETE
 *
 * @example
 * router.post('/submit-form', validateCSRFToken, controller.submit);
 */
const validateCSRFToken = (req, res, next) => {
  // Extraire le token depuis :
  // 1. Header X-CSRF-Token
  // 2. Body (form-data ou json)
  // 3. Query string
  const token =
    req.headers["x-csrf-token"] ||
    req.body?.csrf_token ||
    req.query?.csrf_token;

  if (!token) {
    return res.status(403).json({
      error: "CSRF protection",
      message: "Token CSRF manquant",
      details: "Envoyez le token dans X-CSRF-Token header ou csrf_token field",
    });
  }

  // Récupérer le token stocké
  const storedToken = csrfTokens.get(token);

  if (!storedToken) {
    return res.status(403).json({
      error: "CSRF protection",
      message: "Token CSRF invalide ou expiré",
    });
  }

  // Vérifier l'identité par IP uniquement
  const identifier = req.ip || "unknown";
  if (storedToken.identifier !== identifier) {
    return res.status(403).json({
      error: "CSRF protection",
      message: "Token CSRF appartient à un autre utilisateur",
    });
  }

  // Vérifier l'expiration
  const now = Date.now();
  if (now - storedToken.createdAt > TOKEN_EXPIRY) {
    csrfTokens.delete(token);
    return res.status(403).json({
      error: "CSRF protection",
      message: "Token CSRF expiré",
    });
  }

  // ✅ Token valide - le consommer (à usage unique)
  csrfTokens.delete(token);

  next();
};

/**
 * Nettoyer les tokens expirés toutes les heures
 */
setInterval(() => {
  const now = Date.now();
  let count = 0;

  for (const [token, data] of csrfTokens.entries()) {
    if (now - data.createdAt > TOKEN_EXPIRY) {
      csrfTokens.delete(token);
      count++;
    }
  }

  if (count > 0) {
    console.log(`🧹 Nettoyage CSRF: ${count} tokens supprimés`);
  }
}, 60 * 60 * 1000);

module.exports = {
  generateCSRFToken,
  validateCSRFToken,
};

const xss = require("xss");

/**
 * Middleware de sanitization XSS
 * Nettoie tous les strings du body pour prévenir les attaques XSS
 *
 * @example
 * app.use(sanitizeXSS);
 */
const sanitizeXSS = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body);
  }

  if (req.query && typeof req.query === "object") {
    sanitizeObject(req.query);
  }

  if (req.params && typeof req.params === "object") {
    sanitizeObject(req.params);
  }

  next();
};

/**
 * Fonction récursive pour nettoyer tous les strings d'un objet
 */
function sanitizeObject(obj) {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      if (typeof value === "string") {
        // Nettoyer les strings contre XSS
        // Options : allowList limité pour sécurité maximale
        obj[key] = xss(value, {
          whiteList: {}, // Pas de tags HTML autorisés
          stripIgnoredTag: true,
          stripLeadingAndTrailingWhitespace: true,
        });
      } else if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        // Récursivement nettoyer les objets imbriqués
        sanitizeObject(value);
      } else if (Array.isArray(value)) {
        // Nettoyer les éléments des arrays
        value.forEach((item, index) => {
          if (typeof item === "string") {
            value[index] = xss(item, {
              whiteList: {},
              stripIgnoredTag: true,
            });
          } else if (typeof item === "object" && item !== null) {
            sanitizeObject(item);
          }
        });
      }
    }
  }
}

module.exports = { sanitizeXSS, sanitizeObject };

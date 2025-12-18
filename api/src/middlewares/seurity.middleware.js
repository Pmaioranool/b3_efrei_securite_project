const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite à 100 requêtes par windowMs
  message: {
    error: "Trop de tentatives de connexion",
    message: "Veuillez réessayer dans 15 minutes",
  },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    error: "Trop de requêtes",
    message: "Veuillez réessayer plus tard",
  },
});

// Configuration Helmet avec sécurité renforcée
const helmetConfig = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // HSTS : Force HTTPS pendant 1 an (31536000 secondes)
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  // Content Security Policy : Définit les sources autorisées
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline pour Swagger
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // X-Frame-Options : Empêche le clickjacking
  frameguard: { action: "deny" },
  // X-Content-Type-Options : Empêche le MIME sniffing
  noSniff: true,
  // Referrer Policy
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
});

module.exports = {
  authLimiter,
  apiLimiter,
  helmetConfig,
};

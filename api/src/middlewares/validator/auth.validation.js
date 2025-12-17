const { body } = require("express-validator");
const { handleValidationErrors } = require("../validation.middleware");

// Validation pour /auth/register et /auth/register/admin
exports.validateRegister = [
  body("pseudonym")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Le pseudonyme doit contenir au moins 2 caractères"),
  body("birthdate")
    .isISO8601()
    .withMessage("La date de naissance doit être au format ISO8601"),
  body("email").trim().isEmail().withMessage("Email invalide"),
  body("password")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&_])[A-Za-z\d$@$!%*?&_]{6,99}$/
    )
    .withMessage(
      "Le mot de passe doit contenir au moins 1 minuscule (?=.*[a-z]), au moins 1 majuscule (?=.*[A-Z]), au moins 1 chiffre, au moins 1 caractère spécial parmi $ @ $ ! % * ? & _, longueur entre 6 et 99"
    ),
  body("role")
    .optional()
    .isIn(["user", "admin", "coach"])
    .withMessage("Rôle invalide (user, admin, coach)"),
  handleValidationErrors,
];

// Validation pour /auth/login
exports.validateLogin = [
  body("email").trim().isEmail().withMessage("Email invalide"),
  body("password").notEmpty().withMessage("Le mot de passe est requis"),
  handleValidationErrors,
];

// Validation pour /auth/refresh
exports.validateRefresh = [
  body("refreshToken").notEmpty().withMessage("Le refresh token est requis"),
  handleValidationErrors,
];

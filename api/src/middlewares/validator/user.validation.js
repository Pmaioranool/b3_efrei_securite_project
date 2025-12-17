const { body, param, query } = require("express-validator");
const { handleValidationErrors } = require("../validation.middleware");

// Pagination pour GET /api/users
exports.validateUserList = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page doit être un entier >= 1"),
  query("pagesize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("pagesize doit être entre 1 et 100"),
  handleValidationErrors,
];

// Validation ID (PostgreSQL integer)
exports.validateUserIdParam = [
  param("id").isInt({ min: 1 }).withMessage("id doit être un entier positif"),
  handleValidationErrors,
];

// PUT /api/users/:id
exports.validateUserUpdate = [
  param("id").isInt({ min: 1 }).withMessage("id doit être un entier positif"),
  body("speudonym")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Le nom doit contenir au moins 2 caractères"),
  body("email").optional().trim().isEmail().withMessage("Email invalide"),
  // S'assurer qu'au moins un champ est présent
  body()
    .custom((value, { req }) => {
      if (!req.body.name && !req.body.email) {
        throw new Error("Au moins un champ (name ou email) est requis");
      }
      return true;
    })
    .withMessage("Au moins un champ (name ou email) est requis"),
  handleValidationErrors,
];

// PUT /api/users/:id/password
exports.validateUserPassword = [
  param("id").isInt({ min: 1 }).withMessage("id doit être un entier positif"),
  body("password")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&_])[A-Za-z\d$@$!%*?&_]{6,99}$/
    )
    .withMessage("Le mot de passe doit contenir au moins 6 caractères"),
  handleValidationErrors,
];

// PUT /api/users/:id/last-login
exports.validateUserLastLogin = [
  param("id").isInt({ min: 1 }).withMessage("id doit être un entier positif"),
  body("last_login")
    .isISO8601()
    .withMessage("last_login doit être une date ISO8601"),
  handleValidationErrors,
];

// PUT /api/users/:id/workouts-completed
exports.validateUserWorkoutIncrement = [
  param("id").isInt({ min: 1 }).withMessage("id doit être un entier positif"),
  body("workoutId").notEmpty().withMessage("workoutId est requis"),
  handleValidationErrors,
];

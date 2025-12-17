const router = require("express").Router();
const AuthController = require("../controllers/auth.controller");
const {
  authenticateToken,
  authorizeRoles,
  authorizeOwnResource,
} = require("../middlewares/auth.middleware");
const {
  validateRegister,
  validateLogin,
  validateRefresh,
} = require("../middlewares/validator/auth.validation");

/**
 * @openapi
 * tags:
 *   name: Authentication
 *   description: Gestion de l'authentification et des utilisateurs
 */

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur (rôle USER par défaut)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *       400:
 *         description: Données invalides
 *       409:
 *         description: Utilisateur déjà existant
 */
router.post("/register", validateRegister, AuthController.register);

/**
 * @openapi
 * /api/auth/register/admin:
 *   post:
 *     summary: Inscription d'un nouvel administrateur (rôle ADMIN forcé)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: Administrateur créé avec succès
 *       400:
 *         description: Données invalides
 *       409:
 *         description: Utilisateur déjà existant
 */
router.post(
  "/register/admin",
  validateRegister,
  authorizeRoles("ADMIN"),
  AuthController.registerAdmin
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "securepassword123"
 *     responses:
 *       200:
 *         description: Connexion réussie
 *       401:
 *         description: Identifiants invalides
 */
router.post("/login", validateLogin, AuthController.login);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Rafraîchir les tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token JWT
 *     responses:
 *       200:
 *         description: Tokens rafraîchis avec succès
 *       401:
 *         description: Refresh token invalide
 */
router.post("/refresh", validateRefresh, AuthController.refresh);

/**
 * @openapi
 * /api/auth/profile:
 *   get:
 *     summary: Récupérer le profil utilisateur
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur récupéré
 *       401:
 *         description: Non authentifié
 */
router.get(
  "/profile",
  authenticateToken,
  authorizeOwnResource(),
  AuthController.getProfile
);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Déconnexion
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 */
router.post("/logout", authenticateToken, AuthController.logout);

module.exports = router;

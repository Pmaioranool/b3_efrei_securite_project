const router = require("express").Router();
const AuthController = require("../controllers/auth.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");
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
 *     summary: Inscription d'un nouvel utilisateur
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "securepassword123"
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 default: user
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
 *    summary: Inscription d'un nouvel administrateur
 *   tags: [Authentication]
 *   requestBody:
 *    required: true
 *   content:
 *    application/json:
 *     schema:
 *      type: object
 *     required:
 *      - name
 *     - email
 *    - password
 *    properties:
 */
router.post("/register/admin", validateRegister, AuthController.registerAdmin);

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
router.get("/profile", authenticateToken, AuthController.getProfile);

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

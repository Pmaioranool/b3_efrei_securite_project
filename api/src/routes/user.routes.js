const router = require("express").Router();
const ctrl = require("../controllers/User.controller");
const {
  authorizeRoles,
  authorizeOwnResource,
} = require("../middlewares/auth.middleware");
const {
  validateUserList,
  validateUserIdParam,
  validateUserUpdate,
  validateUserPassword,
  validateUserLastLogin,
  validateUserWorkoutIncrement,
} = require("../middlewares/validator/user.validation");

/**
 * @openapi
 * tags:
 *   name: Users
 *   description: Gestion des utilisateurs
 */

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Récupérer tous les utilisateurs
 *     description: Retourne la liste de tous les utilisateurs
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des utilisateurs récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Erreur serveur
 */
router.get("/", validateUserList, authorizeRoles("ADMIN"), ctrl.getUser);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Récupérer un utilisateur par ID
 *     description: Retourne les détails d'un utilisateur spécifique
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Détails de l'utilisateur récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get(
  "/:id",
  validateUserIdParam,
  authorizeOwnResource(),
  ctrl.getUserById
);

/**
 * @openapi
 * /api/users:
 *   post:
 *     summary: Créer un nouvel utilisateur
 *     description: Crée un nouveau compte utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Données invalides
 *       500:
 *         description: Erreur serveur
 */

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     summary: Mettre à jour un utilisateur
 *     description: Met à jour les informations d'un utilisateur existant
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdate'
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.put("/:id", validateUserUpdate, authorizeOwnResource(), ctrl.updateUser);

/**
 * @openapi
 * /api/users/{id}/password:
 *   put:
 *     summary: Mettre à jour le mot de passe
 *     description: Met à jour le mot de passe d'un utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: Nouveau mot de passe
 *     responses:
 *       200:
 *         description: Mot de passe mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.put(
  "/:id/password",
  validateUserPassword,
  authorizeOwnResource(),
  ctrl.updateUserPassword
);

/**
 * @openapi
 * /api/users/{id}/last-login:
 *   put:
 *     summary: Mettre à jour la dernière connexion
 *     description: Met à jour la date de dernière connexion d'un utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - last_login
 *             properties:
 *               last_login:
 *                 type: string
 *                 format: date-time
 *                 description: Date et heure de la dernière connexion
 *     responses:
 *       200:
 *         description: Dernière connexion mise à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.put(
  "/:id/last-login",
  validateUserLastLogin,
  authorizeOwnResource(),
  ctrl.updateUserLastLogin
);

/**
 * @openapi
 * /api/users/{id}/workouts-completed:
 *   put:
 *     summary: Incrémenter les workouts complétés
 *     description: Incrémente le compteur de workouts complétés par l'utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workoutId
 *             properties:
 *               workoutId:
 *                 type: string
 *                 description: ID du workout complété
 *     responses:
 *       200:
 *         description: Workout complété enregistré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Utilisateur ou workout non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.put(
  "/:id/workouts-completed",
  validateUserWorkoutIncrement,
  authorizeOwnResource(),
  ctrl.incrementUserWorkoutsCompleted
);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur
 *     description: Supprime un utilisateur de la base de données
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Utilisateur supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User deleted successfully"
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.delete(
  "/:id",
  validateUserIdParam,
  authorizeOwnResource(),
  ctrl.deleteUser
);

module.exports = router;

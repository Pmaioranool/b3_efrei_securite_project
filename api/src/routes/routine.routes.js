const router = require("express").Router();
const ctrl = require("../controllers/routine.controller");
const {
  authenticateToken,
  authorizeOwnResource,
  authorizeRoles,
} = require("../middlewares/auth.middleware");
const {
  validateRoutineCreation,
  // validateRoutineUpdate,
  // validateRoutineId,
} = require("../middlewares/validator/routine.validation");

// Protéger toutes les routes de routine avec authentification
router.use(authenticateToken);

/**
 * @openapi
 * tags:
 *   name: Routines
 *   description: Gestion des routines d'entraînement planifiées (CRON)
 */

/**
 * @openapi
 * /api/routines:
 *   get:
 *     summary: Récupérer toutes les routines
 *     description: Retourne la liste de toutes les routines planifiées avec leurs workouts associés
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des routines récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Routine'
 *       500:
 *         description: Erreur serveur
 */
router.get("/", authorizeRoles("admin"), ctrl.getRoutine);

/**
 * @openapi
 * /api/routines/{id}:
 *   get:
 *     summary: Récupérer une routine par ID
 *     description: Retourne les détails d'une routine spécifique avec son workout associé
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la routine (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Détails de la routine récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Routine'
 *       404:
 *         description: Routine non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.get("/:id", authorizeOwnResource(), ctrl.getRoutineById);

/**
 * @openapi
 * /api/routines:
 *   post:
 *     summary: Créer une nouvelle routine
 *     description: Crée une nouvelle routine planifiée avec une expression CRON
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoutineInput'
 *     responses:
 *       201:
 *         description: Routine créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Routine'
 *       400:
 *         description: Données invalides (expression CRON invalide, champs manquants)
 *       500:
 *         description: Erreur serveur
 */
router.post(
  "/",
  validateRoutineCreation,
  authorizeOwnResource(),
  ctrl.createRoutine
);

/**
 * @openapi
 * /api/routines/{id}:
 *   put:
 *     summary: Mettre à jour une routine
 *     description: Met à jour les informations d'une routine existante
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la routine (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoutineUpdate'
 *     responses:
 *       200:
 *         description: Routine mise à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Routine'
 *       400:
 *         description: Données invalides
 *       404:
 *         description: Routine non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.put(
  "/:id",
  validateRoutineCreation,
  authorizeOwnResource(),
  ctrl.updateRoutine
);

/**
 * @openapi
 * /api/routines/{id}:
 *   delete:
 *     summary: Supprimer une routine
 *     description: Supprime une routine spécifique de la base de données
 *     tags: [Routines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la routine (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Routine supprimée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deleted:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Routine non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.delete("/:id", authorizeOwnResource(), ctrl.deleteRoutine);

module.exports = router;

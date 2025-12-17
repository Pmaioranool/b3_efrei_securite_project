const router = require("express").Router();
const ctrl = require("../controllers/Workout.controller");
const {
  authorizeOwnResource,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

/**
 * @openapi
 * tags:
 *   name: Workouts
 *   description: Gestion des programmes d'entraînement
 */

/**
 * @openapi
 * /api/workouts:
 *   get:
 *     summary: Récupérer tous les workouts
 *     description: Retourne la liste des workouts avec les exercices associés
 *     tags: [Workouts]
 *     responses:
 *       200:
 *         description: Liste des workouts récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Workout'
 *       500:
 *         description: Erreur serveur
 */
router.get("/", authorizeRoles("ADMIN"), ctrl.getWorkout);

/**
 * @openapi
 * /api/workouts/templates:
 *   get:
 *     summary: Récupérer tous les templates de workouts
 *     description: Retourne la liste des workouts templates partageables entre utilisateurs
 *     tags: [Workouts]
 *     responses:
 *       200:
 *         description: Liste des templates récupérée avec succès
 *       500:
 *         description: Erreur serveur
 */
router.get("/templates", authorizeOwnResource(), ctrl.getTemplates);

/**
 * @openapi
 * /api/workouts/{id}:
 *   get:
 *     summary: Récupérer un workout par ID
 *     description: Retourne les détails d'un workout spécifique avec ses exercices
 *     tags: [Workouts]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du workout
 *     responses:
 *       200:
 *         description: Détails du workout récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Workout'
 *       404:
 *         description: Workout non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get("/:id", authorizeOwnResource(), ctrl.getWorkoutById);

/**
 * @openapi
 * /api/workouts:
 *   post:
 *     summary: Créer un nouveau workout
 *     description: Crée un nouveau programme d'entraînement
 *     tags: [Workouts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkoutInput'
 *           example:
 *             name: "Morning Routine"
 *             userId: 1
 *             template: false
 *             exercises:
 *               - exercise: "676052bc8bb421fef3e3df01"
 *                 rest: 60
 *                 sets:
 *                   - rep: 10
 *                     weight: 50   # optionnel
 *                   - rep: 8
 *                     duration: 30 # optionnel
 *               - exercise: "676052bc8bb421fef3e3df02"
 *                 rest: 90
 *                 sets:
 *                   - rep: 12
 *                   - rep: 10
 *     responses:
 *       201:
 *         description: Workout créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Workout'
 *       400:
 *         description: Données invalides
 *       500:
 *         description: Erreur serveur
 */
router.post("/", authorizeOwnResource(), ctrl.createWorkout);

/**
 * @openapi
 * /api/workouts/{id}:
 *   put:
 *     summary: Mettre à jour un workout
 *     description: Met à jour les informations d'un workout existant
 *     tags: [Workouts]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du workout
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkoutInput'
 *     responses:
 *       200:
 *         description: Workout mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Workout'
 *       404:
 *         description: Workout non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.put("/:id", authorizeOwnResource(), ctrl.updateWorkout);

/**
 * @openapi
 * /api/workouts/templates/{templateId}/clone:
 *   post:
 *     summary: Cloner un template de workout
 *     description: Crée une copie personnelle d'un template de workout pour un utilisateur
 *     tags: [Workouts]
 *     parameters:
 *       - name: templateId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du template à cloner
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: number
 *                 description: ID de l'utilisateur qui clone le template
 *               customName:
 *                 type: string
 *                 description: Nom personnalisé pour le workout cloné (optionnel)
 *     responses:
 *       201:
 *         description: Template cloné avec succès
 *       400:
 *         description: Données manquantes
 *       404:
 *         description: Template non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.post("/templates/:templateId/clone", ctrl.cloneTemplate);

/**
 * @openapi
 * /api/workouts/{id}:
 *   delete:
 *     summary: Supprimer un workout
 *     description: Supprime un workout de la base de données
 *     tags: [Workouts]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du workout
 *     responses:
 *       200:
 *         description: Workout supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Workout deleted successfully"
 *       404:
 *         description: Workout non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.delete("/:id", authorizeOwnResource(), ctrl.deleteWorkout);

module.exports = router;

const router = require("express").Router();
const ctrl = require("../controllers/Exercise.controller");
const { authorizeRoles } = require("../middlewares/auth.middleware");

/**
 * @openapi
 * tags:
 *   name: Exercises
 *   description: Gestion des exercices de fitness
 */

/**
 * @openapi
 * /api/exercises:
 *   get:
 *     summary: Récupérer tous les exercices
 *     description: Retourne la liste des exercices avec possibilité de filtrage
 *     tags: [Exercises]
 *     parameters:
 *       - name: title
 *         in: query
 *         schema:
 *           type: string
 *         description: Filtre par titre (recherche insensible à la casse)
 *       - name: level
 *         in: query
 *         schema:
 *           type: string
 *           enum: [Beginner, Intermediate, Advanced]
 *         description: Filtre par niveau de difficulté
 *       - name: rating
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 5
 *         description: Filtre par rating minimum
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Limite le nombre de résultats
 *       - name: all
 *         in: query
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Retourne tous les résultats sans limite
 *     responses:
 *       200:
 *         description: Liste des exercices récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Exercise'
 *       500:
 *         description: Erreur serveur
 */
router.get("/", ctrl.getExercise);

/**
 * @openapi
 * /api/exercises/{id}:
 *   get:
 *     summary: Récupérer un exercice par ID
 *     description: Retourne les détails d'un exercice spécifique
 *     tags: [Exercises]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'exercice
 *     responses:
 *       200:
 *         description: Détails de l'exercice récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Exercise'
 *       404:
 *         description: Exercice non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get("/:id", ctrl.getExerciseById);

/**
 * @openapi
 * /api/exercises:
 *   post:
 *     summary: Créer un nouvel exercice
 *     description: Crée un nouvel exercice avec les informations fournies
 *     tags: [Exercises]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExerciseInput'
 *     responses:
 *       201:
 *         description: Exercice créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Exercise'
 *       400:
 *         description: Données invalides
 *       500:
 *         description: Erreur serveur
 */
router.post("/", authorizeRoles("ADMIN"), ctrl.createExercise);

/**
 * @openapi
 * /api/exercises/{id}:
 *   put:
 *     summary: Mettre à jour un exercice
 *     description: Met à jour les informations d'un exercice existant
 *     tags: [Exercises]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'exercice
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExerciseInput'
 *     responses:
 *       200:
 *         description: Exercice mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Exercise'
 *       404:
 *         description: Exercice non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.put("/:id", authorizeRoles("ADMIN"), ctrl.updateExercise);

/**
 * @openapi
 * /api/exercises/{id}:
 *   delete:
 *     summary: Supprimer un exercice
 *     description: Supprime un exercice de la base de données
 *     tags: [Exercises]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'exercice
 *     responses:
 *       200:
 *         description: Exercice supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Exercise deleted successfully"
 *       404:
 *         description: Exercice non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.delete("/:id", authorizeRoles("ADMIN"), ctrl.deleteExercise);

module.exports = router;

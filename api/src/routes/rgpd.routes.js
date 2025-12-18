const { validateCSRFToken } = require("../middlewares/csrf.middleware");
const router = require("express").Router();
const RGPDController = require("../controllers/RGPD.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

/**
 * @openapi
 * tags:
 *   name: RGPD
 *   description: Gestion des droits RGPD (accès, portabilité, oubli)
 */

// Toutes les routes RGPD nécessitent une authentification
router.use(authenticateToken);

/**
 * @openapi
 * /api/rgpd/my-data:
 *   get:
 *     summary: Récupérer toutes mes données personnelles
 *     description: Article 15 RGPD - Droit d'accès aux données personnelles
 *     tags: [RGPD]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Données personnelles récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     workouts:
 *                       type: array
 *                     exportedAt:
 *                       type: string
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
router.get("/my-data", RGPDController.getMyData);

/**
 * @openapi
 * /api/rgpd/export:
 *   get:
 *     summary: Exporter mes données au format JSON
 *     description: Article 20 RGPD - Droit à la portabilité des données
 *     tags: [RGPD]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Export JSON téléchargé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 format:
 *                   type: string
 *                   example: JSON
 *                 version:
 *                   type: string
 *                 exportDate:
 *                   type: string
 *                 data:
 *                   type: object
 *       401:
 *         description: Non authentifié
 */
router.get("/export", RGPDController.exportMyData);

/**
 * @openapi
 * /api/rgpd/delete-account:
 *   delete:
 *     summary: Supprimer définitivement mon compte
 *     description: Article 17 RGPD - Droit à l'oubli (suppression définitive)
 *     tags: [RGPD]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - confirmation
 *             properties:
 *               confirmation:
 *                 type: string
 *                 example: DELETE_MY_ACCOUNT
 *                 description: Doit être exactement "DELETE_MY_ACCOUNT"
 *     responses:
 *       200:
 *         description: Compte supprimé définitivement
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 result:
 *                   type: object
 *       400:
 *         description: Confirmation manquante ou invalide
 *       401:
 *         description: Non authentifié
 */
router.delete(
  "/delete-account",
  validateCSRFToken,
  RGPDController.deleteMyAccount
);

/**
 * @openapi
 * /api/rgpd/anonymize:
 *   post:
 *     summary: Anonymiser mon compte
 *     description: Alternative à la suppression - conserve les données statistiques anonymisées
 *     tags: [RGPD]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Compte anonymisé avec succès
 *       401:
 *         description: Non authentifié
 */
router.post("/anonymize", validateCSRFToken, RGPDController.anonymizeMyAccount);

module.exports = router;

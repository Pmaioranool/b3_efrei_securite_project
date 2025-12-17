const router = require("express").Router();

const fs = require("fs");
const path = require("path");
const { pool } = require("../config/db.postgres");
const { connectMongo } = require("../config/db.mongo");
const { authorizeRoles } = require("../middlewares/auth.middleware");

// Test des connexions aux bases de données
/**
 * @openapi
 * /api/test-db:
 *   get:
 *     summary: Vérifier les connexions PostgreSQL et MongoDB
 *     description: Accessible uniquement aux administrateurs. Retourne l'état des connexions aux bases et un timestamp.
 *     tags: [Utilities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Connexions réussies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 postgresql:
 *                   type: string
 *                   example: Connected successfully
 *                 mongodb:
 *                   type: string
 *                   example: Connected successfully
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès réservé aux ADMIN
 *       500:
 *         description: Erreur interne serveur
 */
router.get("/test-db", authorizeRoles("ADMIN"), async (req, res) => {
  try {
    // Test PostgreSQL
    const pgResult = await pool.query("SELECT NOW()");

    // Test MongoDB
    await connectMongo();

    res.json({
      status: "ok",
      postgresql: "Connected successfully",
      mongodb: "Connected successfully",
      timestamp: pgResult.rows[0].now,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

//init user table if needed

/**
 * @openapi
 * /api/db/init:
 *   get:
 *     summary: Initialiser la base PostgreSQL
 *     description: Exécute le script init.sql pour préparer les tables. Réservé aux administrateurs.
 *     tags: [Utilities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Base initialisée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: Database initialized
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès réservé aux ADMIN
 *       500:
 *         description: Erreur lors de l'initialisation
 */
router.get("/db/init", authorizeRoles("ADMIN"), async (req, res) => {
  try {
    const sqlFile = fs.readFileSync(
      path.join(__dirname, "../../sql/init.sql"),
      "utf8"
    );
    await pool.query(sqlFile);
    res.json({ status: "Database initialized" });
  } catch (error) {
    res.status(500).json({
      status: "Error initializing database",
      error: error.message,
    });
  }
});

router.get("/db/reset", authorizeRoles("ADMIN"), async (req, res) => {
  /**
   * @openapi
   * /api/db/reset:
   *   get:
   *     summary: Réinitialiser puis réinitialiser la base PostgreSQL
   *     description: Environnement DEVELOPMENT uniquement. Nécessite la confirmation via le paramètre de requête `sure=true`.
   *     tags: [Utilities]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: sure
   *         required: true
   *         schema:
   *           type: string
   *           enum: ["true"]
   *         description: Confirme l'opération destructive
   *     responses:
   *       200:
   *         description: Base réinitialisée puis ré-initialisée
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: Database initialized after reset
   *       400:
   *         description: Paramètre de confirmation manquant
   *       401:
   *         description: Non authentifié
   *       403:
   *         description: Opération interdite hors environnement de développement
   *       500:
   *         description: Erreur lors du reset
   */
  try {
    // sécurité singe
    if (process.env.NODE_ENV !== "DEVELOPMENT") {
      return res.status(403).json({
        status: "Forbidden",
        error: "Database reset is not allowed in this environment",
      });
    }
    const sure = req.query.sure;
    if (sure !== "true") {
      return res.status(400).json({
        status: "Bad Request",
        error: 'Please confirm reset by adding "?sure=true" to the request URL',
      });
    }
    const sqlResetFile = fs.readFileSync(
      path.join(__dirname, "../../sql/reset.sql"),
      "utf8"
    );
    await pool.query(sqlResetFile);

    const sqlInitFile = fs.readFileSync(
      path.join(__dirname, "../../sql/init.sql"),
      "utf8"
    );
    await pool.query(sqlInitFile);
    res.json({ status: "Database initialized after reset" });
  } catch (error) {
    res.status(500).json({
      status: "Error resetting database",
      error: error.message,
    });
  }
});

router.get("/test/roles", authorizeRoles("ADMIN"), (req, res) => {
  /**
   * @openapi
   * /api/test/roles:
   *   get:
   *     summary: Vérifier l'accès ADMIN
   *     description: Endpoint de test qui nécessite le rôle ADMIN.
   *     tags: [Utilities]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Accès accordé
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Vous avez accès à cette ressource réservée aux ADMIN.
   *       401:
   *         description: Non authentifié
   *       403:
   *         description: Accès réservé aux ADMIN
   */
  res.json({
    message: "Vous avez accès à cette ressource réservée aux ADMIN.",
  });
});

module.exports = router;

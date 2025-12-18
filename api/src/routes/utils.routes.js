const router = require("express").Router();

const fs = require("fs");
const path = require("path");
const { pool } = require("../config/db.postgres");
const { connectMongo } = require("../config/db.mongo");
const { authorizeRoles } = require("../middlewares/auth.middleware");
const {
  generateCSRFToken,
  validateCSRFToken,
} = require("../middlewares/csrf.middleware");

router.get("/csrf-token", generateCSRFToken, (req, res) => {
  res.json({ token: req.csrfToken });
});
/* swagger omit */

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

// pas d'autorisation admin pour l'init/reset (clé API requise)
router.post("/db/init", validateCSRFToken, async (req, res) => {
  // Bloquer en prod/staging par défaut
  if (process.env.NODE_ENV !== "DEVELOPMENT") {
    return res.status(403).json({
      status: "Forbidden",
      error: "Database init is not allowed in this environment",
    });
  }

  const apiKey = req.headers["x-db-init-key"];
  if (!apiKey || apiKey !== process.env.DB_INIT_KEY) {
    return res.status(403).json({
      status: "Forbidden",
      error: "Invalid initialization key",
    });
  }

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

router.post(
  "/db/reset",
  authorizeRoles("ADMIN"),
  validateCSRFToken,
  async (req, res) => {
    try {
      if (process.env.NODE_ENV !== "DEVELOPMENT") {
        return res.status(403).json({
          status: "Forbidden",
          error: "Database reset is not allowed in this environment",
        });
      }

      const sure = req.body?.sure || req.query?.sure;
      if (sure !== true && sure !== "true") {
        return res.status(400).json({
          status: "Bad Request",
          error: 'Please confirm reset by sending {"sure": true}',
        });
      }

      const apiKey = req.headers["x-db-init-key"];
      if (!apiKey || apiKey !== process.env.DB_RESET_KEY) {
        return res.status(403).json({
          status: "Forbidden",
          error: "Invalid initialization key",
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
  }
);

router.get("/test/roles", authorizeRoles("ADMIN"), (req, res) => {
  res.json({
    message: "Vous avez accès à cette ressource réservée aux ADMIN.",
  });
});

module.exports = router;

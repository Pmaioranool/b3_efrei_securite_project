const router = require("express").Router();

const fs = require("fs");
const path = require("path");
const { pool } = require("../config/db.postgres");
const { connectMongo } = require("../config/db.mongo");
const { authorizeRoles } = require("../middlewares/auth.middleware");

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

router.get("/db/init", async (req, res) => {
  if (process.env.NODE_ENV !== "DEVELOPMENT") {
    return res.status(403).json({
      status: "Forbidden",
      error: "Database reset is not allowed in this environment",
    });
  }

  if (req.params.key !== process.env.DB_INIT_KEY) {
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

router.get("/db/reset", async (req, res) => {
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

    if (req.params.key !== process.env.DB_INIT_KEY) {
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
});

router.get("/test/roles", authorizeRoles("ADMIN"), (req, res) => {
  res.json({
    message: "Vous avez accès à cette ressource réservée aux ADMIN.",
  });
});

module.exports = router;

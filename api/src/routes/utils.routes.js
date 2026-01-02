const router = require("express").Router();

const { connectMongo } = require("../config/db.mongo");
const { authorizeRoles } = require("../middlewares/auth.middleware");
const {
  generateCSRFToken,
  validateCSRFToken,
} = require("../middlewares/csrf.middleware");
const mongoose = require("mongoose");
const User = require("../models/User.model"); // Ensure User model is loaded

router.get("/csrf-token", generateCSRFToken, (req, res) => {
  res.json({ token: req.csrfToken });
});
/* swagger omit */

router.get("/test-db", authorizeRoles("ADMIN"), async (req, res) => {
  try {
    // Test MongoDB
    await connectMongo();

    res.json({
      status: "ok",
      mongodb: "Connected successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Helper function to seed database
const performSeed = async () => {
  // Clear Users
  const UserModel = mongoose.model("User");
  await UserModel.deleteMany({});

  // Create Admin
  await User.create({
    pseudonym: "admin",
    email: "admin@admin.com",
    password: "adminpassword", // Will be hashed by User.create
    role: "ADMIN"
  });
  return "Database seeded successfully";
}

router.post("/db/init", validateCSRFToken, async (req, res) => {
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
    await performSeed();
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
      if (!apiKey || apiKey !== process.env.DB_INIT_KEY) {
        return res.status(403).json({
          status: "Forbidden",
          error: "Invalid initialization key",
        });
      }

      await performSeed();

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

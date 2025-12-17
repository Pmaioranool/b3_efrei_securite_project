const express = require("express");
const app = express();
const cors = require("cors");
const PORT = 3000;
const { pool } = require("./config/db.postgres");
const { connectMongo } = require("./config/db.mongo");
const { authorizeRoles } = require("./middlewares/auth.middleware");

// Configuration CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Connexion aux bases de données avant de démarrer le serveur
async function startServer() {
  try {
    // Connexion MongoDB
    await connectMongo();

    // Test PostgreSQL
    const pgResult = await pool.query("SELECT NOW()");
    console.log("✅ PostgreSQL connected:", pgResult.rows[0]);
  } catch (error) {
    console.error("Erreur de démarrage:", error);
    process.exit(1);
  }
}

startServer();

// Test des connexions aux bases de données
app.get("/api/test-db", async (req, res) => {
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
const fs = require("fs");
const path = require("path");

app.get("/api/db/init", authorizeRoles("ADMIN"), async (req, res) => {
  try {
    const sqlFile = fs.readFileSync(
      path.join(__dirname, "../sql/init.sql"),
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

app.get("/api/db/reset", authorizeRoles("ADMIN"), async (req, res) => {
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
      path.join(__dirname, "../sql/reset.sql"),
      "utf8"
    );
    await pool.query(sqlResetFile);

    const sqlInitFile = fs.readFileSync(
      path.join(__dirname, "../sql/init.sql"),
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

app.get("/api/test/roles", authorizeRoles("admin"), (req, res) => {
  res.json({
    message: "Vous avez accès à cette ressource réservée aux ADMIN.",
  });
});

// Mount routes
const exerciseRoutes = require("./routes/exercise.routes");
app.use("/api/exercises", exerciseRoutes);
const workoutRoutes = require("./routes/workout.routes");
app.use("/api/workouts", workoutRoutes);
const userRoutes = require("./routes/user.routes");
app.use("/api/users", userRoutes);
const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);
const routineRoutes = require("./routes/routine.routes");
app.use("/api/routines", routineRoutes);

// Health
app.get("/api/status", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

const swaggerSetup = require("./swagger-setup");

// Après avoir configuré vos routes
swaggerSetup(app);

app.get("/pinte", (req, res) => {
  res.send("+1 pinte");
});

// 404
app.use((req, res) => res.status(404).json({ error: "Route inconnue" }));

// Error handler
app.use((err, req, res, next) => {
  console.error(" Erreur serveur:", err.message);
  res.status(500).json({ error: "Erreur interne serveur" });
});

app.listen(PORT, () => console.log(` API prête sur http://localhost:${PORT}`));

const express = require("express");
const app = express();
const cors = require("cors");
const PORT = 3000;
const { pool } = require("./config/db.postgres");
const { connectMongo } = require("./config/db.mongo");

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

// utils routes
const utilsRoutes = require("./routes/utils.routes");
app.use("/api/", utilsRoutes);

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

// 404
app.use((req, res) => res.status(404).json({ error: "Route inconnue" }));

// Error handler
app.use((err, req, res, next) => {
  console.error(" Erreur serveur:", err.message);
  res.status(500).json({ error: "Erreur interne serveur" });
});

app.listen(PORT, () => console.log(` API prête sur http://localhost:${PORT}`));

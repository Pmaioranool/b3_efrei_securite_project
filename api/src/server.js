const express = require("express");
const https = require("https");
const fs = require("fs");
const path = require("path");
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 3000;
const { pool } = require("./config/db.postgres");
const { connectMongo } = require("./config/db.mongo");
require("dotenv").config();
const {
  helmetConfig,
  apiLimiter,
  forceHTTPS,
} = require("./middlewares/seurity.middleware");
const { sanitizeXSS } = require("./middlewares/xss.middleware");

// Force HTTPS redirection (doit être avant CORS)
app.use(forceHTTPS);

// Configuration CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  })
);

app.use(helmetConfig);
app.use(apiLimiter);

app.use(express.json());

// Sanitization XSS : nettoyer les inputs
app.use(sanitizeXSS);

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
const rgpdRoutes = require("./routes/rgpd.routes");
app.use("/api/rgpd", rgpdRoutes);

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

// Configuration HTTPS avec certificats auto-signés (dev) ou production
if (process.env.NODE_ENV === "PRODUCTION" && process.env.USE_HTTPS === "true") {
  try {
    const httpsOptions = {
      key: fs.readFileSync(path.join(__dirname, "../certs/private-key.pem")),
      cert: fs.readFileSync(path.join(__dirname, "../certs/certificate.pem")),
    };

    https.createServer(httpsOptions, app).listen(PORT, () => {
      console.log(`🔒 API sécurisée (HTTPS) sur https://localhost:${PORT}`);
      console.log(
        `⚠️  Certificat auto-signé : ignorer l'avertissement du navigateur`
      );
    });
  } catch (error) {
    console.error("❌ Erreur chargement certificats HTTPS:", error.message);
    console.log("ℹ️  Basculement sur HTTP...");
    app.listen(PORT, () =>
      console.log(`⚡ API prête sur http://localhost:${PORT}`)
    );
  }
} else {
  app.listen(PORT, () =>
    console.log(`⚡ API prête sur http://localhost:${PORT}`)
  );
}

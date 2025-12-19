import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import { metricsMiddleware } from "./middlewares/metricsMiddleware.js";
import monitoringRoutes from "./routes/monitoringRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de base
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// IMPORTANT : monitoring avant tout
app.use(metricsMiddleware);
app.use(monitoringRoutes);

// Optionnel : endpoint simple de “ready” (toujours OK en monitoring-only)
app.get("/readyz", (req, res) => {
  res.status(200).json({ ok: true, mode: "monitoring-only" });
});

// Petite route de test
app.get("/ping", (req, res) => res.status(200).send("pong"));

// 404
app.use((req, res) => res.status(404).json({ error: "Route inconnue" }));

// Error handler
app.use((err, req, res, next) => {
  console.error("Erreur serveur:", err?.message || err);
  res.status(500).json({ error: "Erreur interne serveur" });
});

app.listen(PORT, () => {
  console.log(`Monitoring API prête sur http://localhost:${PORT}`);
});

import { Router } from "express";
import { register } from "../utils/metrics.js";

const router = Router();

router.get("/healthz", (req, res) => res.status(200).json({ ok: true }));

router.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

export default router;

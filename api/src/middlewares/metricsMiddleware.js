import { httpRequestDuration } from "../utils/metrics.js";

export function metricsMiddleware(req, res, next) {
  const end = httpRequestDuration.startTimer();

  res.on("finish", () => {
    const route = req.route?.path || req.path || "unknown";
    end({
      method: req.method,
      route,
      status_code: String(res.statusCode),
    });
  });

  next();
}

import express from "express";
import { InsightsService, RANGES, RangeKey } from "./insightsService.js";

export function createRouter(service: InsightsService): express.Router {
  const router = express.Router();

  router.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  router.get("/summary", async (req, res) => {
    const resourceId = typeof req.query.resourceId === "string" ? req.query.resourceId : "";
    const range = (typeof req.query.range === "string" ? req.query.range : "24h") as RangeKey;

    if (!resourceId) {
      res.status(400).json({ error: "resourceId query parameter is required" });
      return;
    }
    if (!(range in RANGES)) {
      res.status(400).json({ error: `range must be one of: ${Object.keys(RANGES).join(", ")}` });
      return;
    }
    if (!service.isAllowed(resourceId)) {
      res.status(403).json({ error: "resourceId is not in azureInsights.resources" });
      return;
    }

    try {
      res.json(await service.getSummary(resourceId, range));
    } catch (error) {
      console.error("azure-insights query failed", error);
      res.status(502).json({ error: "Failed to query Azure Application Insights" });
    }
  });

  return router;
}

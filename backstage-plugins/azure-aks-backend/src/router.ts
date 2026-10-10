import express from "express";
import { AksService, parseClusterId } from "./aksService.js";

export function createRouter(service: AksService): express.Router {
  const router = express.Router();

  router.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  router.get("/cluster", async (req, res) => {
    const clusterId = typeof req.query.clusterId === "string" ? req.query.clusterId : "";

    if (!clusterId || !parseClusterId(clusterId)) {
      res.status(400).json({ error: "clusterId must be an AKS managedClusters resource ID" });
      return;
    }
    if (!service.isAllowed(clusterId)) {
      res.status(403).json({ error: "clusterId is not in azureAks.clusters" });
      return;
    }

    try {
      res.json(await service.getCluster(clusterId));
    } catch (error) {
      console.error("azure-aks read failed", error);
      res.status(502).json({ error: "Failed to read AKS cluster from Azure" });
    }
  });

  return router;
}

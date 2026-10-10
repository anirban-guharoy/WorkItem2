import express from "express";
import { AtlasService, isValidRef } from "./atlasService.js";

export function createRouter(service: AtlasService): express.Router {
  const router = express.Router();

  router.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  router.get("/cluster", async (req, res) => {
    const projectId = typeof req.query.projectId === "string" ? req.query.projectId : "";
    const clusterName = typeof req.query.clusterName === "string" ? req.query.clusterName : "";

    if (!isValidRef(projectId, clusterName)) {
      res.status(400).json({ error: "projectId (24-char hex) and clusterName are required and must be valid" });
      return;
    }
    if (!service.isAllowed(projectId, clusterName)) {
      res.status(403).json({ error: "cluster is not in mongodbAtlas.clusters" });
      return;
    }

    try {
      res.json(await service.getCluster(projectId, clusterName));
    } catch (error) {
      console.error("mongodb-atlas read failed", error);
      res.status(502).json({ error: "Failed to read cluster from MongoDB Atlas" });
    }
  });

  return router;
}

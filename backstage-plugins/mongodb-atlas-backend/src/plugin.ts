import { coreServices, createBackendPlugin } from "@backstage/backend-plugin-api";
import { AtlasService } from "./atlasService.js";
import { createRouter } from "./router.js";

export const mongodbAtlasPlugin = createBackendPlugin({
  pluginId: "mongodb-atlas",
  register(env) {
    env.registerInit({
      deps: {
        config: coreServices.rootConfig,
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
      },
      async init({ config, httpRouter, logger }) {
        const atlas = config.getConfig("mongodbAtlas");
        const allowedClusters = atlas.getOptionalStringArray("clusters") ?? [];
        if (allowedClusters.length === 0) {
          logger.warn("mongodbAtlas.clusters is empty; all requests will be rejected");
        }
        httpRouter.use(
          createRouter(
            new AtlasService({
              baseUrl: (atlas.getOptionalString("baseUrl") ?? "https://cloud.mongodb.com").replace(/\/$/, ""),
              clientId: atlas.getString("clientId"),
              clientSecret: atlas.getString("clientSecret"),
              allowedClusters,
            }),
          ),
        );
      },
    });
  },
});

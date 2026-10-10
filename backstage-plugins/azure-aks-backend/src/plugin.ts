import { coreServices, createBackendPlugin } from "@backstage/backend-plugin-api";
import { AksService } from "./aksService.js";
import { createRouter } from "./router.js";

export const azureAksPlugin = createBackendPlugin({
  pluginId: "azure-aks",
  register(env) {
    env.registerInit({
      deps: {
        config: coreServices.rootConfig,
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
      },
      async init({ config, httpRouter, logger }) {
        const clusters = config.getOptionalStringArray("azureAks.clusters") ?? [];
        if (clusters.length === 0) {
          logger.warn("azureAks.clusters is empty; all requests will be rejected");
        }
        httpRouter.use(createRouter(new AksService(clusters)));
      },
    });
  },
});

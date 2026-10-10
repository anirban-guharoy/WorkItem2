import { coreServices, createBackendPlugin } from "@backstage/backend-plugin-api";
import { InsightsService } from "./insightsService.js";
import { createRouter } from "./router.js";

export const azureInsightsPlugin = createBackendPlugin({
  pluginId: "azure-insights",
  register(env) {
    env.registerInit({
      deps: {
        config: coreServices.rootConfig,
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
      },
      async init({ config, httpRouter, logger }) {
        const resources = config.getOptionalStringArray("azureInsights.resources") ?? [];
        if (resources.length === 0) {
          logger.warn("azureInsights.resources is empty; all queries will be rejected");
        }
        httpRouter.use(createRouter(new InsightsService(resources)));
      },
    });
  },
});

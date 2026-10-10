import {
  createApiFactory,
  createComponentExtension,
  createPlugin,
  discoveryApiRef,
  fetchApiRef,
} from "@backstage/core-plugin-api";
import { azureInsightsApiRef, AzureInsightsClient } from "./api.js";

export const azureInsightsPlugin = createPlugin({
  id: "azure-insights",
  apis: [
    createApiFactory({
      api: azureInsightsApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: ({ discoveryApi, fetchApi }) => new AzureInsightsClient({ discoveryApi, fetchApi }),
    }),
  ],
});

export const EntityAzureInsightsCard = azureInsightsPlugin.provide(
  createComponentExtension({
    name: "EntityAzureInsightsCard",
    component: {
      lazy: () => import("./components/AzureInsightsCard.js").then((m) => m.AzureInsightsCard),
    },
  }),
);

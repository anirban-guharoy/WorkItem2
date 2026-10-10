import {
  createApiFactory,
  createComponentExtension,
  createPlugin,
  discoveryApiRef,
  fetchApiRef,
} from "@backstage/core-plugin-api";
import { azureAksApiRef, AzureAksClient } from "./api.js";

export const azureAksPlugin = createPlugin({
  id: "azure-aks",
  apis: [
    createApiFactory({
      api: azureAksApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: ({ discoveryApi, fetchApi }) => new AzureAksClient({ discoveryApi, fetchApi }),
    }),
  ],
});

export const EntityAksClusterCard = azureAksPlugin.provide(
  createComponentExtension({
    name: "EntityAksClusterCard",
    component: {
      lazy: () => import("./components/AksClusterCard.js").then((m) => m.AksClusterCard),
    },
  }),
);

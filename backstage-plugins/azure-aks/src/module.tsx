import {
  ApiBlueprint,
  createFrontendModule,
  discoveryApiRef,
  fetchApiRef,
} from "@backstage/frontend-plugin-api";
import { EntityCardBlueprint } from "@backstage/plugin-catalog-react/alpha";
import { azureAksApiRef, AzureAksClient } from "./api.js";

export const azureAksModule = createFrontendModule({
  pluginId: "catalog",
  extensions: [
    ApiBlueprint.make({
      name: "azureAksApi",
      params: (defineParams) =>
        defineParams({
          api: azureAksApiRef,
          deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
          factory: ({ discoveryApi, fetchApi }) => new AzureAksClient({ discoveryApi, fetchApi }),
        }),
    }),
    EntityCardBlueprint.make({
      name: "azureAksClusterCard",
      params: {
        type: "info",
        loader: async () => {
          const { AksClusterCard } = await import("./components/AksClusterCard.js");
          return <AksClusterCard />;
        },
      },
    }),
  ],
});

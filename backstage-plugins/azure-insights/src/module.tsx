import {
  ApiBlueprint,
  createFrontendModule,
  discoveryApiRef,
  fetchApiRef,
} from "@backstage/frontend-plugin-api";
import { EntityCardBlueprint } from "@backstage/plugin-catalog-react/alpha";
import { azureInsightsApiRef, AzureInsightsClient } from "./api.js";

export const azureInsightsModule = createFrontendModule({
  pluginId: "catalog",
  extensions: [
    ApiBlueprint.make({
      name: "azureInsightsApi",
      params: (defineParams) =>
        defineParams({
          api: azureInsightsApiRef,
          deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
          factory: ({ discoveryApi, fetchApi }) => new AzureInsightsClient({ discoveryApi, fetchApi }),
        }),
    }),
    EntityCardBlueprint.make({
      name: "azureInsightsCard",
      params: {
        type: "info",
        loader: async () => {
          const { AzureInsightsCard } = await import("./components/AzureInsightsCard.js");
          return <AzureInsightsCard />;
        },
      },
    }),
  ],
});

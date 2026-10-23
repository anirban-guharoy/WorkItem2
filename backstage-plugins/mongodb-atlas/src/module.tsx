import {
  ApiBlueprint,
  createFrontendModule,
  discoveryApiRef,
  fetchApiRef,
} from "@backstage/frontend-plugin-api";
import { EntityCardBlueprint } from "@backstage/plugin-catalog-react/alpha";
import { mongoDbAtlasApiRef, MongoDbAtlasClient } from "./api.js";

export const mongodbAtlasModule = createFrontendModule({
  pluginId: "catalog",
  extensions: [
    ApiBlueprint.make({
      name: "mongodbAtlasApi",
      params: (defineParams) =>
        defineParams({
          api: mongoDbAtlasApiRef,
          deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
          factory: ({ discoveryApi, fetchApi }) => new MongoDbAtlasClient({ discoveryApi, fetchApi }),
        }),
    }),
    EntityCardBlueprint.make({
      name: "mongodbAtlasClusterCard",
      params: {
        type: "info",
        loader: async () => {
          const { AtlasClusterCard } = await import("./components/AtlasClusterCard.js");
          return <AtlasClusterCard />;
        },
      },
    }),
  ],
});

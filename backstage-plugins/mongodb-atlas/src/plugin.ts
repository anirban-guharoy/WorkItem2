import {
  createApiFactory,
  createComponentExtension,
  createPlugin,
  discoveryApiRef,
  fetchApiRef,
} from "@backstage/core-plugin-api";
import { mongoDbAtlasApiRef, MongoDbAtlasClient } from "./api.js";

export const mongodbAtlasPlugin = createPlugin({
  id: "mongodb-atlas",
  apis: [
    createApiFactory({
      api: mongoDbAtlasApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: ({ discoveryApi, fetchApi }) => new MongoDbAtlasClient({ discoveryApi, fetchApi }),
    }),
  ],
});

export const EntityAtlasClusterCard = mongodbAtlasPlugin.provide(
  createComponentExtension({
    name: "EntityAtlasClusterCard",
    component: {
      lazy: () => import("./components/AtlasClusterCard.js").then((m) => m.AtlasClusterCard),
    },
  }),
);

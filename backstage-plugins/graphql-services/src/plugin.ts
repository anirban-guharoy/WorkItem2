import { createPlugin, createRoutableExtension } from "@backstage/core-plugin-api";
import { graphqlServicesRouteRef } from "./routes.js";

export const graphqlServicesPlugin = createPlugin({
  id: "graphql-services",
  routes: {
    root: graphqlServicesRouteRef,
  },
});

export const GraphqlServicesPage = graphqlServicesPlugin.provide(
  createRoutableExtension({
    name: "GraphqlServicesPage",
    component: () => import("./components/GraphqlServicesPage.js").then((module) => module.GraphqlServicesPage),
    mountPoint: graphqlServicesRouteRef,
  })
);

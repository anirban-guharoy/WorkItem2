import { createFrontendModule, PageBlueprint } from "@backstage/frontend-plugin-api";

export const graphqlServicesModule = createFrontendModule({
  pluginId: "catalog",
  extensions: [
    PageBlueprint.make({
      params: {
        path: "/graphql-services",
        title: "GraphQL Services",
        loader: async () => {
          const { GraphqlServicesPage } = await import("./components/GraphqlServicesPage.js");
          return <GraphqlServicesPage />;
        },
      },
    }),
  ],
});

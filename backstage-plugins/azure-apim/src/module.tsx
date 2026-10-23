import { createFrontendModule, PageBlueprint } from "@backstage/frontend-plugin-api";

export const azureApimModule = createFrontendModule({
  pluginId: "catalog",
  extensions: [
    PageBlueprint.make({
      params: {
        path: "/azure-apim",
        title: "Azure API Management",
        loader: async () => {
          const { AzureApimPage } = await import("./components/AzureApimPage.js");
          return <AzureApimPage />;
        },
      },
    }),
  ],
});

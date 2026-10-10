import { createPlugin, createRoutableExtension } from "@backstage/core-plugin-api";
import { azureApimRouteRef } from "./routes.js";

export const azureApimPlugin = createPlugin({
  id: "azure-apim",
  routes: {
    root: azureApimRouteRef,
  },
});

export const AzureApimPage = azureApimPlugin.provide(
  createRoutableExtension({
    name: "AzureApimPage",
    component: () => import("./components/AzureApimPage.js").then((module) => module.AzureApimPage),
    mountPoint: azureApimRouteRef,
  })
);

import { createPlugin, createRoutableExtension } from "@backstage/core-plugin-api";
import { javaServicesRouteRef } from "./routes.js";

export const javaServicesPlugin = createPlugin({
  id: "java-services",
  routes: {
    root: javaServicesRouteRef,
  },
});

export const JavaServicesPage = javaServicesPlugin.provide(
  createRoutableExtension({
    name: "JavaServicesPage",
    component: () => import("./components/JavaServicesPage.js").then((module) => module.JavaServicesPage),
    mountPoint: javaServicesRouteRef,
  })
);
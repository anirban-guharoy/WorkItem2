import { createFrontendModule, PageBlueprint } from "@backstage/frontend-plugin-api";

export const javaServicesModule = createFrontendModule({
  pluginId: "catalog",
  extensions: [
    PageBlueprint.make({
      params: {
        path: "/java-services",
        title: "Java Services",
        loader: async () => {
          const { JavaServicesPage } = await import("./components/JavaServicesPage.js");
          return <JavaServicesPage />;
        },
      },
    }),
  ],
});

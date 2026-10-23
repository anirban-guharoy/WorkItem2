# Backstage Service Plugins

This repository contains Backstage frontend plugins for discovering services from the Software Catalog and displaying cloud-service details on catalog entities. The frontend packages use the new Backstage frontend system with `@backstage/frontend-defaults` 0.5.5, `@backstage/frontend-plugin-api` 0.18.0, `createApp()`, and frontend modules created with `createFrontendModule()`.

## Frontend plugins

| Plugin | What it provides | Catalog metadata / backend |
| --- | --- | --- |
| [GraphQL Services](./backstage-plugins/graphql-services/README.md) | Searchable GraphQL service discovery page | Catalog `Component` or `API`, tagged or annotated as GraphQL |
| [Java Services](./backstage-plugins/java-services/README.md) | Searchable Java service discovery page | Catalog `Component`, tagged or annotated as Java |
| [Azure APIM](./backstage-plugins/azure-apim/README.md) | Searchable API Management inventory page | Catalog `API` or `Component` with `azure-apim.io/service`; no dedicated backend |
| [Azure AKS](./backstage-plugins/azure-aks/README.md) | AKS cluster details card on catalog entity overview pages | `azure-aks.io/cluster-id`; uses the `azure-aks` backend |
| [Azure Application Insights](./backstage-plugins/azure-insights/README.md) | Application Insights telemetry card on catalog entity overview pages | `azure-insights.io/resource-id`; uses the `azure-insights` backend |
| [MongoDB Atlas](./backstage-plugins/mongodb-atlas/README.md) | Atlas cluster details card on catalog entity overview pages | `mongodb-atlas.io/cluster` in `<projectId>/<clusterName>` format; uses the `mongodb-atlas` backend |

The GraphQL, Java, and APIM plugins read their metadata from the Catalog API. Their service and API definitions can be kept in a central GitHub repository as catalog entity YAML and ingested by Backstage using catalog locations or Catalog Import. See each plugin's README for the supported metadata fields and examples.

## Frontend app integration

Add the plugin packages to the Backstage app workspace or install them from your package registry. Then include the Catalog plugin and the desired frontend modules when creating the app:

```tsx
import { createApp } from "@backstage/frontend-defaults";
import catalogPlugin from "@backstage/plugin-catalog/alpha";
import azureAksModule from "@internal/plugin-azure-aks";
import azureApimModule from "@internal/plugin-azure-apim";
import azureInsightsModule from "@internal/plugin-azure-insights";
import graphqlServicesModule from "@internal/plugin-graphql-services";
import javaServicesModule from "@internal/plugin-java-services";
import mongodbAtlasModule from "@internal/plugin-mongodb-atlas";

const app = createApp({
  features: [
    catalogPlugin,
    graphqlServicesModule,
    javaServicesModule,
    azureApimModule,
    azureAksModule,
    azureInsightsModule,
    mongodbAtlasModule,
  ],
});

export default app.createRoot();
```

Include only the modules you want to enable. The three entity cards are registered with the Catalog plugin; the GraphQL Services, Java Services, and Azure APIM modules add standalone pages.

## Backend plugins

The following backend packages provide the APIs used by their matching entity cards:

| Backend package | Used by | Description |
| --- | --- | --- |
| [`@internal/plugin-azure-aks-backend`](./backstage-plugins/azure-aks-backend/package.json) | Azure AKS | Reads AKS cluster details |
| [`@internal/plugin-azure-insights-backend`](./backstage-plugins/azure-insights-backend/package.json) | Azure Application Insights | Queries Application Insights telemetry |
| [`@internal/plugin-mongodb-atlas-backend`](./backstage-plugins/mongodb-atlas-backend/package.json) | MongoDB Atlas | Reads Atlas cluster details |

Install and configure the relevant backend package in the Backstage backend. Backend settings and required credentials are defined by each package's configuration schema.

## Build

Build a package from its directory:

```sh
cd backstage-plugins/graphql-services
npm install
npm run build
```

Repeat for the package you want to build. Frontend package builds run TypeScript compilation and copy the page or card stylesheet into `dist`; backend package builds run TypeScript compilation.

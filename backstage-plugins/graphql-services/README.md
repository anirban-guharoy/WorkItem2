# GraphQL Services Backstage Plugin

A Backstage frontend plugin that lists GraphQL services registered in the Software Catalog. It reads YAML through the Catalog API, like `java-services`; it has no backend.

## Service YAML

Register a `Component` (or `API`) entity and mark it as GraphQL with the `graphql-services.io/type: graphql` annotation, a `graphql` metadata tag, or `spec.type: graphql`. Optional annotations:

| Annotation | Displayed value |
| --- | --- |
| `graphql-services.io/server` | Server implementation, e.g. Apollo Server, Yoga |
| `graphql-services.io/endpoint` | GraphQL endpoint URL |
| `graphql-services.io/federation` | Federation setup, e.g. Apollo Federation 2 |
| `graphql-services.io/subgraphs` | Subgraphs behind a gateway |
| `graphql-services.io/playground-url` | Link to GraphiQL / playground |
| `graphql-services.io/schema-url` | Link to the schema |
| `graphql-services.io/repository-url` | Repository link |

Links are rendered only for `http`/`https` URLs. See `examples/orders-graphql/catalog-info.yaml`; add it under `catalog.locations` in `app-config.yaml` or use Catalog Import.

## Install in a new frontend app

This package provides a frontend module that adds a GraphQL Services page to the Catalog plugin. In the host Backstage app, use `@backstage/frontend-defaults` 0.5.5 and include the Catalog plugin and this module in `createApp`:

```tsx
import { createApp } from "@backstage/frontend-defaults";
import catalogPlugin from "@backstage/plugin-catalog/alpha";
import graphqlServicesModule from "@internal/plugin-graphql-services";

const app = createApp({
  features: [catalogPlugin, graphqlServicesModule],
});

export default app.createRoot();
```

The module uses the Catalog API configured by the Catalog plugin. It provides search, refresh, loading, empty and error states, and a responsive layout. `@backstage/frontend-plugin-api` 0.18.0 is used by this package.

## Build

`npm install && npm run build`

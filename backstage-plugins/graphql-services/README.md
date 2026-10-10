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

## Install and route

```tsx
import { GraphqlServicesPage } from "@internal/plugin-graphql-services";

<Route path="/graphql-services" element={<GraphqlServicesPage />} />
```

The host app must configure `catalogApiRef`. The page provides search, refresh, loading, empty and error states, and a responsive layout.

## Build

`npm install && npm run build`

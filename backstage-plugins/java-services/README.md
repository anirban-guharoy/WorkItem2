# Java Services Backstage Plugin

A Backstage frontend plugin that lists Java services registered in the Software Catalog. It reads YAML through the Catalog API rather than reading files from the browser filesystem.

## Service YAML

Register a standard Backstage `Component` entity in the Catalog. Mark Java services with the `java-services.io/language: java` annotation or a `java` metadata tag. The plugin displays these optional annotations when present:

| Annotation | Displayed value |
| --- | --- |
| `java-services.io/java-version` | Java runtime version |
| `java-services.io/framework` | Framework, for example Spring Boot |
| `java-services.io/build-tool` | Build tool, for example Maven or Gradle |
| `java-services.io/artifact` | Group and artifact identifier |
| `java-services.io/repository-url` | Repository link |

An example entity is available at `examples/java-service/catalog-info.yaml`. Add its location to the Backstage Catalog (for example, under `catalog.locations` in `app-config.yaml`) or use the Catalog Import flow. Once ingested, the plugin reads it from the catalog API and applies the current user's catalog permissions.

## Install and route

From a Backstage app workspace, add this package as a workspace package or install it from the configured package registry, then add the route to the app's router:

```tsx
import { JavaServicesPage } from "@internal/plugin-java-services";

<Route path="/java-services" element={<JavaServicesPage />} />
```

The host app must already configure Backstage's `catalogApiRef` implementation, as it does for the Catalog plugin. The page provides search, refresh, loading, empty, and error states and adapts the service table for narrow screens.
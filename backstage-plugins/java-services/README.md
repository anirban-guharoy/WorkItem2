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

## Install in a new frontend app

This package provides a frontend module that adds a Java Services page to the Catalog plugin. In the host Backstage app, use `@backstage/frontend-defaults` 0.5.5 and include the Catalog plugin and this module in `createApp`:

```tsx
import { createApp } from "@backstage/frontend-defaults";
import catalogPlugin from "@backstage/plugin-catalog/alpha";
import javaServicesModule from "@internal/plugin-java-services";

const app = createApp({
  features: [catalogPlugin, javaServicesModule],
});

export default app.createRoot();
```

The module uses the Catalog API configured by the Catalog plugin. It provides search, refresh, loading, empty, and error states and adapts the service table for narrow screens. `@backstage/frontend-plugin-api` 0.18.0 is used by this package.
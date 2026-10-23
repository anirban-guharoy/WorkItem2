# Azure Application Insights Backstage Plugin

Adds Azure Application Insights telemetry to Catalog entity overview pages for entities annotated with `azure-insights.io/resource-id`. The plugin calls the `azure-insights` backend service through Backstage discovery.

## Install in a new frontend app

```tsx
import { createApp } from "@backstage/frontend-defaults";
import catalogPlugin from "@backstage/plugin-catalog/alpha";
import azureInsightsModule from "@internal/plugin-azure-insights";

const app = createApp({
  features: [catalogPlugin, azureInsightsModule],
});

export default app.createRoot();
```

This package uses `@backstage/frontend-plugin-api` 0.18.0 and registers its API and entity card through a frontend module.

## Build

`npm install && npm run build`

# Azure AKS Backstage Plugin

Adds Azure Kubernetes Service cluster details to Catalog entity overview pages using the `azure-aks.io/cluster-id` annotation. The plugin calls the `azure-aks` backend service through Backstage discovery.

## Install in a new frontend app

```tsx
import { createApp } from "@backstage/frontend-defaults";
import catalogPlugin from "@backstage/plugin-catalog/alpha";
import azureAksModule from "@internal/plugin-azure-aks";

const app = createApp({
  features: [catalogPlugin, azureAksModule],
});

export default app.createRoot();
```

This package uses `@backstage/frontend-plugin-api` 0.18.0 and registers its API and entity card through a frontend module.

## Build

`npm install && npm run build`

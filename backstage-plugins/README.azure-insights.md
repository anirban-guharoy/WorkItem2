# Azure Application Insights for Backstage

Two packages:

- `azure-insights-backend` – backend plugin (id `azure-insights`). Queries the workspace-based Application Insights resource through Azure Monitor Logs (`AppRequests`, `AppExceptions`) using `DefaultAzureCredential`. No secrets reach the browser.
- `azure-insights` – frontend plugin providing `EntityAzureInsightsCard` (requests, failures, avg/P95 duration, exceptions, timeline, top failing operations/exceptions).

## Azure setup

The identity running Backstage (managed identity, or `AZURE_CLIENT_ID`/`AZURE_TENANT_ID`/`AZURE_CLIENT_SECRET` locally, or `az login`) needs the **Log Analytics Reader** role (or `Microsoft.Insights/logs/read`) on the Application Insights resource/workspace.

## Backend

```ts
// packages/backend/src/index.ts
backend.add(import("@internal/plugin-azure-insights-backend"));
```

```yaml
# app-config.yaml – allow-list of queryable resources
azureInsights:
  resources:
    - /subscriptions/<sub>/resourceGroups/<rg>/providers/microsoft.insights/components/<name>
```

`GET /api/azure-insights/summary?resourceId=...&range=1h|6h|24h|7d`. Requests for resources not in the allow-list return 403; user input is never interpolated into KQL.

## Frontend (legacy frontend system)

```tsx
// packages/app/src/components/catalog/EntityPage.tsx
import { EntityAzureInsightsCard } from "@internal/plugin-azure-insights";

<Grid item md={12}><EntityAzureInsightsCard /></Grid>
```

Annotate entities (see `azure-insights/examples/catalog-info.yaml`):

```yaml
metadata:
  annotations:
    azure-insights.io/resource-id: /subscriptions/.../providers/microsoft.insights/components/<name>
```

The annotation value must match an entry in `azureInsights.resources`.

## Build

`npm install && npm run build` in each package.

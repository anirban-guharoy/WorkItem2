# Azure AKS Reader for Backstage

Read-only view of Azure Kubernetes Service clusters on catalog entities.

- `azure-aks-backend` – backend plugin (id `azure-aks`). Reads cluster and node pool details from Azure Resource Manager (`@azure/arm-containerservice`) using `DefaultAzureCredential`. It never fetches kubeconfig credentials and never modifies anything.
- `azure-aks` – frontend plugin providing `EntityAksClusterCard` (version, state, power, SKU tier, network plugin, RBAC, FQDN, node pools).

## Azure setup

Grant the identity running Backstage (managed identity, `AZURE_CLIENT_ID`/`AZURE_TENANT_ID`/`AZURE_CLIENT_SECRET`, or `az login` locally) the **Reader** role on each cluster (or its resource group).

## Backend

```ts
// packages/backend/src/index.ts
backend.add(import("@internal/plugin-azure-aks-backend"));
```

```yaml
# app-config.yaml – allow-list of readable clusters
azureAks:
  clusters:
    - /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.ContainerService/managedClusters/<name>
```

`GET /api/azure-aks/cluster?clusterId=<ARM id>` returns 400 for malformed IDs and 403 for clusters not in the allow-list.

## Frontend (legacy frontend system)

```tsx
import { EntityAksClusterCard } from "@internal/plugin-azure-aks";

<Grid item md={12}><EntityAksClusterCard /></Grid>
```

Annotate entities (see `azure-aks/examples/catalog-info.yaml`):

```yaml
metadata:
  annotations:
    azure-aks.io/cluster-id: /subscriptions/.../providers/Microsoft.ContainerService/managedClusters/<name>
```

## Build

`npm install && npm run build` in each package.

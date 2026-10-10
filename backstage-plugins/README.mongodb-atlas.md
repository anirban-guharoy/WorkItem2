# MongoDB Atlas (Azure-hosted) for Backstage

Read-only view of MongoDB Atlas clusters on catalog entities. Atlas clusters hosted on Azure are managed through the Atlas Admin API (not Azure Resource Manager), so this plugin talks to Atlas directly.

- `mongodb-atlas-backend` – backend plugin (id `mongodb-atlas`). Authenticates with an Atlas **service account** (OAuth client credentials, token cached) and reads `GET /api/atlas/v2/groups/{projectId}/clusters/{name}`. Credentials stay on the server; the response omits credentials and connection-string parameters.
- `mongodb-atlas` – frontend plugin providing `EntityAtlasClusterCard` (state, version, type, disk, backups, autoscaling, cloud provider such as `AZURE`, regions/tiers/nodes, SRV host).

## Atlas setup

Create a service account in Atlas (Organization → Access Manager → Applications → Service Accounts) with **Project Read Only** on the target project(s), and add the Backstage host to its IP access list if required.

## Backend

```ts
// packages/backend/src/index.ts
backend.add(import("@internal/plugin-mongodb-atlas-backend"));
```

```yaml
# app-config.yaml
mongodbAtlas:
  clientId: ${MONGODB_ATLAS_CLIENT_ID}
  clientSecret: ${MONGODB_ATLAS_CLIENT_SECRET}
  clusters: # allow-list, "<projectId>/<clusterName>"
    - 5f1c2b3a4d5e6f7a8b9c0d1e/orders-cluster
```

`GET /api/mongodb-atlas/cluster?projectId=…&clusterName=…` returns 400 for malformed input and 403 for clusters outside the allow-list.

## Frontend (legacy frontend system)

```tsx
import { EntityAtlasClusterCard } from "@internal/plugin-mongodb-atlas";

<Grid item md={12}><EntityAtlasClusterCard /></Grid>
```

```yaml
metadata:
  annotations:
    mongodb-atlas.io/cluster: <projectId>/<clusterName>
```

See `mongodb-atlas/examples/catalog-info.yaml`.

## Build

`npm install && npm run build` in each package.

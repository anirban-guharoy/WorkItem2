# MongoDB Atlas Backstage Plugin

Adds MongoDB Atlas cluster details to Catalog entity overview pages using the `mongodb-atlas.io/cluster` annotation in `<projectId>/<clusterName>` format. The plugin calls the `mongodb-atlas` backend service through Backstage discovery.

## Install in a new frontend app

```tsx
import { createApp } from "@backstage/frontend-defaults";
import catalogPlugin from "@backstage/plugin-catalog/alpha";
import mongodbAtlasModule from "@internal/plugin-mongodb-atlas";

const app = createApp({
  features: [catalogPlugin, mongodbAtlasModule],
});

export default app.createRoot();
```

This package uses `@backstage/frontend-plugin-api` 0.18.0 and registers its API and entity card through a frontend module.

## Build

`npm install && npm run build`

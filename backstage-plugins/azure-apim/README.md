# Azure API Management Backstage Plugin

A Backstage frontend plugin that lists APIs published through Azure API Management (APIM). Like `java-services`, it reads catalog YAML through the Catalog API; it has no backend and needs no Azure credentials.

## Catalog YAML

Register a standard `API` (or `Component`) entity and add the `azure-apim.io/service` annotation. Entities without it are ignored.

| Annotation | Meaning |
| --- | --- |
| `azure-apim.io/service` | **Required.** APIM instance name |
| `azure-apim.io/api-id` | API identifier within APIM |
| `azure-apim.io/resource-group` | Azure resource group |
| `azure-apim.io/subscription-id` | Azure subscription ID |
| `azure-apim.io/gateway-url` | Public gateway URL (http/https only) |
| `azure-apim.io/base-path` | API URL suffix |
| `azure-apim.io/product` | APIM product the API belongs to |
| `azure-apim.io/api-version` | API version |
| `azure-apim.io/subscription-required` | `"false"` shows *Open*; otherwise *Subscription key* |

When subscription ID, resource group and service are all present, an **Azure portal** link to the APIM instance's APIs blade is generated.

See `examples/orders-api/catalog-info.yaml`. Add it under `catalog.locations` in `app-config.yaml` or use Catalog Import.

## Install and route

```tsx
import { AzureApimPage } from "@internal/plugin-azure-apim";

<Route path="/azure-apim" element={<AzureApimPage />} />
```

The host app must configure `catalogApiRef`, as the Catalog plugin does. The page provides search, refresh, loading, empty and error states, and a responsive layout.

## Build

`npm install && npm run build`

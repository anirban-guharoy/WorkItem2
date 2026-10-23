import { createApiRef, DiscoveryApi, FetchApi } from "@backstage/frontend-plugin-api";

export interface AksNodePool {
  name: string;
  mode?: string;
  vmSize?: string;
  count?: number;
  osType?: string;
  kubernetesVersion?: string;
  powerState?: string;
  provisioningState?: string;
  autoscaling: boolean;
  minCount?: number;
  maxCount?: number;
}

export interface AksCluster {
  id: string;
  name: string;
  location: string;
  kubernetesVersion?: string;
  provisioningState?: string;
  powerState?: string;
  skuTier?: string;
  fqdn?: string;
  networkPlugin?: string;
  rbacEnabled?: boolean;
  tags: Record<string, string>;
  nodePools: AksNodePool[];
}

export interface AzureAksApi {
  getCluster(clusterId: string): Promise<AksCluster>;
}

export const azureAksApiRef = createApiRef<AzureAksApi>({
  id: "plugin.azure-aks.service",
});

export class AzureAksClient implements AzureAksApi {
  constructor(private readonly deps: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {}

  async getCluster(clusterId: string): Promise<AksCluster> {
    const baseUrl = await this.deps.discoveryApi.getBaseUrl("azure-aks");
    const query = new URLSearchParams({ clusterId });
    const response = await this.deps.fetchApi.fetch(`${baseUrl}/cluster?${query}`);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error ?? `Request failed with status ${response.status}`);
    }
    return (await response.json()) as AksCluster;
  }
}

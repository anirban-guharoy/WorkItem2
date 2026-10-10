import { ContainerServiceClient } from "@azure/arm-containerservice";
import { DefaultAzureCredential, TokenCredential } from "@azure/identity";

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

const ID_PATTERN =
  /^\/subscriptions\/([^/]+)\/resourcegroups\/([^/]+)\/providers\/microsoft\.containerservice\/managedclusters\/([^/]+)$/i;

export function parseClusterId(id: string) {
  const m = ID_PATTERN.exec(id);
  return m ? { subscriptionId: m[1], resourceGroup: m[2], name: m[3] } : undefined;
}

export class AksService {
  private readonly clients = new Map<string, ContainerServiceClient>();

  constructor(
    private readonly allowedClusters: string[],
    private readonly credential: TokenCredential = new DefaultAzureCredential(),
  ) {}

  isAllowed(clusterId: string): boolean {
    const normalized = clusterId.toLowerCase();
    return this.allowedClusters.some((c) => c.toLowerCase() === normalized);
  }

  private client(subscriptionId: string): ContainerServiceClient {
    let client = this.clients.get(subscriptionId);
    if (!client) {
      client = new ContainerServiceClient(this.credential, subscriptionId);
      this.clients.set(subscriptionId, client);
    }
    return client;
  }

  async getCluster(clusterId: string): Promise<AksCluster> {
    const parsed = parseClusterId(clusterId);
    if (!parsed) {
      throw new Error("Invalid AKS cluster resource ID");
    }
    const c = await this.client(parsed.subscriptionId).managedClusters.get(
      parsed.resourceGroup,
      parsed.name,
    );

    return {
      id: c.id ?? clusterId,
      name: c.name ?? parsed.name,
      location: c.location,
      kubernetesVersion: c.currentKubernetesVersion ?? c.kubernetesVersion,
      provisioningState: c.provisioningState,
      powerState: c.powerState?.code,
      skuTier: c.sku?.tier,
      fqdn: c.fqdn,
      networkPlugin: c.networkProfile?.networkPlugin,
      rbacEnabled: c.enableRbac,
      tags: c.tags ?? {},
      nodePools: (c.agentPoolProfiles ?? []).map((p) => ({
        name: p.name,
        mode: p.mode,
        vmSize: p.vmSize,
        count: p.count,
        osType: p.osType,
        kubernetesVersion: p.currentOrchestratorVersion ?? p.orchestratorVersion,
        powerState: p.powerState?.code,
        provisioningState: p.provisioningState,
        autoscaling: Boolean(p.enableAutoScaling),
        minCount: p.minCount,
        maxCount: p.maxCount,
      })),
    };
  }
}

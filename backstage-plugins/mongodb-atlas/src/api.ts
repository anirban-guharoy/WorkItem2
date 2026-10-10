import { createApiRef, DiscoveryApi, FetchApi } from "@backstage/core-plugin-api";

export interface AtlasRegion {
  provider: string;
  region: string;
  priority?: number;
  instanceSize?: string;
  nodeCount?: number;
}

export interface AtlasCluster {
  projectId: string;
  name: string;
  state?: string;
  paused: boolean;
  clusterType?: string;
  mongoDBVersion?: string;
  diskSizeGB?: number;
  backupEnabled?: boolean;
  createdAt?: string;
  providers: string[];
  regions: AtlasRegion[];
  autoScaling: { compute: boolean; disk: boolean };
  srvHost?: string;
}

export interface MongoDbAtlasApi {
  getCluster(projectId: string, clusterName: string): Promise<AtlasCluster>;
}

export const mongoDbAtlasApiRef = createApiRef<MongoDbAtlasApi>({
  id: "plugin.mongodb-atlas.service",
});

export class MongoDbAtlasClient implements MongoDbAtlasApi {
  constructor(private readonly deps: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {}

  async getCluster(projectId: string, clusterName: string): Promise<AtlasCluster> {
    const baseUrl = await this.deps.discoveryApi.getBaseUrl("mongodb-atlas");
    const query = new URLSearchParams({ projectId, clusterName });
    const response = await this.deps.fetchApi.fetch(`${baseUrl}/cluster?${query}`);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error ?? `Request failed with status ${response.status}`);
    }
    return (await response.json()) as AtlasCluster;
  }
}

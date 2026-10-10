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

export interface AtlasOptions {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  allowedClusters: string[];
}

const NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,63}$/;
const PROJECT_PATTERN = /^[a-f0-9]{24}$/i;

export function isValidRef(projectId: string, clusterName: string): boolean {
  return PROJECT_PATTERN.test(projectId) && NAME_PATTERN.test(clusterName);
}

export class AtlasService {
  private token?: { value: string; expiresAt: number };

  constructor(private readonly options: AtlasOptions) {}

  isAllowed(projectId: string, clusterName: string): boolean {
    const ref = `${projectId}/${clusterName}`.toLowerCase();
    return this.options.allowedClusters.some((c) => c.toLowerCase() === ref);
  }

  private async getToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 30_000) {
      return this.token.value;
    }
    const response = await fetch(`${this.options.baseUrl}/api/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(
          `${this.options.clientId}:${this.options.clientSecret}`,
        ).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });
    if (!response.ok) {
      throw new Error(`Atlas token request failed with status ${response.status}`);
    }
    const body = (await response.json()) as { access_token: string; expires_in: number };
    this.token = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
    return body.access_token;
  }

  async getCluster(projectId: string, clusterName: string): Promise<AtlasCluster> {
    if (!isValidRef(projectId, clusterName)) {
      throw new Error("Invalid Atlas project ID or cluster name");
    }
    const response = await fetch(
      `${this.options.baseUrl}/api/atlas/v2/groups/${projectId}/clusters/${encodeURIComponent(clusterName)}`,
      {
        headers: {
          Authorization: `Bearer ${await this.getToken()}`,
          Accept: "application/vnd.atlas.2023-02-01+json",
        },
      },
    );
    if (!response.ok) {
      throw new Error(`Atlas API request failed with status ${response.status}`);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = (await response.json()) as any;

    const regions: AtlasRegion[] = [];
    let compute = false;
    let disk = false;
    for (const spec of c.replicationSpecs ?? []) {
      for (const rc of spec.regionConfigs ?? []) {
        regions.push({
          provider: rc.providerName,
          region: rc.regionName,
          priority: rc.priority,
          instanceSize: rc.electableSpecs?.instanceSize,
          nodeCount: rc.electableSpecs?.nodeCount,
        });
        compute ||= Boolean(rc.autoScaling?.compute?.enabled);
        disk ||= Boolean(rc.autoScaling?.diskGB?.enabled);
      }
    }

    return {
      projectId,
      name: c.name,
      state: c.stateName,
      paused: Boolean(c.paused),
      clusterType: c.clusterType,
      mongoDBVersion: c.mongoDBVersion,
      diskSizeGB: c.diskSizeGB,
      backupEnabled: c.backupEnabled,
      createdAt: c.createDate,
      providers: [...new Set(regions.map((r) => r.provider))],
      regions,
      autoScaling: { compute, disk },
      // Host only; the connection string is not credential-bearing but we omit the scheme/params.
      srvHost: c.connectionStrings?.standardSrv?.replace(/^mongodb\+srv:\/\//, ""),
    };
  }
}

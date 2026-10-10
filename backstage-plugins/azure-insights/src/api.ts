import { createApiRef, DiscoveryApi, FetchApi } from "@backstage/core-plugin-api";

export type Range = "1h" | "6h" | "24h" | "7d";

export interface InsightsSummary {
  resourceId: string;
  range: Range;
  totals: {
    requests: number;
    failedRequests: number;
    failureRate: number;
    avgDurationMs: number;
    p95DurationMs: number;
    exceptions: number;
  };
  timeline: Array<{ timestamp: string; requests: number; failed: number }>;
  topFailingOperations: Array<{ name: string; failed: number; total: number }>;
  topExceptions: Array<{ type: string; count: number }>;
}

export interface AzureInsightsApi {
  getSummary(resourceId: string, range: Range): Promise<InsightsSummary>;
}

export const azureInsightsApiRef = createApiRef<AzureInsightsApi>({
  id: "plugin.azure-insights.service",
});

export class AzureInsightsClient implements AzureInsightsApi {
  constructor(private readonly deps: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {}

  async getSummary(resourceId: string, range: Range): Promise<InsightsSummary> {
    const baseUrl = await this.deps.discoveryApi.getBaseUrl("azure-insights");
    const query = new URLSearchParams({ resourceId, range });
    const response = await this.deps.fetchApi.fetch(`${baseUrl}/summary?${query}`);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error ?? `Request failed with status ${response.status}`);
    }
    return (await response.json()) as InsightsSummary;
  }
}

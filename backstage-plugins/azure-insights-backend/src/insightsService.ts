import { DefaultAzureCredential, TokenCredential } from "@azure/identity";
import { LogsQueryClient, LogsQueryResultStatus, LogsTable } from "@azure/monitor-query-logs";

export const RANGES = {
  "1h": { duration: "PT1H", bin: "5m" },
  "6h": { duration: "PT6H", bin: "30m" },
  "24h": { duration: "PT24H", bin: "1h" },
  "7d": { duration: "P7D", bin: "6h" },
} as const;

export type RangeKey = keyof typeof RANGES;

export interface InsightsSummary {
  resourceId: string;
  range: RangeKey;
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

export class InsightsService {
  private readonly client: LogsQueryClient;

  constructor(
    private readonly allowedResources: string[],
    credential: TokenCredential = new DefaultAzureCredential(),
  ) {
    this.client = new LogsQueryClient(credential);
  }

  isAllowed(resourceId: string): boolean {
    const normalized = resourceId.toLowerCase();
    return this.allowedResources.some((r) => r.toLowerCase() === normalized);
  }

  private async query(resourceId: string, kql: string, duration: string): Promise<LogsTable> {
    const result = await this.client.queryResource(resourceId, kql, { duration });
    if (result.status === LogsQueryResultStatus.Success) {
      return result.tables[0];
    }
    throw new Error(`Azure Monitor query failed: ${result.partialError?.message ?? "partial result"}`);
  }

  async getSummary(resourceId: string, range: RangeKey): Promise<InsightsSummary> {
    const { duration, bin } = RANGES[range];

    // Only constants from RANGES are interpolated; user input never reaches KQL.
    const [totals, timeline, failing, exceptions, exceptionTypes] = await Promise.all([
      this.query(
        resourceId,
        `AppRequests
         | summarize requests=count(), failed=countif(Success == false),
             avgDuration=avg(DurationMs), p95=percentile(DurationMs, 95)`,
        duration,
      ),
      this.query(
        resourceId,
        `AppRequests
         | summarize requests=count(), failed=countif(Success == false) by bin(TimeGenerated, ${bin})
         | order by TimeGenerated asc`,
        duration,
      ),
      this.query(
        resourceId,
        `AppRequests
         | summarize total=count(), failed=countif(Success == false) by Name
         | where failed > 0 | top 5 by failed desc`,
        duration,
      ),
      this.query(resourceId, `AppExceptions | summarize count()`, duration),
      this.query(
        resourceId,
        `AppExceptions | summarize n=count() by ExceptionType | top 5 by n desc`,
        duration,
      ),
    ]);

    const t = totals.rows[0] ?? [0, 0, 0, 0];
    const requests = Number(t[0] ?? 0);
    const failed = Number(t[1] ?? 0);

    return {
      resourceId,
      range,
      totals: {
        requests,
        failedRequests: failed,
        failureRate: requests > 0 ? failed / requests : 0,
        avgDurationMs: Number(t[2] ?? 0) || 0,
        p95DurationMs: Number(t[3] ?? 0) || 0,
        exceptions: Number(exceptions.rows[0]?.[0] ?? 0),
      },
      timeline: timeline.rows.map((r) => ({
        timestamp: new Date(r[0] as Date | string).toISOString(),
        requests: Number(r[1]),
        failed: Number(r[2]),
      })),
      topFailingOperations: failing.rows.map((r) => ({
        name: String(r[0]),
        total: Number(r[1]),
        failed: Number(r[2]),
      })),
      topExceptions: exceptionTypes.rows.map((r) => ({
        type: String(r[0]),
        count: Number(r[1]),
      })),
    };
  }
}

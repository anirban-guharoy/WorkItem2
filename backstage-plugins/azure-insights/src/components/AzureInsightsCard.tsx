import { useEntity } from "@backstage/plugin-catalog-react";
import { useApi } from "@backstage/frontend-plugin-api";
import React, { useEffect, useState } from "react";
import { azureInsightsApiRef, InsightsSummary, Range } from "../api.js";
import "./AzureInsightsCard.css";

export const AZURE_INSIGHTS_RESOURCE_ANNOTATION = "azure-insights.io/resource-id";

const RANGES: Range[] = ["1h", "6h", "24h", "7d"];

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: InsightsSummary };

function Sparkline({ points }: { points: InsightsSummary["timeline"] }) {
  if (points.length < 2) {
    return null;
  }
  const width = 300;
  const height = 48;
  const max = Math.max(...points.map((p) => p.requests), 1);
  const coords = (value: (p: (typeof points)[number]) => number) =>
    points
      .map((p, i) => `${(i / (points.length - 1)) * width},${height - (value(p) / max) * (height - 4) - 2}`)
      .join(" ");
  return (
    <svg className="azi-spark" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Requests over time">
      <polyline className="azi-spark-requests" points={coords((p) => p.requests)} />
      <polyline className="azi-spark-failed" points={coords((p) => p.failed)} />
    </svg>
  );
}

export function AzureInsightsCard() {
  const { entity } = useEntity();
  const api = useApi(azureInsightsApiRef);
  const resourceId = entity.metadata.annotations?.[AZURE_INSIGHTS_RESOURCE_ANNOTATION];
  const [range, setRange] = useState<Range>("24h");
  const [state, setState] = useState<State>({ status: "loading" });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!resourceId) {
      return undefined;
    }
    let cancelled = false;
    setState({ status: "loading" });
    api
      .getSummary(resourceId, range)
      .then((data) => !cancelled && setState({ status: "ready", data }))
      .catch((e: Error) => !cancelled && setState({ status: "error", message: e.message }));
    return () => {
      cancelled = true;
    };
  }, [api, resourceId, range, reload]);

  if (!resourceId) {
    return (
      <section className="azi-card">
        <h2>Azure Application Insights</h2>
        <p>
          Add the <code>{AZURE_INSIGHTS_RESOURCE_ANNOTATION}</code> annotation to this entity to see telemetry.
        </p>
      </section>
    );
  }

  return (
    <section className="azi-card">
      <header className="azi-header">
        <h2>Azure Application Insights</h2>
        <div className="azi-controls">
          <select value={range} onChange={(e) => setRange(e.target.value as Range)} aria-label="Time range">
            {RANGES.map((r) => (
              <option key={r} value={r}>
                Last {r}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => setReload((n) => n + 1)}>
            Refresh
          </button>
        </div>
      </header>

      {state.status === "loading" && <p>Loading…</p>}
      {state.status === "error" && (
        <p className="azi-error" role="alert">
          {state.message}
        </p>
      )}
      {state.status === "ready" && <Summary data={state.data} />}
    </section>
  );
}

function Summary({ data }: { data: InsightsSummary }) {
  const { totals } = data;
  const stats: Array<[string, string]> = [
    ["Requests", totals.requests.toLocaleString()],
    ["Failed", `${totals.failedRequests.toLocaleString()} (${(totals.failureRate * 100).toFixed(2)}%)`],
    ["Avg duration", `${totals.avgDurationMs.toFixed(0)} ms`],
    ["P95 duration", `${totals.p95DurationMs.toFixed(0)} ms`],
    ["Exceptions", totals.exceptions.toLocaleString()],
  ];
  return (
    <>
      <dl className="azi-stats">
        {stats.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <Sparkline points={data.timeline} />
      <div className="azi-lists">
        <div>
          <h3>Top failing operations</h3>
          {data.topFailingOperations.length === 0 ? (
            <p>None</p>
          ) : (
            <ul>
              {data.topFailingOperations.map((o) => (
                <li key={o.name}>
                  {o.name} — {o.failed}/{o.total}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3>Top exceptions</h3>
          {data.topExceptions.length === 0 ? (
            <p>None</p>
          ) : (
            <ul>
              {data.topExceptions.map((x) => (
                <li key={x.type}>
                  {x.type} — {x.count}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

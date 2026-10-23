import { useEntity } from "@backstage/plugin-catalog-react";
import { useApi } from "@backstage/frontend-plugin-api";
import React, { useEffect, useState } from "react";
import { AtlasCluster, mongoDbAtlasApiRef } from "../api.js";
import "./AtlasClusterCard.css";

export const MONGODB_ATLAS_ANNOTATION = "mongodb-atlas.io/cluster";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: AtlasCluster };

// Annotation format: "<projectId>/<clusterName>"
function parseRef(value: string): { projectId: string; clusterName: string } | undefined {
  const [projectId, clusterName, ...rest] = value.split("/");
  return projectId && clusterName && rest.length === 0 ? { projectId, clusterName } : undefined;
}

export function AtlasClusterCard() {
  const { entity } = useEntity();
  const api = useApi(mongoDbAtlasApiRef);
  const annotation = entity.metadata.annotations?.[MONGODB_ATLAS_ANNOTATION];
  const ref = annotation ? parseRef(annotation) : undefined;
  const [state, setState] = useState<State>({ status: "loading" });
  const [reload, setReload] = useState(0);

  const projectId = ref?.projectId;
  const clusterName = ref?.clusterName;

  useEffect(() => {
    if (!projectId || !clusterName) {
      return undefined;
    }
    let cancelled = false;
    setState({ status: "loading" });
    api
      .getCluster(projectId, clusterName)
      .then((data) => !cancelled && setState({ status: "ready", data }))
      .catch((e: Error) => !cancelled && setState({ status: "error", message: e.message }));
    return () => {
      cancelled = true;
    };
  }, [api, projectId, clusterName, reload]);

  if (!ref) {
    return (
      <section className="atlas-card">
        <h2>MongoDB Atlas</h2>
        <p>
          Add the <code>{MONGODB_ATLAS_ANNOTATION}</code> annotation (<code>&lt;projectId&gt;/&lt;clusterName&gt;</code>)
          to this entity to see its Atlas cluster.
        </p>
      </section>
    );
  }

  return (
    <section className="atlas-card">
      <header className="atlas-header">
        <h2>MongoDB Atlas</h2>
        <button type="button" onClick={() => setReload((n) => n + 1)}>
          Refresh
        </button>
      </header>
      {state.status === "loading" && <p>Loading…</p>}
      {state.status === "error" && (
        <p className="atlas-error" role="alert">
          {state.message}
        </p>
      )}
      {state.status === "ready" && <Cluster cluster={state.data} />}
    </section>
  );
}

function Cluster({ cluster }: { cluster: AtlasCluster }) {
  const yesNo = (v: boolean | undefined) => (v === undefined ? "—" : v ? "Enabled" : "Disabled");
  const facts: Array<[string, string]> = [
    ["Cluster", cluster.name],
    ["State", cluster.paused ? "PAUSED" : cluster.state ?? "—"],
    ["Type", cluster.clusterType ?? "—"],
    ["MongoDB", cluster.mongoDBVersion ?? "—"],
    ["Disk", cluster.diskSizeGB === undefined ? "—" : `${cluster.diskSizeGB} GB`],
    ["Backups", yesNo(cluster.backupEnabled)],
    ["Compute autoscale", yesNo(cluster.autoScaling.compute)],
    ["Disk autoscale", yesNo(cluster.autoScaling.disk)],
    ["Cloud provider", cluster.providers.join(", ") || "—"],
  ];
  return (
    <>
      <dl className="atlas-facts">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {cluster.srvHost && <p className="atlas-host">{cluster.srvHost}</p>}
      <h3>Regions</h3>
      <div className="atlas-table-wrap">
        <table className="atlas-table">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Region</th>
              <th>Priority</th>
              <th>Tier</th>
              <th>Nodes</th>
            </tr>
          </thead>
          <tbody>
            {cluster.regions.map((r, i) => (
              <tr key={`${r.region}-${i}`}>
                <td>{r.provider}</td>
                <td>{r.region}</td>
                <td>{r.priority ?? "—"}</td>
                <td>{r.instanceSize ?? "—"}</td>
                <td>{r.nodeCount ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

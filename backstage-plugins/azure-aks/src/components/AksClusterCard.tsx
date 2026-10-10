import { useEntity } from "@backstage/plugin-catalog-react";
import { useApi } from "@backstage/core-plugin-api";
import React, { useEffect, useState } from "react";
import { AksCluster, azureAksApiRef } from "../api.js";
import "./AksClusterCard.css";

export const AZURE_AKS_CLUSTER_ANNOTATION = "azure-aks.io/cluster-id";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: AksCluster };

export function AksClusterCard() {
  const { entity } = useEntity();
  const api = useApi(azureAksApiRef);
  const clusterId = entity.metadata.annotations?.[AZURE_AKS_CLUSTER_ANNOTATION];
  const [state, setState] = useState<State>({ status: "loading" });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!clusterId) {
      return undefined;
    }
    let cancelled = false;
    setState({ status: "loading" });
    api
      .getCluster(clusterId)
      .then((data) => !cancelled && setState({ status: "ready", data }))
      .catch((e: Error) => !cancelled && setState({ status: "error", message: e.message }));
    return () => {
      cancelled = true;
    };
  }, [api, clusterId, reload]);

  if (!clusterId) {
    return (
      <section className="aks-card">
        <h2>Azure Kubernetes Service</h2>
        <p>
          Add the <code>{AZURE_AKS_CLUSTER_ANNOTATION}</code> annotation to this entity to see its AKS cluster.
        </p>
      </section>
    );
  }

  return (
    <section className="aks-card">
      <header className="aks-header">
        <h2>Azure Kubernetes Service</h2>
        <button type="button" onClick={() => setReload((n) => n + 1)}>
          Refresh
        </button>
      </header>
      {state.status === "loading" && <p>Loading…</p>}
      {state.status === "error" && (
        <p className="aks-error" role="alert">
          {state.message}
        </p>
      )}
      {state.status === "ready" && <Cluster cluster={state.data} />}
    </section>
  );
}

function Cluster({ cluster }: { cluster: AksCluster }) {
  const facts: Array<[string, string]> = [
    ["Cluster", cluster.name],
    ["Location", cluster.location],
    ["Kubernetes", cluster.kubernetesVersion ?? "—"],
    ["State", cluster.provisioningState ?? "—"],
    ["Power", cluster.powerState ?? "—"],
    ["SKU tier", cluster.skuTier ?? "—"],
    ["Network plugin", cluster.networkPlugin ?? "—"],
    ["RBAC", cluster.rbacEnabled === undefined ? "—" : cluster.rbacEnabled ? "Enabled" : "Disabled"],
  ];
  return (
    <>
      <dl className="aks-facts">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {cluster.fqdn && <p className="aks-fqdn">{cluster.fqdn}</p>}
      <h3>Node pools</h3>
      <div className="aks-table-wrap">
        <table className="aks-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Mode</th>
              <th>VM size</th>
              <th>Nodes</th>
              <th>OS</th>
              <th>Version</th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            {cluster.nodePools.map((p) => (
              <tr key={p.name}>
                <td>{p.name}</td>
                <td>{p.mode ?? "—"}</td>
                <td>{p.vmSize ?? "—"}</td>
                <td>
                  {p.count ?? "—"}
                  {p.autoscaling ? ` (${p.minCount}–${p.maxCount})` : ""}
                </td>
                <td>{p.osType ?? "—"}</td>
                <td>{p.kubernetesVersion ?? "—"}</td>
                <td>{p.powerState ?? p.provisioningState ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

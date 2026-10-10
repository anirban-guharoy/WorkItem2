import { Entity } from "@backstage/catalog-model";
import { catalogApiRef, EntityRefLink } from "@backstage/plugin-catalog-react";
import { useApi } from "@backstage/core-plugin-api";
import React, { ChangeEvent, useEffect, useMemo, useState } from "react";
import "./AzureApimPage.css";

type ApimEntity = Entity & {
  spec?: {
    owner?: string;
    lifecycle?: string;
    system?: string;
    type?: string;
  };
};

type LoadState = "loading" | "ready" | "error";

export const APIM_ANNOTATIONS = {
  service: "azure-apim.io/service",
  apiId: "azure-apim.io/api-id",
  resourceGroup: "azure-apim.io/resource-group",
  subscriptionId: "azure-apim.io/subscription-id",
  gatewayUrl: "azure-apim.io/gateway-url",
  basePath: "azure-apim.io/base-path",
  product: "azure-apim.io/product",
  apiVersion: "azure-apim.io/api-version",
  subscriptionRequired: "azure-apim.io/subscription-required",
};

const ENTITY_FIELDS = [
  "kind",
  "metadata.name",
  "metadata.namespace",
  "metadata.title",
  "metadata.description",
  "metadata.tags",
  "metadata.annotations",
  "spec.owner",
  "spec.lifecycle",
  "spec.system",
  "spec.type",
];

function isApimEntity(entity: Entity): entity is ApimEntity {
  const kind = entity.kind.toLocaleLowerCase("en-US");
  return (
    (kind === "api" || kind === "component") &&
    Boolean(entity.metadata.annotations?.[APIM_ANNOTATIONS.service])
  );
}

function annotation(entity: ApimEntity, key: string): string | undefined {
  return entity.metadata.annotations?.[key]?.trim() || undefined;
}

function entityTitle(entity: ApimEntity): string {
  return entity.metadata.title || entity.metadata.name;
}

function safeHttpUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function portalUrl(entity: ApimEntity): string | undefined {
  const subscription = annotation(entity, APIM_ANNOTATIONS.subscriptionId);
  const group = annotation(entity, APIM_ANNOTATIONS.resourceGroup);
  const service = annotation(entity, APIM_ANNOTATIONS.service);
  if (!subscription || !group || !service) {
    return undefined;
  }
  const [s, g, n] = [subscription, group, service].map(encodeURIComponent);
  return `https://portal.azure.com/#@/resource/subscriptions/${s}/resourceGroups/${g}/providers/Microsoft.ApiManagement/service/${n}/apis`;
}

function searchableText(entity: ApimEntity): string {
  return [
    entity.metadata.name,
    entityTitle(entity),
    entity.metadata.description,
    entity.spec?.owner,
    entity.spec?.system,
    annotation(entity, APIM_ANNOTATIONS.service),
    annotation(entity, APIM_ANNOTATIONS.apiId),
    annotation(entity, APIM_ANNOTATIONS.product),
    annotation(entity, APIM_ANNOTATIONS.basePath),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("en-US");
}

export function AzureApimPage() {
  const catalogApi = useApi(catalogApiRef);
  const [apis, setApis] = useState<ApimEntity[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [query, setQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadApis() {
      setState("loading");
      setErrorMessage("");

      try {
        const entities: Entity[] = [];
        let cursor: string | undefined;

        do {
          const page = await catalogApi.queryEntities({
            filter: [{ kind: "API" }, { kind: "Component" }],
            fields: ENTITY_FIELDS,
            limit: 100,
            cursor,
          });
          entities.push(...page.items);
          cursor = page.pageInfo.nextCursor;
        } while (cursor);

        if (active) {
          setApis(entities.filter(isApimEntity));
          setState("ready");
        }
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load catalog APIs.");
          setState("error");
        }
      }
    }

    void loadApis();
    return () => {
      active = false;
    };
  }, [catalogApi, reloadKey]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("en-US");
    return normalizedQuery ? apis.filter((api) => searchableText(api).includes(normalizedQuery)) : apis;
  }, [query, apis]);

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value);

  return (
    <main className="azure-apim">
      <header className="azure-apim__header">
        <div>
          <p className="azure-apim__eyebrow">API CATALOG</p>
          <h1>Azure API Management</h1>
          <p className="azure-apim__summary">{apis.length} APIs published through APIM</p>
        </div>
        <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
          Refresh
        </button>
      </header>

      <div className="azure-apim__toolbar">
        <label className="azure-apim__search">
          <span>Find an API</span>
          <input
            type="search"
            value={query}
            onChange={handleQueryChange}
            placeholder="Name, owner, APIM instance, product, path..."
          />
        </label>
        <span className="azure-apim__result-count" aria-live="polite">
          {filtered.length} shown
        </span>
      </div>

      {state === "loading" && <div className="azure-apim__state">Loading catalog APIs...</div>}
      {state === "error" && (
        <div className="azure-apim__state azure-apim__state--error" role="alert">
          <p>Could not load APIM APIs: {errorMessage}</p>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
            Try again
          </button>
        </div>
      )}
      {state === "ready" && apis.length === 0 && (
        <div className="azure-apim__state">
          No catalog entities carry the <code>{APIM_ANNOTATIONS.service}</code> annotation.
        </div>
      )}
      {state === "ready" && apis.length > 0 && filtered.length === 0 && (
        <div className="azure-apim__state">No APIs match “{query}”.</div>
      )}

      {state === "ready" && filtered.length > 0 && (
        <div className="azure-apim__table-wrap">
          <table className="azure-apim__table">
            <thead>
              <tr>
                <th scope="col">API</th>
                <th scope="col">Owner</th>
                <th scope="col">APIM instance</th>
                <th scope="col">Product</th>
                <th scope="col">Version</th>
                <th scope="col">Access</th>
                <th scope="col">Lifecycle</th>
                <th scope="col">Links</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((api) => {
                const gateway = safeHttpUrl(annotation(api, APIM_ANNOTATIONS.gatewayUrl));
                const basePath = annotation(api, APIM_ANNOTATIONS.basePath);
                const portal = portalUrl(api);
                const subscriptionRequired = annotation(api, APIM_ANNOTATIONS.subscriptionRequired);
                const apiId = annotation(api, APIM_ANNOTATIONS.apiId);

                return (
                  <tr key={`${api.kind}:${api.metadata.namespace ?? "default"}/${api.metadata.name}`}>
                    <td data-label="API">
                      <div className="azure-apim__name">
                        <EntityRefLink entityRef={api} />
                        <span>{entityTitle(api)}</span>
                      </div>
                      {api.metadata.description && (
                        <div className="azure-apim__description">{api.metadata.description}</div>
                      )}
                      {(apiId || basePath) && (
                        <div className="azure-apim__mono">
                          {apiId}
                          {apiId && basePath ? " · " : ""}
                          {basePath}
                        </div>
                      )}
                    </td>
                    <td data-label="Owner">{api.spec?.owner ?? "Unassigned"}</td>
                    <td data-label="APIM instance">{annotation(api, APIM_ANNOTATIONS.service)}</td>
                    <td data-label="Product">{annotation(api, APIM_ANNOTATIONS.product) ?? "Not specified"}</td>
                    <td data-label="Version">{annotation(api, APIM_ANNOTATIONS.apiVersion) ?? "Not specified"}</td>
                    <td data-label="Access">
                      {subscriptionRequired === undefined
                        ? "Not specified"
                        : subscriptionRequired.toLocaleLowerCase("en-US") === "false"
                          ? "Open"
                          : "Subscription key"}
                    </td>
                    <td data-label="Lifecycle">
                      <span className="azure-apim__lifecycle">{api.spec?.lifecycle ?? "Unknown"}</span>
                    </td>
                    <td data-label="Links">
                      <div className="azure-apim__links">
                        {gateway && (
                          <a href={gateway} target="_blank" rel="noreferrer">
                            Gateway
                          </a>
                        )}
                        {portal && (
                          <a href={portal} target="_blank" rel="noreferrer">
                            Azure portal
                          </a>
                        )}
                        {!gateway && !portal && "Not specified"}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

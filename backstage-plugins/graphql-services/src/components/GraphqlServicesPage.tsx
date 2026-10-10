import { Entity } from "@backstage/catalog-model";
import { catalogApiRef, EntityRefLink } from "@backstage/plugin-catalog-react";
import { useApi } from "@backstage/core-plugin-api";
import React, { ChangeEvent, useEffect, useMemo, useState } from "react";
import "./GraphqlServicesPage.css";

type GraphqlService = Entity & {
  spec?: {
    owner?: string;
    lifecycle?: string;
    system?: string;
    type?: string;
  };
};

type LoadState = "loading" | "ready" | "error";

export const GRAPHQL_ANNOTATIONS = {
  type: "graphql-services.io/type",
  server: "graphql-services.io/server",
  endpoint: "graphql-services.io/endpoint",
  schemaUrl: "graphql-services.io/schema-url",
  playgroundUrl: "graphql-services.io/playground-url",
  federation: "graphql-services.io/federation",
  subgraphs: "graphql-services.io/subgraphs",
  repositoryUrl: "graphql-services.io/repository-url",
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

function isGraphqlService(entity: Entity): entity is GraphqlService {
  const kind = entity.kind.toLocaleLowerCase("en-US");
  if (kind !== "component" && kind !== "api") {
    return false;
  }

  const annotations = entity.metadata.annotations ?? {};
  const tags = entity.metadata.tags ?? [];
  const spec = entity.spec as { type?: string } | undefined;
  return (
    annotations[GRAPHQL_ANNOTATIONS.type]?.toLocaleLowerCase("en-US") === "graphql" ||
    spec?.type?.toLocaleLowerCase("en-US") === "graphql" ||
    tags.some((tag) => tag.toLocaleLowerCase("en-US") === "graphql")
  );
}

function annotation(service: GraphqlService, key: string): string | undefined {
  return service.metadata.annotations?.[key]?.trim() || undefined;
}

function serviceTitle(service: GraphqlService): string {
  return service.metadata.title || service.metadata.name;
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

function searchableText(service: GraphqlService): string {
  return [
    service.metadata.name,
    serviceTitle(service),
    service.metadata.description,
    service.spec?.owner,
    service.spec?.system,
    annotation(service, GRAPHQL_ANNOTATIONS.server),
    annotation(service, GRAPHQL_ANNOTATIONS.endpoint),
    annotation(service, GRAPHQL_ANNOTATIONS.subgraphs),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("en-US");
}

export function GraphqlServicesPage() {
  const catalogApi = useApi(catalogApiRef);
  const [services, setServices] = useState<GraphqlService[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [query, setQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadServices() {
      setState("loading");
      setErrorMessage("");

      try {
        const entities: Entity[] = [];
        let cursor: string | undefined;

        do {
          const page = await catalogApi.queryEntities({
            filter: [{ kind: "Component" }, { kind: "API" }],
            fields: ENTITY_FIELDS,
            limit: 100,
            cursor,
          });
          entities.push(...page.items);
          cursor = page.pageInfo.nextCursor;
        } while (cursor);

        if (active) {
          setServices(entities.filter(isGraphqlService));
          setState("ready");
        }
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load catalog services.");
          setState("error");
        }
      }
    }

    void loadServices();
    return () => {
      active = false;
    };
  }, [catalogApi, reloadKey]);

  const filteredServices = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("en-US");
    return normalizedQuery
      ? services.filter((service) => searchableText(service).includes(normalizedQuery))
      : services;
  }, [query, services]);

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value);

  return (
    <main className="graphql-services">
      <header className="graphql-services__header">
        <div>
          <p className="graphql-services__eyebrow">SERVICE CATALOG</p>
          <h1>GraphQL services</h1>
          <p className="graphql-services__summary">{services.length} registered services</p>
        </div>
        <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
          Refresh
        </button>
      </header>

      <div className="graphql-services__toolbar">
        <label className="graphql-services__search">
          <span>Find a service</span>
          <input
            type="search"
            value={query}
            onChange={handleQueryChange}
            placeholder="Name, owner, server, endpoint, subgraph..."
          />
        </label>
        <span className="graphql-services__result-count" aria-live="polite">
          {filteredServices.length} shown
        </span>
      </div>

      {state === "loading" && <div className="graphql-services__state">Loading catalog services...</div>}
      {state === "error" && (
        <div className="graphql-services__state graphql-services__state--error" role="alert">
          <p>Could not load GraphQL services: {errorMessage}</p>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
            Try again
          </button>
        </div>
      )}
      {state === "ready" && services.length === 0 && (
        <div className="graphql-services__state">No GraphQL services are registered in the catalog.</div>
      )}
      {state === "ready" && services.length > 0 && filteredServices.length === 0 && (
        <div className="graphql-services__state">No services match “{query}”.</div>
      )}

      {state === "ready" && filteredServices.length > 0 && (
        <div className="graphql-services__table-wrap">
          <table className="graphql-services__table">
            <thead>
              <tr>
                <th scope="col">Service</th>
                <th scope="col">Owner</th>
                <th scope="col">Server</th>
                <th scope="col">Federation</th>
                <th scope="col">Lifecycle</th>
                <th scope="col">Links</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service) => {
                const endpoint = annotation(service, GRAPHQL_ANNOTATIONS.endpoint);
                const federation = annotation(service, GRAPHQL_ANNOTATIONS.federation);
                const subgraphs = annotation(service, GRAPHQL_ANNOTATIONS.subgraphs);
                const links = [
                  ["Playground", safeHttpUrl(annotation(service, GRAPHQL_ANNOTATIONS.playgroundUrl))],
                  ["Schema", safeHttpUrl(annotation(service, GRAPHQL_ANNOTATIONS.schemaUrl))],
                  ["Repo", safeHttpUrl(annotation(service, GRAPHQL_ANNOTATIONS.repositoryUrl))],
                ].filter((link): link is [string, string] => Boolean(link[1]));

                return (
                  <tr key={`${service.kind}:${service.metadata.namespace ?? "default"}/${service.metadata.name}`}>
                    <td data-label="Service">
                      <div className="graphql-services__service-name">
                        <EntityRefLink entityRef={service} />
                        <span>{serviceTitle(service)}</span>
                      </div>
                      {service.metadata.description && (
                        <div className="graphql-services__description">{service.metadata.description}</div>
                      )}
                      {endpoint && <div className="graphql-services__mono">{endpoint}</div>}
                    </td>
                    <td data-label="Owner">{service.spec?.owner ?? "Unassigned"}</td>
                    <td data-label="Server">{annotation(service, GRAPHQL_ANNOTATIONS.server) ?? "Not specified"}</td>
                    <td data-label="Federation">
                      {federation ?? "Not specified"}
                      {subgraphs && <div className="graphql-services__mono">{subgraphs}</div>}
                    </td>
                    <td data-label="Lifecycle">
                      <span className="graphql-services__lifecycle">{service.spec?.lifecycle ?? "Unknown"}</span>
                    </td>
                    <td data-label="Links">
                      {links.length === 0 ? (
                        "Not specified"
                      ) : (
                        <div className="graphql-services__links">
                          {links.map(([label, href]) => (
                            <a key={label} href={href} target="_blank" rel="noreferrer">
                              {label}
                            </a>
                          ))}
                        </div>
                      )}
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

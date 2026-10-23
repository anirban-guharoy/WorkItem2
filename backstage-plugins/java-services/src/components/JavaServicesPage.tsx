import { Entity } from "@backstage/catalog-model";
import { catalogApiRef, EntityRefLink } from "@backstage/plugin-catalog-react";
import { useApi } from "@backstage/frontend-plugin-api";
import React, { ChangeEvent, useEffect, useMemo, useState } from "react";
import "./JavaServicesPage.css";

type JavaService = Entity & {
  kind: "Component";
  spec?: {
    owner?: string;
    lifecycle?: string;
    system?: string;
    type?: string;
  };
};

type LoadState = "loading" | "ready" | "error";

const JAVA_ANNOTATIONS = {
  language: "java-services.io/language",
  javaVersion: "java-services.io/java-version",
  framework: "java-services.io/framework",
  buildTool: "java-services.io/build-tool",
  artifact: "java-services.io/artifact",
  repositoryUrl: "java-services.io/repository-url",
};

const ENTITY_FIELDS = [
  "kind",
  "metadata.name",
  "metadata.namespace",
  "metadata.title",
  "metadata.description",
  "metadata.tags",
  "metadata.annotations",
  "metadata.links",
  "spec.owner",
  "spec.lifecycle",
  "spec.system",
  "spec.type",
];

function isJavaService(entity: Entity): entity is JavaService {
  if (entity.kind.toLocaleLowerCase("en-US") !== "component") {
    return false;
  }

  const annotations = entity.metadata.annotations ?? {};
  const tags = entity.metadata.tags ?? [];
  return (
    annotations[JAVA_ANNOTATIONS.language]?.toLocaleLowerCase("en-US") === "java" ||
    tags.some((tag) => tag.toLocaleLowerCase("en-US") === "java")
  );
}

function annotation(service: JavaService, key: string): string | undefined {
  return service.metadata.annotations?.[key];
}

function serviceTitle(service: JavaService): string {
  return service.metadata.title || service.metadata.name;
}

function searchableText(service: JavaService): string {
  return [
    service.metadata.name,
    serviceTitle(service),
    service.metadata.description,
    service.spec?.owner,
    service.spec?.system,
    annotation(service, JAVA_ANNOTATIONS.framework),
    annotation(service, JAVA_ANNOTATIONS.buildTool),
    annotation(service, JAVA_ANNOTATIONS.artifact),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("en-US");
}

export function JavaServicesPage() {
  const catalogApi = useApi(catalogApiRef);
  const [services, setServices] = useState<JavaService[]>([]);
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
            filter: { kind: "Component" },
            fields: ENTITY_FIELDS,
            limit: 100,
            cursor,
          });
          entities.push(...page.items);
          cursor = page.pageInfo.nextCursor;
        } while (cursor);

        if (active) {
          setServices(entities.filter(isJavaService));
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
    <main className="java-services">
      <header className="java-services__header">
        <div>
          <p className="java-services__eyebrow">SERVICE CATALOG</p>
          <h1>Java services</h1>
          <p className="java-services__summary">{services.length} registered services</p>
        </div>
        <button className="java-services__refresh" type="button" onClick={() => setReloadKey((key) => key + 1)}>
          Refresh
        </button>
      </header>

      <div className="java-services__toolbar">
        <label className="java-services__search">
          <span>Find a service</span>
          <input
            type="search"
            value={query}
            onChange={handleQueryChange}
            placeholder="Name, owner, framework, artifact..."
          />
        </label>
        <span className="java-services__result-count" aria-live="polite">
          {filteredServices.length} shown
        </span>
      </div>

      {state === "loading" && <div className="java-services__state">Loading catalog services...</div>}
      {state === "error" && (
        <div className="java-services__state java-services__state--error" role="alert">
          <p>Could not load Java services: {errorMessage}</p>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
            Try again
          </button>
        </div>
      )}
      {state === "ready" && services.length === 0 && (
        <div className="java-services__state">No Java services are registered in the catalog.</div>
      )}
      {state === "ready" && services.length > 0 && filteredServices.length === 0 && (
        <div className="java-services__state">No services match “{query}”.</div>
      )}

      {state === "ready" && filteredServices.length > 0 && (
        <div className="java-services__table-wrap">
          <table className="java-services__table">
            <thead>
              <tr>
                <th scope="col">Service</th>
                <th scope="col">Owner</th>
                <th scope="col">Java</th>
                <th scope="col">Framework</th>
                <th scope="col">Build</th>
                <th scope="col">Lifecycle</th>
                <th scope="col">Repository</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service) => {
                const repositoryUrl = annotation(service, JAVA_ANNOTATIONS.repositoryUrl);
                const javaVersion = annotation(service, JAVA_ANNOTATIONS.javaVersion);
                const framework = annotation(service, JAVA_ANNOTATIONS.framework);
                const buildTool = annotation(service, JAVA_ANNOTATIONS.buildTool);
                const artifact = annotation(service, JAVA_ANNOTATIONS.artifact);

                return (
                  <tr key={`${service.metadata.namespace ?? "default"}/${service.metadata.name}`}>
                    <td data-label="Service">
                      <div className="java-services__service-name">
                        <EntityRefLink entityRef={service} />
                        <span>{serviceTitle(service)}</span>
                      </div>
                      {service.metadata.description && (
                        <div className="java-services__description">{service.metadata.description}</div>
                      )}
                      {artifact && <div className="java-services__artifact">{artifact}</div>}
                    </td>
                    <td data-label="Owner">{service.spec?.owner ?? "Unassigned"}</td>
                    <td data-label="Java">{javaVersion ? `Java ${javaVersion}` : "Not specified"}</td>
                    <td data-label="Framework">{framework ?? "Not specified"}</td>
                    <td data-label="Build">{buildTool ?? "Not specified"}</td>
                    <td data-label="Lifecycle">
                      <span className="java-services__lifecycle">{service.spec?.lifecycle ?? "Unknown"}</span>
                    </td>
                    <td data-label="Repository">
                      {repositoryUrl ? (
                        <a href={repositoryUrl} target="_blank" rel="noreferrer">
                          Open repo
                        </a>
                      ) : (
                        "Not specified"
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
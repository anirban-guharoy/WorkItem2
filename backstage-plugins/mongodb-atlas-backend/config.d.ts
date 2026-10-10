export interface Config {
  mongodbAtlas?: {
    /** Atlas Admin API base URL. Defaults to https://cloud.mongodb.com */
    baseUrl?: string;
    /** Atlas service account client ID (Project Read Only role is enough). */
    clientId: string;
    /**
     * Atlas service account client secret.
     * @visibility secret
     */
    clientSecret: string;
    /** Allow-list of clusters the backend may read, as "<projectId>/<clusterName>". */
    clusters: string[];
  };
}

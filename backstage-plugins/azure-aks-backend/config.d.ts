export interface Config {
  azureAks?: {
    /**
     * Allow-list of AKS cluster ARM resource IDs the backend may read, e.g.
     * /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.ContainerService/managedClusters/<name>
     */
    clusters: string[];
  };
}

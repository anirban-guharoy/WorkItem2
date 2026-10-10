export interface Config {
  azureInsights?: {
    /**
     * Allow-list of Application Insights (workspace-based) resource IDs that
     * the backend may query, e.g.
     * /subscriptions/<sub>/resourceGroups/<rg>/providers/microsoft.insights/components/<name>
     */
    resources: string[];
  };
}

export interface DeploymentDiagnostics {
  deploymentId: string;
  projectName: string;
  environment: string;
  state: string;
  deploymentUrl: string;
  commitSha?: string;
  logs: string[];
}

export interface DiagnosisCustomization {
  focusAreas: string[];
  logWindow: number;
  includeRecommendations: boolean;
}

export interface DiagnosisResult {
  rootCause: string;
  evidence: string[];
  fixSuggestions: string[];
  confidence: "high" | "medium" | "low";
}

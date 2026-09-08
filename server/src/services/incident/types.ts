export type IncidentSeverityType = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatusType = 
  | 'OPEN'
  | 'INVESTIGATING'
  | 'AI_ANALYZING'
  | 'REMEDIATION_PENDING'
  | 'AWAITING_APPROVAL'
  | 'REMEDIATING'
  | 'VERIFYING'
  | 'RESOLVED'
  | 'REMEDIATION_FAILED'
  | 'ESCALATED';

export type IncidentCategoryType = 
  | 'DATABASE'
  | 'NETWORK'
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'APPLICATION'
  | 'DEPENDENCY'
  | 'RATE_LIMIT'
  | 'INFRASTRUCTURE'
  | 'PERFORMANCE'
  | 'SECURITY'
  | 'UNKNOWN';

export type RemediationStatusType =
  | 'PENDING'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'FAILED';

export interface TelemetryDataPoint {
  endpointId?: string;
  projectId: string;
  endpointPath: string;
  method: string;
  duration: number;
  status: number;
  isError: boolean;
  isTimeout: boolean;
  responseSizeBytes?: number;
  timestamp?: Date;
}

export interface MetricSnapshot {
  currentLatencyMs: number;
  baselineLatencyMs: number;
  latencyDeviationPct: number;
  currentErrorRatePct: number;
  baselineErrorRatePct: number;
  fiveXxCount: number;
  fourXxCount: number;
  timeoutCount: number;
  totalRequests: number;
  sampleWindowSeconds: number;
}

export interface AnomalyResult {
  hasAnomaly: boolean;
  severity: IncidentSeverityType;
  primaryReason: string;
  reasons: string[];
  metrics: MetricSnapshot;
}

export interface AIAnalysisResult {
  rootCause: string;
  confidence: number;
  severity: IncidentSeverityType;
  category: IncidentCategoryType;
  evidence: string[];
  reasoning: string;
  recommendedActions: RecommendedRemediationAction[];
  model: string;
  provider: string;
  durationMs: number;
}

export interface RecommendedRemediationAction {
  actionType: string;
  title: string;
  description: string;
  reason: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  requiresApproval: boolean;
  parameters?: Record<string, any>;
}

export interface VerificationResult {
  success: boolean;
  stabilized: boolean;
  beforeMetrics: {
    latency: number;
    errorRate: number;
  };
  afterMetrics: {
    latency: number;
    errorRate: number;
  };
  message: string;
  timestamp: Date;
}

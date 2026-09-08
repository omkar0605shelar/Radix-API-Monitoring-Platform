export interface RemediationActionDefinition {
  type: string;
  name: string;
  description: string;
  defaultRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  requiresApprovalByDefault: boolean;
  supportedProviders: string[];
}

export class RemediationRegistry {
  private static readonly ALLOWLIST: Record<string, RemediationActionDefinition> = {
    clear_cache: {
      type: 'clear_cache',
      name: 'Purge Redis / In-Memory Cache',
      description: 'Invalidates cached query results and stale response keys to relieve memory pressure and clear corrupted payloads.',
      defaultRisk: 'LOW',
      requiresApprovalByDefault: false,
      supportedProviders: ['simulation', 'redis']
    },
    increase_connection_pool: {
      type: 'increase_connection_pool',
      name: 'Increase Database Connection Pool',
      description: 'Dynamically elevates database connection pool max connections to accommodate high concurrency.',
      defaultRisk: 'MEDIUM',
      requiresApprovalByDefault: true,
      supportedProviders: ['simulation', 'postgres']
    },
    restart_service: {
      type: 'restart_service',
      name: 'Restart Application Process/Pod',
      description: 'Gracefully cycles the application worker to reset socket connections and flush memory leaks.',
      defaultRisk: 'HIGH',
      requiresApprovalByDefault: true,
      supportedProviders: ['simulation', 'docker']
    },
    rate_limit_throttle: {
      type: 'rate_limit_throttle',
      name: 'Dynamically Tighten Endpoint Rate Limits',
      description: 'Increases rate limit restrictions by 50% for 15 minutes to fend off traffic surges and upstream spam.',
      defaultRisk: 'LOW',
      requiresApprovalByDefault: false,
      supportedProviders: ['simulation', 'redis']
    },
    circuit_breaker_trip: {
      type: 'circuit_breaker_trip',
      name: 'Trip Downstream Dependency Circuit Breaker',
      description: 'Temporarily stops downstream calls to a failing third-party service, returning graceful fallback responses.',
      defaultRisk: 'MEDIUM',
      requiresApprovalByDefault: true,
      supportedProviders: ['simulation']
    },
    scale_service: {
      type: 'scale_service',
      name: 'Scale Container Replicas',
      description: 'Requests horizontal pod / container replica expansion to distribute high query volume.',
      defaultRisk: 'MEDIUM',
      requiresApprovalByDefault: true,
      supportedProviders: ['simulation', 'docker']
    }
  };

  /**
   * Validates if the action is in the strict enterprise allowlist
   */
  static isAllowed(actionType: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.ALLOWLIST, actionType);
  }

  /**
   * Retrieves definition for an allowlisted action
   */
  static getDefinition(actionType: string): RemediationActionDefinition | undefined {
    return this.ALLOWLIST[actionType];
  }

  /**
   * Lists all available allowlisted actions
   */
  static getAllowedActions(): RemediationActionDefinition[] {
    return Object.values(this.ALLOWLIST);
  }
}

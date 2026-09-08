import { RemediationRegistry } from './remediationRegistry.js';

export class RiskAssessmentEngine {
  /**
   * Deterministically evaluates the blast radius and operational risk of a remediation action
   */
  static evaluateRisk(
    actionType: string, 
    customParameters?: Record<string, any>
  ): {
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
    requiresApproval: boolean;
    rationale: string;
  } {
    const definition = RemediationRegistry.getDefinition(actionType);

    if (!definition) {
      // Unknown actions default to highest risk and strict approval requirement
      return {
        risk: 'HIGH',
        requiresApproval: true,
        rationale: 'Unrecognized action type requires explicit administrative review.'
      };
    }

    let risk = definition.defaultRisk;
    let requiresApproval = definition.requiresApprovalByDefault;
    let rationale = '';

    switch (actionType) {
      case 'clear_cache':
        rationale = 'Low blast radius: Cache flush temporarily increases cache miss rate but causes zero downtime.';
        break;
      case 'rate_limit_throttle':
        rationale = 'Low blast radius: Safely throttles excessive bursts to safeguard underlying database.';
        break;
      case 'increase_connection_pool':
        rationale = 'Medium blast radius: Increasing connection pool consumes additional database memory and server sockets.';
        break;
      case 'circuit_breaker_trip':
        rationale = 'Medium blast radius: Prevents cascade failure but degrades non-critical downstream features.';
        break;
      case 'restart_service':
        rationale = 'High blast radius: Cycling the process causes momentary connection drop or pod re-registration.';
        break;
      case 'scale_service':
        rationale = 'Medium blast radius: Launches additional instances which incurs cloud infrastructure compute overhead.';
        break;
      default:
        rationale = 'Action requires authorization by engineering lead.';
    }

    return {
      risk,
      requiresApproval,
      rationale
    };
  }
}

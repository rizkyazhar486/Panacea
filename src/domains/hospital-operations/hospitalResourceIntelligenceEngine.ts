/**
 * PanaceaMed Hospital Resource & ICU Capacity Predictive Intelligence Engine (Directive 032)
 * Optimizes hospital bed occupancy, emergency department surge forecasting, 
 * and resource allocation while preserving all existing repository architectures.
 */

export interface HospitalWardStatus {
  hospitalId: string;
  totalIcuBeds: number;
  occupiedIcuBeds: number;
  incomingEmergencyTransfers: number;
  staffedNurseRatio: number; // Nurses per patient
}

export interface OperationalIntelligenceReport {
  reportId: string;
  hospitalId: string;
  icuOccupancyRatePercent: number;
  operationalStatusColor: 'GREEN_STABLE' | 'YELLOW_CAUTION' | 'RED_SURGE_CRITICAL';
  resourceActionPlan: string;
  fhirEncounterResource: {
    resourceType: 'Encounter';
    id: string;
    status: string;
  };
  isClinicallyAuthoritative: false; // Invariant: AI provides operational forecasts, human director decides
}

export function evaluateHospitalResourceCapacity(status: HospitalWardStatus): OperationalIntelligenceReport {
  const occupancyRate = Number(((status.occupiedIcuBeds / Math.max(1, status.totalIcuBeds)) * 100).toFixed(1));
  
  let color: OperationalIntelligenceReport['operationalStatusColor'] = 'GREEN_STABLE';
  let actionPlan = 'Hospital ward capacity within normal operating limits. Routine staffing active.';

  if (occupancyRate >= 90 || (status.occupiedIcuBeds + status.incomingEmergencyTransfers) > status.totalIcuBeds) {
    color = 'RED_SURGE_CRITICAL';
    actionPlan = 'CRITICAL SURGE: ICU occupancy exceeds 90% or incoming transfers exceed capacity. Activate overflow protocol, defer elective admissions, and call standby intensivists.';
  } else if (occupancyRate >= 75) {
    color = 'YELLOW_CAUTION';
    actionPlan = 'CAUTION: Elevated bed occupancy. Prepare discharge pipelines and review step-down unit readiness.';
  }

  return {
    reportId: `HOSP-OPS-${Date.now()}`,
    hospitalId: status.hospitalId,
    icuOccupancyRatePercent: occupancyRate,
    operationalStatusColor: color,
    resourceActionPlan: actionPlan,
    fhirEncounterResource: {
      resourceType: 'Encounter',
      id: `ENC-${Math.floor(Math.random() * 10000)}`,
      status: color === 'RED_SURGE_CRITICAL' ? 'in-progress' : 'completed'
    },
    isClinicallyAuthoritative: false
  };
}

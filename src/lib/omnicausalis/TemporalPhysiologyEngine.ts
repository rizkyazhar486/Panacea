import { SimulationScenarioState } from './OmnicausalContracts';

export function runTemporalSimulation(oxygenSupplyPercent: number, timeSteps: number = 12): SimulationScenarioState[] {
  const clampedO2 = Math.max(5, Math.min(100, oxygenSupplyPercent));
  const results: SimulationScenarioState[] = [];
  let atp = 100, ros = 10, cytokines = 5, perfusion = 100, failureRisk = 1.2;

  for (let t = 0; t <= timeSteps; t++) {
    const hypoxiaFactor = Math.max(0, 100 - clampedO2) / 100;
    atp += (Math.max(5, 100 - (hypoxiaFactor * 90)) - atp) * 0.35;
    ros += ((10 + (hypoxiaFactor * hypoxiaFactor * 350)) - ros) * 0.25;
    cytokines += ((5 + (hypoxiaFactor * 220)) - cytokines) * 0.20;
    perfusion += (Math.max(10, 100 - (hypoxiaFactor * 75)) - perfusion) * 0.30;
    failureRisk += ((Math.min(99.9, hypoxiaFactor * hypoxiaFactor * 95)) - failureRisk) * 0.25;

    results.push({
      scenarioId: `step-${t}`,
      name: `T + ${t * 15} min (O2: ${clampedO2}%)`,
      oxygenSupplyPercent: clampedO2,
      atpProductionRate: Number(atp.toFixed(2)),
      rosProductionRate: Number(ros.toFixed(2)),
      inflammatoryCytokines: Number(cytokines.toFixed(2)),
      tissuePerfusionIndex: Number(perfusion.toFixed(2)),
      organFailureRiskScore: Number(failureRisk.toFixed(2)),
      modelAssumptions: ['Mitochondrial complex IV inhibition proportional to local oxygen tension.'],
      knownLimitations: ['Pending full clinical validation trial datasets.']
    });
  }
  return results;
}

export const AHA17_SEGMENT_COUNT = 17 as const;
export const ATLAS_REFERENCE_LABEL = "ATLAS_REFERENCE (AHA 17-Segment / Z-Anatomy CC-BY-SA 4.0)" as const;
export const AHA17_CORONARY_TERRITORY_SOURCE = "Cerqueira MD et al., Circulation 2002;105:539-542 (AHA 17-Segment Standard)" as const;
export const AHA17_LIMITATIONS = "Population reference coronary distribution; right vs left dominance varies across individuals." as const;
export const AHA17_TERRITORY_LIMITATIONS = AHA17_LIMITATIONS;
export const AHA17_SOURCES = [AHA17_CORONARY_TERRITORY_SOURCE] as const;
export const DOMINANCE_PREVALENCE = { rightDominant: 0.85, leftDominant: 0.08, codominant: 0.07 } as const;
export const AHA17_RINGS = ["BASAL_1_6", "MID_CAVITY_7_12", "APICAL_13_16", "APEX_CAP_17"] as const;
export const AHA17_SEGMENT_NAMES: Readonly<Record<number, string>> = {
  1: "Basal Anterior", 2: "Basal Anteroseptal", 3: "Basal Inferoseptal",
  4: "Basal Inferior", 5: "Basal Inferolateral", 6: "Basal Anterolateral",
  7: "Mid Anterior", 8: "Mid Anteroseptal", 9: "Mid Inferoseptal",
  10: "Mid Inferior", 11: "Mid Inferolateral", 12: "Mid Anterolateral",
  13: "Apical Anterior", 14: "Apical Septal", 15: "Apical Inferior",
  16: "Apical Lateral", 17: "Apex"
};
export const AHA17_CORONARY_TERRITORY_TABLE = {
  LAD: [1, 2, 7, 8, 13, 14, 17] as const,
  RCA: [3, 4, 9, 10, 15] as const,
  LCX: [5, 6, 11, 12, 16] as const
};
export function branchForSegment(segmentNumber: number): "LAD" | "RCA" | "LCX" {
  if (AHA17_CORONARY_TERRITORY_TABLE.LAD.includes(segmentNumber as never)) return "LAD";
  if (AHA17_CORONARY_TERRITORY_TABLE.RCA.includes(segmentNumber as never)) return "RCA";
  if (AHA17_CORONARY_TERRITORY_TABLE.LCX.includes(segmentNumber as never)) return "LCX";
  throw new RangeError("AHA segment must be an integer in 1..17.");
}
export function territoryForArtery(artery: "LAD" | "RCA" | "LCX"): readonly number[] {
  return AHA17_CORONARY_TERRITORY_TABLE[artery];
}
export const mapCoronaryToAHA17 = territoryForArtery;
export function evaluateAHA17PerfusionBurden(occludedArtery: "LAD" | "RCA" | "LCX") {
  const affectedSegments = territoryForArtery(occludedArtery);
  return {
    occludedArtery,
    affectedSegments,
    ischemicMyocardiumFractionPct: Number(((affectedSegments.length / 17) * 100).toFixed(1)),
    source: AHA17_CORONARY_TERRITORY_SOURCE,
    limitations: AHA17_LIMITATIONS,
    truthClass: "ATLAS_REFERENCE" as const
  };
}
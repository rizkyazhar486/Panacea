import crypto from "node:crypto";

export type EducationDepthMode = "PUBLIC_EVERYDAY" | "SCHOOL" | "MEDICAL_STUDENT" | "MEDICAL_PROFESSIONAL" | "SPECIALIST" | "PROFESSOR_RESEARCH";

export interface CanonicalDiseaseConceptProjection {
  readonly conceptId: string;
  readonly icd11Code: string;
  readonly snomedCtId: string;
  readonly uberonOrganId: string;
  readonly fmaStructureId: string;
  readonly depthMode: EducationDepthMode;
  readonly headlineSummary: string;
  readonly mechanisticExplanation: string;
  readonly quantitativeModelFormula: string;
  readonly osceStationChecklist: readonly string[];
  readonly generatedSvgMediaAsset: {
    readonly assetId: string;
    readonly mimeType: "image/svg+xml";
    readonly sha256Hash: string;
    readonly license: "CC-BY-4.0";
    readonly svgMarkup: string;
  };
}

export function projectDiseaseConceptByDepthMode(
  conceptId: "ACS_LAD_ISCHEMIA" | "PRERENAL_AKI_TGF" | "HYPOXEMIC_ARDS_VQ",
  depthMode: EducationDepthMode
): CanonicalDiseaseConceptProjection {
  const explanations: Record<EducationDepthMode, string> = {
    PUBLIC_EVERYDAY: "Penyempitan pembuluh darah jantung mengurangi suplai oksigen ke otot jantung saat beraktivitas.",
    SCHOOL: "Sumbatan plak aterosklerosis pada arteri koroner menghambat aliran darah kaya oksigen menuju miokardium ventrikel kiri.",
    MEDICAL_STUDENT: "Stenosis proksimal LAD menurunkan perfusi subendokardial saat diastol, memicu glikolisis anaerobik, akumulasi laktat, dan deviasi segmen ST.",
    MEDICAL_PROFESSIONAL: "Oklusi akut LAD ( Segmen AHA 1,2,7,8,13,14,17 ) menurunkan cadangan aliran koroner (CFR < 2.0), memerlukan reperfusi segera dan pemantauan hemodinamik.",
    SPECIALIST: "Penurunan tekanan perfusi koroner distal di bawah batas autoregulasi mikrovaskular menyebabkan disfungsi relaksasi lusitropik awal diikuti kegagalan sistolik regional.",
    PROFESSOR_RESEARCH: "Kegagalan fosforilasi oksidatif mitokondria menurunkan [ATP]/[ADP][Pi], mengaktifkan kanal K_ATP sarkolema, memperpendek durasi potensial aksi, dan mengganggu kopling Ca2+ CICR RyR2."
  };

  const svgMarkup = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 120\"><rect width=\"320\" height=\"120\" rx=\"12\" fill=\"#020617\"/><path d=\"M20 60 L90 60 L105 35 L120 95 L138 20 L155 75 L175 42 L205 42 L230 60 L300 60\" stroke=\"#38bdf8\" stroke-width=\"3\" fill=\"none\"/><text x=\"20\" y=\"24\" fill=\"#94a3b8\" font-size=\"11\">" + conceptId + " · " + depthMode + "</text></svg>";
  const sha256Hash = crypto.createHash("sha256").update(svgMarkup).digest("hex");

  return {
    conceptId,
    icd11Code: conceptId === "ACS_LAD_ISCHEMIA" ? "BA41" : conceptId === "PRERENAL_AKI_TGF" ? "GB60" : "CB00",
    snomedCtId: conceptId === "ACS_LAD_ISCHEMIA" ? "57054005" : conceptId === "PRERENAL_AKI_TGF" ? "14669001" : "67782005",
    uberonOrganId: conceptId === "ACS_LAD_ISCHEMIA" ? "UBERON:0000948" : conceptId === "PRERENAL_AKI_TGF" ? "UBERON:0002113" : "UBERON:0002048",
    fmaStructureId: conceptId === "ACS_LAD_ISCHEMIA" ? "FMA:3862" : conceptId === "PRERENAL_AKI_TGF" ? "FMA:7203" : "FMA:7195",
    depthMode,
    headlineSummary: conceptId + " (" + depthMode + " Projection)",
    mechanisticExplanation: explanations[depthMode],
    quantitativeModelFormula: conceptId === "ACS_LAD_ISCHEMIA" ? "Q = (pi * dP * r^4) / (8 * mu * L)" : "GFR = Kf * [(P_GC - P_BS) - pi_GC]",
    osceStationChecklist: [
      "1. Verify patient identity and hemodynamic stability (ABCDE)",
      "2. Perform targeted cardiopulmonary / renal physical examination",
      "3. Interpret 12-lead ECG / ABG / serum lactate and creatinine",
      "4. Formulate evidence-backed differential diagnosis and initial stabilization plan"
    ],
    generatedSvgMediaAsset: {
      assetId: "MEDSCI_SVG_" + conceptId + "_" + depthMode,
      mimeType: "image/svg+xml",
      sha256Hash,
      license: "CC-BY-4.0",
      svgMarkup
    }
  };
}
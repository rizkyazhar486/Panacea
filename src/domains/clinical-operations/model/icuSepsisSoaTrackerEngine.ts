/** T-CLIN-139: ICU Sepsis Sequential Organ Failure Assessment (SOFA) & QSOFA Tracker */
export interface SofaAssessment {
  respirationScore: number; // 0-4
  coagulationScore: number; // 0-4
  liverScore: number; // 0-4
  cardiovascularScore: number; // 0-4
  cnsScore: number; // 0-4
  renalScore: number; // 0-4
  totalSofaScore: number;
  qSofaPositive: boolean;
}
export function calculateSofaScore(pao2Fio2: number, plateletsKUl: number, bilirubinMgDl: number, mapMmHg: number, gcsScore: number, creatinineMgDl: number, sysBp: number, respRate: number): SofaAssessment {
  let respirationScore = pao2Fio2 < 100 ? 4 : pao2Fio2 < 200 ? 3 : pao2Fio2 < 300 ? 2 : pao2Fio2 < 400 ? 1 : 0;
  let coagulationScore = plateletsKUl < 20 ? 4 : plateletsKUl < 50 ? 3 : plateletsKUl < 100 ? 2 : plateletsKUl < 150 ? 1 : 0;
  let liverScore = bilirubinMgDl > 12.0 ? 4 : bilirubinMgDl > 6.0 ? 3 : bilirubinMgDl > 2.0 ? 2 : bilirubinMgDl > 1.2 ? 1 : 0;
  let cardiovascularScore = mapMmHg < 70 ? 1 : 0; // simplified
  let cnsScore = gcsScore < 6 ? 4 : gcsScore < 10 ? 3 : gcsScore < 13 ? 2 : gcsScore < 15 ? 1 : 0;
  let renalScore = creatinineMgDl > 5.0 ? 4 : creatinineMgDl > 3.5 ? 3 : creatinineMgDl > 2.0 ? 2 : creatinineMgDl > 1.2 ? 1 : 0;
  let totalSofaScore = respirationScore + coagulationScore + liverScore + cardiovascularScore + cnsScore + renalScore;
  let qSofaPositive = (sysBp <= 100 ? 1 : 0) + (respRate >= 22 ? 1 : 0) + (gcsScore < 15 ? 1 : 0) >= 2;
  return { respirationScore, coagulationScore, liverScore, cardiovascularScore, cnsScore, renalScore, totalSofaScore, qSofaPositive };
}

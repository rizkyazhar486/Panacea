#!/usr/bin/env node
/**
 * @file scripts/panacea-cli.mjs
 * @description CLI Fungsional Harian PanaceaMed OS untuk Awam, Koas, dan Dokter
 * Contoh:
 *   node scripts/panacea-cli.mjs status
 *   node scripts/panacea-cli.mjs awam
 *   node scripts/panacea-cli.mjs dokter
 */

import {
  evaluateWave201To210LaypersonEverydayHealthHelper,
  evaluateWave211To220FamilyGrowthAndWorkdayErgonomics,
  evaluateWave221To230ClinicianWorkAutomator,
  runHolisticAutoExpansionAndSmoothOsGovernor,
  bridgeShenzhenWhoopToQWatchProAndInterpretAi,
  orchestrateAllConnectedBluetoothWearables
} from '../src/core/index.mjs';

const mode = (process.argv[2] || 'status').toLowerCase();

if (mode === 'bluetooth' || mode === 'whoop' || mode === 'qwatch') {
  const bridge = bridgeShenzhenWhoopToQWatchProAndInterpretAi();
  const mesh = orchestrateAllConnectedBluetoothWearables();
  const m = bridge.qWatchProProcessedMetrics;
  console.log('=== UNIVERSAL BLUETOOTH WEARABLE HUB (SHENZHEN WHOOP <-> QWATCH PRO <-> PANACEAMED AI) ===');
  console.log('• Total Wearable Terdukung :', mesh.totalSupportedWearableFamilies, 'Keluarga Perangkat BLE');
  console.log('• Topologi Jembatan Aktif  :', `${bridge.bluetoothTopology.peripheralSensor} -> ${bridge.bluetoothTopology.wristAggregatorBridge} -> ${bridge.bluetoothTopology.primaryOsHost}`);
  console.log('• Skor Pemulihan & Strain  :', `Recovery ${m.autonomicRecoveryPct}% (${m.ruitangTier}) | Strain ${m.whoopEquivalentDayStrain0to21}/21 | HRV RMSSD ${m.hrvRmssdMs} ms | PWV ${m.fusedPwvMps} m/s`);
  console.log('• Panduan AI Pengguna Awam :', bridge.aiHealthInterpretation.plainLanguageCustomerSummary);
  console.log('• Interpretasi AI Klinisi  :', bridge.aiHealthInterpretation.clinicianTechnicalSummary);
} else if (mode === 'awam') {
  const res = evaluateWave201To210LaypersonEverydayHealthHelper();
  const fam = evaluateWave211To220FamilyGrowthAndWorkdayErgonomics();
  console.log('=== PANDUAN KESEHATAN HARIAN ORANG AWAM & KELUARGA ===');
  console.log('1. Terjemahan Lab:', res.plainLanguageLabSummary.join(' | '));
  console.log('2. Peringatan Obat Rumah:', res.medicationSafetyCheck.duplicateIngredientWarnings[0]);
  console.log('3. P3K Anak (14 kg): Oralit', res.householdFirstAidGuide.oralitPerLooseStoolMl, 'mL/BAB cair | Parasetamol', res.householdFirstAidGuide.safeChildParacetamolDoseMg, 'mg');
  console.log('4. Deteksi Stunting Balita:', fam.pediatricGrowthWhoKms.stuntingStatus, `(Z-Score: ${fam.pediatricGrowthWhoKms.heightForAgeZScore} SD)`);
} else if (mode === 'dokter') {
  const doc = evaluateWave221To230ClinicianWorkAutomator();
  console.log('=== OTOMASI KERJA DOKTER (1-KLIK SOAP, SBAR & INFUS) ===');
  console.log('[SOAP - Assessment]:', doc.autoSoapNote.assessment);
  console.log('[SOAP - Plan]      :', doc.autoSoapNote.plan);
  console.log('[SBAR - Handoff]   :', doc.autoSbarHandoff.recommendation);
  console.log('[Syringe Pump]     : Norepinefrin', doc.vasopressorInfusionCalculator.syringePumpRateMlPerHour, 'mL/jam');
  console.log('[Koding JKN]       : ICD-10', doc.jknAndSatusehatCoding.icd10Primary, '+ ICD-9-CM', doc.jknAndSatusehatCoding.icd9CmProcedure);
} else {
  const status = runHolisticAutoExpansionAndSmoothOsGovernor();
  console.log('=== STATUS KEMATANGAN PANACEAMED OS ===');
  console.log('• Versi Kernel     :', status.holisticKernelVersion);
  console.log('• Kematangan OS    :', status.autoMaturityPercentage + '%');
  console.log('• Kesehatan Fungsi :', `${status.functionAuditSummary.passedCount}/${status.functionAuditSummary.totalFunctionsChecked} (${status.autoCheckFunctionHealthPercentage}%)`);
  console.log('• Kemulusan Runtime:', status.osOperationalSmoothness, `(${status.executionDurationMs} ms)`);
}

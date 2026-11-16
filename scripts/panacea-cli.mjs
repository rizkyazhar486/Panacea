#!/usr/bin/env node
/**
 * @file scripts/panacea-cli.mjs
 * @description Antarmuka CLI Harian PanaceaMed OS (Mendukung seluruh mode harian & klinis)
 * Contoh penggunaan:
 *   node scripts/panacea-cli.mjs daily
 *   node scripts/panacea-cli.mjs wearables
 *   node scripts/panacea-cli.mjs visa
 *   node scripts/panacea-cli.mjs mastercard
 *   node scripts/panacea-cli.mjs bluetooth
 *   node scripts/panacea-cli.mjs whoop
 *   node scripts/panacea-cli.mjs qwatch
 *   node scripts/panacea-cli.mjs bunglon
 *   node scripts/panacea-cli.mjs superapp
 *   node scripts/panacea-cli.mjs awam
 *   node scripts/panacea-cli.mjs dokter
 *   node scripts/panacea-cli.mjs 5b
 */

import {
  evaluateWave201To210LaypersonEverydayHealthHelper,
  evaluateWave211To220FamilyGrowthAndWorkdayErgonomics,
  evaluateWave221To230ClinicianWorkAutomator,
  runHolisticAutoExpansionAndSmoothOsGovernor,
  bridgeShenzhenWhoopToQWatchProAndInterpretAi,
  orchestrateAllConnectedBluetoothWearables
} from '../src/core/index.mjs';
import { runPanaceaMedWave320PlanetarySubspecialtyMasterOs } from '../src/core/panaceamedPlanetary5BillionSimulationOs.mjs';
import { runPanaceaMedWave400SuperAppEcosystemMasterOs } from '../src/core/panaceamedSuperAppQrBarcodeEcosystemOs.mjs';
import {
  runPanaceaMedWave450UniversalDeviceAndAiMasterOs,
  bridgeUniversalWearableStreamToAi
} from '../src/core/panaceamedUniversalBleWifiImitationOs.mjs';
import { runPanaceaMedWave500FluidChameleonMasterOs } from '../src/core/panaceamedFluidChameleonCamouflageOs.mjs';
import { runPanaceaMedWave550VisaMastercardAndMultiDeviceMasterOs } from '../src/core/panaceamedVisaMastercardTokenQrAndMultiDeviceOs.mjs';
import { runPanaceaMedWave600DailyWearableMasterOs } from '../src/core/panaceamedTwentyFiveWearablesDailyLifeOs.mjs';
import { runPanaceaMedWave650NeuroHormonalUhd5kMasterOs } from '../src/core/panaceamedNeuroHormonalVitalityScrollOs.mjs';
import { runPanaceaMedWave650Uhd5k4dMinimalistUxMasterOs } from '../src/core/panaceamedUhd5k4dMinimalistHormonalUxOs.mjs';
import { runPanaceaMedWave700UniversalPublic100ReadinessMasterOs } from '../src/core/panaceamedUniversalPublic100ReadinessOs.mjs';

const mode = (process.argv[2] || 'daily').toLowerCase();

if (mode === 'publik' || mode === 'masyarakat' || mode === '100' || mode === 'triage') {
  const pub = runPanaceaMedWave700UniversalPublic100ReadinessMasterOs();
  console.log('=== PANACEAMED WAVE 700 — 100% KELAYAKAN MASYARAKAT UMUM & PENDAMPING HARIAN ===');
  console.log('• Skor Kesiapan Publik 5 Dimensi :', pub.publicReadinessPercentage + '% (Status:', pub.readiness100.generalPublicUsabilityStatus + ')');
  console.log('• Triase Cepat Warga (Tanpa Alat):', pub.publicTriage.triageHeader);
  for (const step of pub.publicTriage.threeSimpleStepsForCitizen) {
    console.log(' ', step);
  }
  console.log('• Lingkaran Keluarga & Komunitas :');
  for (const c of pub.householdCompanion.householdCircles) {
    console.log(`  [${c.roleLabel}] ${c.statusBadge} -> ${c.dailyPracticalAction}`);
  }
} else if (mode === 'vitality' || mode === 'bioscroll' || mode === 'uhd5k' || mode === 'ux') {
  const v = runPanaceaMedWave650NeuroHormonalUhd5kMasterOs();
  const ux = runPanaceaMedWave650Uhd5k4dMinimalistUxMasterOs();
  console.log('=== PANACEAMED NEURO-HORMONAL VITALITY BIO-SCROLLING & UHD 5K 4D MIRROR ===');
  console.log('• Resolusi Kanvas 4D         :', v.uhd5kMirror.renderSpec.resolutionLabel, '@', v.uhd5kMirror.renderSpec.targetFrameRateFps, 'FPS');
  console.log('• Single-Score Hero (0-100)  :', ux.singleScoreUx.primaryDailyScore.panaceaScore + '/100 |', ux.singleScoreUx.singleDailyActionRecommendation.actionHeadline);
  console.log('• Visceral Bio-Mirroring     : Stress PWV =', ux.visceralBioMirrorStress.hemodynamicBloodFlowParticles.pwvMetersPerSec, 'm/s -> Recovery PWV =', ux.visceralBioMirrorRecovery.hemodynamicBloodFlowParticles.pwvMetersPerSec, 'm/s (432 Hz BioSymphony)');
  console.log('• Indeks Keterikatan Hormon  :', v.hormonalLoop.hormonalScores.compositeHormonalHookIndex + '/100 (Dopamin =', v.hormonalLoop.hormonalScores.dopamineDriveScore, '| Oksitosin =', v.hormonalLoop.hormonalScores.oxytocinResonanceScore, '| Serotonin =', v.hormonalLoop.hormonalScores.serotoninMasteryScore + ')');
  for (const c of ux.vitalityScrolling.cards) {
    console.log(`  [${c.cardId}] ${c.title} -> ${c.primaryMetric} (${c.secondaryDetail})`);
  }
} else if (mode === 'visa' || mode === 'mastercard' || mode === 'emv') {
  const emv = runPanaceaMedWave550VisaMastercardAndMultiDeviceMasterOs();
  console.log('=== PANACEAMED DYNAMIC TOKENIZED HEALTH ID (QR & MULTI-BARCODE) ===');
  console.log('• Pemegang Kartu (Kelas A)   :', emv.visaPass.cardholderName, '| Token dPAN:', emv.visaPass.formattedDpan, '(Luhn Valid =', emv.visaPass.luhnVerifiedTokenizedDpan + ')');
  console.log('• Pemegang Kartu (Kelas B)   :', emv.mastercardPass.cardholderName, '| Token dPAN:', emv.mastercardPass.formattedDpan, '(Luhn Valid =', emv.mastercardPass.luhnVerifiedTokenizedDpan + ')');
  console.log('• Sekuriti Dinamis (15s)     : dCVV =', emv.visaPass.dynamicSecurityState.dynamicDcvv3Digits, '| ATC =', emv.visaPass.dynamicSecurityState.atcTransactionCounter, '| ARQC =', emv.visaPass.dynamicSecurityState.emvArqcCryptogram16Hex);
  console.log('• Barcode Gelang & Farmasi   :', emv.visaPass.multiBarcode1DMatrix.barcode1_Code128WristbandAndLab.value, '|', emv.visaPass.multiBarcode1DMatrix.barcode2_Gs1PharmacyMedicationMatch.value);
} else if (mode === 'daily' || mode === 'wearables' || mode === '25devices') {
  const daily = runPanaceaMedWave600DailyWearableMasterOs();
  const v = daily.wearable25Daily.consensusDailyVitals;
  console.log('=== PANACEAMED GENERALIZED 25-WEARABLE HUB & 24-HOUR DAILY COMPANION ===');
  console.log('• Total Wearable & IoT Aktif :', daily.totalWearablesSupported, 'perangkat (RING, WATCH, CGM, BP_CUFF, WIFI_IOT)');
  console.log('• Konsensus Tanda Vital      : HR', v.meanHrBpm, 'bpm | HRV', v.meanHrvMs, 'ms | SpO2', v.meanSpo2Pct + '% | TD', v.meanBpSys + '/' + v.meanBpDia, 'mmHg | Suhu', v.meanTempC + '°C');
  console.log('• Skor Panacea Harian        :', v.panaceaScore + '/100 | Rekomendasi:', v.singleDailyRecommendation);
  for (const slot of daily.wearable25Daily.dailyFunctionalTimeline) {
    console.log(`  [${slot.timeSlot}] ${slot.title}: ${slot.laypersonAction}`);
  }
} else if (mode === 'bluetooth' || mode === 'whoop' || mode === 'qwatch' || mode === 'devices' || mode === 'wearable') {
  const bridge = bridgeShenzhenWhoopToQWatchProAndInterpretAi();
  const mesh = orchestrateAllConnectedBluetoothWearables();
  const dev = runPanaceaMedWave450UniversalDeviceAndAiMasterOs();
  const universalStream = bridgeUniversalWearableStreamToAi();
  const m = bridge.qWatchProProcessedMetrics;
  const v = universalStream.fusedVitalsSummary || dev.deviceMeshAi.fusedVitalsSummary;
  console.log('=== UNIVERSAL BLUETOOTH WEARABLE HUB (SHENZHEN WHOOP <-> QWATCH PRO <-> PANACEAMED AI) ===');
  console.log('• Total Wearable Terdukung :', mesh.totalSupportedWearableFamilies, 'Keluarga Perangkat BLE');
  console.log('• Topologi Jembatan Aktif  :', `${bridge.bluetoothTopology.peripheralSensor} -> ${bridge.bluetoothTopology.wristAggregatorBridge} -> ${bridge.bluetoothTopology.primaryOsHost}`);
  console.log('• Skor Pemulihan & Strain  :', `Recovery ${m.autonomicRecoveryPct}% (${m.ruitangTier}) | Strain ${m.whoopEquivalentDayStrain0to21}/21 | HRV RMSSD ${m.hrvRmssdMs} ms | PWV ${m.fusedPwvMps} m/s`);
  console.log('• Fusi Tanda Vital Real-Time :', `HR ${v.fusedHrBpm} bpm | HRV ${v.fusedHrvMs} ms | SpO2 ${v.fusedSpo2Pct}% | Panacea Score: ${v.panaceaScore}/100`);
  console.log('• Panduan AI Pengguna Awam :', bridge.aiHealthInterpretation.plainLanguageCustomerSummary);
  console.log('• Interpretasi AI Klinisi  :', bridge.aiHealthInterpretation.clinicianTechnicalSummary);
} else if (mode === 'bunglon' || mode === 'air' || mode === 'chameleon') {
  const fc = runPanaceaMedWave500FluidChameleonMasterOs();
  console.log('=== ADAPTIVE MULTI-PROTOCOL WEARABLE PARSER & FLUID FAILOVER ROUTER ===');
  console.log('• Profil Adaptor Aktif       :', fc.chameleonMorph.activeCamouflage.targetEcosystem);
  console.log('• Aliran Jalur Transpor      :', fc.waterRouter.transportStatus.activePrimaryChannel, '| Paket Hilang:', fc.waterRouter.continuityGuarantee.packetsDropped);
} else if (mode === 'superapp' || mode === 'qr') {
  const sa = runPanaceaMedWave400SuperAppEcosystemMasterOs();
  console.log('=== PANACEAMED SUPER-APP HEALTH ID (QR + BARCODE) & ECOSYSTEM ===');
  console.log('• Panacea Health ID (PAN-ID) :', sa.identityCard.panaceaHealthId, '| Barcode:', sa.identityCard.barcode1D.barcodeString);
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
  console.log('• SOAP Assessment:', doc.autoSoapNote.assessment, '| Syringe Pump:', doc.vasopressorInfusionCalculator.syringePumpRateMlPerHour, 'mL/jam');
} else if (mode === '5b' || mode === 'subspesialis') {
  const rep = runPanaceaMedWave320PlanetarySubspecialtyMasterOs();
  console.log('=== EVALUASI SIMULASI 5.000.000.000 PENGGUNA & 12 SUBSPESIALIS ===');
  console.log('• Populasi:', rep.planetary5B.totalSimulatedUsersString, '| Subspesialis:', rep.totalSubspecialtiesValidated, 'Bidang');
} else {
  const status = runHolisticAutoExpansionAndSmoothOsGovernor();
  const pub = runPanaceaMedWave700UniversalPublic100ReadinessMasterOs();
  console.log('=== STATUS KEMATANGAN PANACEAMED OS (WAVE 700 — 100% PUBLIC READY) ===');
  console.log('• Kematangan OS:', status.autoMaturityPercentage + '% | Kelayakan Masyarakat Umum:', pub.publicReadinessPercentage + '% | Kesehatan Fungsi:', status.autoCheckFunctionHealthPercentage + '%');
}

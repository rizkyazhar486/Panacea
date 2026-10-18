import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  clinicalClaimDisclosure,
  clinicalClaimLabel,
  clinicalClaimMaturity,
  klaimPermukaanKesehatan,
  PERMUKAAN_KLAIM_KESEHATAN,
} from '../../src/lib/clinicalClaimMaturity.ts'

assert.equal(
  clinicalClaimMaturity(),
  'technically-working',
  'technical output must remain the default when no review/validation evidence is present',
)
assert.equal(
  clinicalClaimMaturity({ clinicianReviewed: true }),
  'clinician-reviewed',
  'human review must not be mislabeled as clinical validation',
)
assert.equal(
  clinicalClaimMaturity({
    clinicianReviewed: true,
    externalValidation: true,
    validationEvidenceIds: ['   '],
  }),
  'clinician-reviewed',
  'blank validation evidence must fail closed',
)
assert.equal(
  clinicalClaimMaturity({
    clinicianReviewed: true,
    externalValidation: true,
    validationEvidenceIds: ['external-validation:site-b'],
  }),
  'clinically-validated',
  'clinical validation requires explicit human review, external validation and linked evidence',
)
assert.equal(
  clinicalClaimMaturity({
    externalValidation: true,
    validationEvidenceIds: ['external-validation:site-b'],
  }),
  'technically-working',
  'external evidence cannot silently substitute for required human review in this claim contract',
)

assert.equal(clinicalClaimLabel('clinician-reviewed'), 'Clinician-reviewed')
assert.match(
  clinicalClaimDisclosure('clinician-reviewed'),
  /clinical validation is a separate capability-level claim/i,
)
assert.match(
  clinicalClaimDisclosure('technically-working'),
  /not clinician-reviewed or clinically validated/i,
)

const emrSource = readFileSync(new URL('../../src/pages/clinical/EMR.tsx', import.meta.url), 'utf8')
assert.doesNotMatch(
  emrSource,
  /Certified by \{draft\.signedBy\}/,
  'a server-confirmed clinician signature must not be presented as clinical certification',
)
assert.doesNotMatch(
  emrSource,
  /AI-assisted, clinician-verified\./,
  'AI-generated patient education must not claim clinician verification without review evidence',
)
assert.match(
  emrSource,
  /data-clinical-claim-maturity=\{maturity\}/,
  'EMR must expose machine-readable claim maturity for rendered review/validation status',
)
assert.match(
  emrSource,
  /Server-confirmed signature by/,
  'signed records should describe the actual server-confirmed event rather than imply validation',
)
assert.match(
  emrSource,
  /AI-generated draft/,
  'generated education must remain visibly draft-level until review evidence exists',
)

for (const permukaan of PERMUKAAN_KLAIM_KESEHATAN) {
  assert.equal(
    klaimPermukaanKesehatan(permukaan),
    'technically-working',
    `${permukaan} may be shown as clinically validated without evidence`,
  )
}
assert.equal(
  klaimPermukaanKesehatan('unknown.surface', {
    clinicianReviewed: true,
    externalValidation: true,
    validationEvidenceIds: ['external-validation:site-b'],
  }),
  'technically-working',
  'an unregistered healthcare surface may upgrade itself with evidence meant for another capability',
)

const berkasPermukaan: Record<(typeof PERMUKAAN_KLAIM_KESEHATAN)[number], string> = {
  'longevity.biological-age': '../../src/pages/bodyhub/BiologicalAge.tsx',
  'longevity.score': '../../src/pages/bodyhub/Longevity.tsx',
  'longevity.body-composition': '../../src/pages/bodyhub/BodyComposition.tsx',
  'longevity.organ-vitality': '../../src/pages/bodyhub/OrganVitality.tsx',
  'lab.phenoage': '../../src/components/growth/LongevityPanel.tsx',
  'lab.blood-trend': '../../src/components/tiles/UbinLab.tsx',
  'calculators.risk': '../../src/pages/clinical/scores/RiskCalculators.tsx',
  'calculators.clinical': '../../src/pages/clinical/ClinicalCalculators.tsx',
  'screening.mental': '../../src/pages/mental/MentalHealthScreen.tsx',
  'screening.epworth': '../../src/pages/clinical/scores/EpworthSleepiness.tsx',
  'screening.substance': '../../src/pages/mental/SubstanceUseScreen.tsx',
  'screening.findrisc': '../../src/pages/clinical/scores/Findrisc.tsx',
  'screening.chronotype': '../../src/pages/bodyhub/Chronotype.tsx',
  'care.cdss': '../../src/pages/clinical/Planning.tsx',
  'calculators.published-score': '../../src/components/ui/BatasKlaimSkorTerbit.tsx',
  'longevity.health-simulator': '../../src/pages/bodyhub/HealthSimulator.tsx',
  'screening.family-history': '../../src/pages/bodyhub/FamilyHealth.tsx',
  'clinical.dermatology-mapper': '../../src/pages/medstudy/DermatologyLesionMapper.tsx',
  'care.second-opinion': '../../src/pages/clinical/SecondOpinion.tsx',
  'longevity.supplements': '../../src/pages/longevity/DietarySupplements.tsx',
  'clinical.drug-info': '../../src/pages/medstudy/DrugInfo.tsx',
  'performance.fitness-test': '../../src/pages/fitness/FitnessTest.tsx',
  'longevity.shape-forming': '../../src/pages/bodyhub/ShapeForming.tsx',
  'clinical.empiric-therapy': '../../src/pages/medstudy/EmpiricTherapyReference.tsx',
  'clinical.neonatal-resus': '../../src/pages/medstudy/NeonatalResuscitationGuide.tsx',
  'clinical.first-aid': '../../src/pages/medstudy/FirstAidGuide.tsx',
  'lab.decoder': '../../src/pages/medstudy/LabDecoder.tsx',
  'care.ai-chat': '../../src/pages/clinical/Chatbot.tsx',
  'genomics.gene-info': '../../src/pages/bodyhub/GeneInfo.tsx',
  'environment.air-quality': '../../src/pages/bodyhub/AirQuality.tsx',
  'care.emergency-card': '../../src/pages/clinical/EmergencyCard.tsx',
  'wellness.sleep-debt': '../../src/pages/bodyhub/SleepDebt.tsx',
  'wellness.sleep-score': '../../src/pages/bodyhub/Recovery.tsx',
  'wellness.recovery': '../../src/pages/bodyhub/Recovery.tsx',
  'performance.readiness': '../../src/pages/bodyhub/Readiness.tsx',
  'wellness.body-battery': '../../src/pages/bodyhub/BodyBattery.tsx',
  'longevity.aesthetic-vitality': '../../src/pages/bodyhub/AestheticVitality.tsx',
  'wellness.vocal-biomarkers': '../../src/pages/bodyhub/VocalBiomarkers.tsx',
  'wellness.self-assessment': '../../src/pages/mental/SelfAssessmentToolkit.tsx',
  'wellness.rppg-heart-rate': '../../src/pages/bodyhub/RppgHeartRate.tsx',
  'wellness.alcohol-bac': '../../src/pages/bodyhub/AlcoholCalculator.tsx',
  'wellness.caffeine-sleep': '../../src/pages/bodyhub/CaffeineCalculator.tsx',
  'wellness.hydration': '../../src/pages/bodyhub/HydrationCalculator.tsx',
  'pediatrics.child-growth': '../../src/pages/medstudy/ChildGrowthTracker.tsx',
  'genomics.snp-profiler': '../../src/pages/bodyhub/SnpProfiler.tsx',
  'wellness.vaccine-tracker': '../../src/pages/medstudy/VaccineTracker.tsx',
  'wellness.allergy-tracker': '../../src/pages/medstudy/AllergyTracker.tsx',
  'wellness.pain-diary': '../../src/pages/medstudy/PainDiary.tsx',
  'wellness.sun-exposure': '../../src/pages/bodyhub/SunExposure.tsx',
  'wellness.thermal-therapy': '../../src/pages/bodyhub/ThermalTherapy.tsx',
  'wellness.sleep-toolkit': '../../src/pages/bodyhub/SleepToolkit.tsx',
  'wellness.sleep-pattern': '../../src/pages/fitness/SleepPattern.tsx',
  'longevity.movement-toolkit': '../../src/pages/fitness/MovementToolkit.tsx',
  'longevity.mind-toolkit': '../../src/pages/mental/MindToolkit.tsx',
  'longevity.predictive-models': '../../src/pages/bodyhub/PredictiveModelsToolkit.tsx',
  'longevity.body-toolkit': '../../src/pages/bodyhub/BodyToolkit.tsx',
  'longevity.nutrition-toolkit': '../../src/pages/bodyhub/NutritionToolkit.tsx',
  'performance.athlete': '../../src/pages/fitness/Athlete.tsx',
  'wellness.phone-health-scan': '../../src/pages/bodyhub/PhoneHealthScan.tsx',
  'clinical.trackers': '../../src/pages/clinical/ClinicalTrackers.tsx',
  'clinical.initial-assessment': '../../src/pages/clinical/InitialAssessment.tsx',
  'clinical.psychiatric-mse': '../../src/pages/mental/PsychiatricStatusExam.tsx',
  'care.mental-safety-plan': '../../src/pages/mental/MentalSafetyPlan.tsx',
  'genomics.genome-lab': '../../src/pages/medstudy/GenomeLab.tsx',
  'wellness.heart-rate-log': '../../src/pages/fitness/HeartRateLog.tsx',
  'care.organ-donor': '../../src/pages/clinical/OrganDonorCard.tsx',
  'wellness.sexual-health': '../../src/pages/bodyhub/SexualHealth.tsx',
  'longevity.realistic-health': '../../src/pages/bodyhub/RealisticHealth.tsx',
  'performance.analisis-pro': '../../src/pages/fitness/AnalisisPro.tsx',
  'longevity.science-explainers': '../../src/pages/longevity/LongevityScience.tsx',
  'longevity.game-center': '../../src/pages/longevity/LongevityGameCenter.tsx',
  'wellness.toxin-checklist': '../../src/pages/medstudy/ToxinChecklist.tsx',
  'wellness.blood-donation': '../../src/pages/bodyhub/BloodDonation.tsx',
  'performance.gait-analysis': '../../src/pages/bodyhub/GaitAnalysis.tsx',
  'wellness.fasting-timer': '../../src/pages/wellness/FastingTimer.tsx',
  'wellness.breathwork': '../../src/pages/fitness/Breathwork.tsx',
  'longevity.bio-simulators': '../../src/pages/longevity/BioSimulators.tsx',
  'care.medication-reminders': '../../src/pages/bodyhub/MedicationReminders.tsx',
  'wellness.posture-breaks': '../../src/pages/bodyhub/PostureBreaks.tsx',
  'care.consult-triage': '../../src/pages/clinical/Consult.tsx',
  'longevity.nutrition-score': '../../src/pages/bodyhub/Nutrition.tsx',
  'performance.athlete-science': '../../src/pages/fitness/AthleteScience.tsx',
  'lab.data-lab': '../../src/pages/bodyhub/DataLab.tsx',
  'calculators.hub': '../../src/pages/clinical/CalculatorHub.tsx',
  'clinical.electrophysiology': '../../src/pages/bodyhub/Electrophysiology.tsx',
  'performance.endurance-tools': '../../src/pages/fitness/EnduranceTools.tsx',
  'performance.health-league': '../../src/pages/bodyhub/HealthPerformanceLeague.tsx',
  'care.episode': '../../src/pages/clinical/CareEpisode.tsx',
  'wellness.macro-lab': '../../src/pages/bodyhub/MacroLabGizi.tsx',
  'longevity.curriculum': '../../src/pages/medstudy/LongevityCurriculum.tsx',
  'care.cdss-architecture': '../../src/pages/clinical/Architecture.tsx',
  'care.clinical-evidence': '../../src/pages/medstudy/ClinicalEvidence.tsx',
  'care.dashboard-insights': '../../src/pages/dashboard/Dashboard.tsx',
  'lab.clinician-shared-view': '../../src/components/clinical/LabPasienUntukDokter.tsx',
  'lab.patient-share': '../../src/components/clinical/BagikanLabKeDokter.tsx',
  'lab.what-changed': '../../src/components/growth/ApaYangBerubah.tsx',
  'lab.import-draft': '../../src/components/clinical/ImporLembarLab.tsx',
  'lab.number-rules': '../../src/pages/bodyhub/AturanAngka.tsx',
  'wellness.health-profile': '../../src/pages/bodyhub/HealthProfile.tsx',
  'wellness.health-sync': '../../src/pages/bodyhub/HealthSyncTutorial.tsx',
  'performance.multi-sport': '../../src/pages/fitness/MultiSport.tsx',
  'performance.strength-log': '../../src/pages/fitness/LatihanBeban.tsx',
  'performance.training-physiology': '../../src/pages/fitness/TrainingPhysiology.tsx',
  'care.pricing': '../../src/components/landing/PricingSection.tsx',
  'wellness.hub': '../../src/pages/wellness/WellnessHub.tsx',
  'clinical.hub': '../../src/pages/clinical/ClinicalHub.tsx',
  'wellness.home-brief': '../../src/components/dashboard/HomeHealthBrief.tsx',
  'wellness.health-trends': '../../src/components/dashboard/HealthTrends.tsx',
  'wellness.home-instruments': '../../src/components/dashboard/HomeHealthInstruments.tsx',
  'longevity.nutrition-checklist': '../../src/pages/bodyhub/NutritionChecklist.tsx',
  'performance.lab': '../../src/pages/fitness/PerformanceLab.tsx',
  'performance.sports-lab': '../../src/pages/fitness/SportsLab.tsx',
  'wellness.gap-navigator': '../../src/components/dashboard/HealthGapNavigator.tsx',
  'care.frontier-os': '../../src/pages/medstudy/FrontierHealthOS.tsx',
  'wellness.health-snapshot': '../../src/components/dashboard/HealthSnapshot.tsx',
  'body.workspace': '../../src/pages/UnifiedBodyWorkspace.tsx',
  'care.ai-emr': '../../src/pages/clinical/EMR.tsx',
  'care.visit-os': '../../src/pages/clinical/VisitOS.tsx',
  'wellness.vitapulse': '../../src/pages/bodyhub/VitaPulse.tsx',
  'wellness.home-command': '../../src/components/dashboard/HomeCommandDeck.tsx',
  'wellness.home-overview': '../../src/components/dashboard/HomeOverviewMosaic.tsx',
  'wellness.body-energy-card': '../../src/components/clinical/KartuKlinisTubuh.tsx',
  'wellness.sleep-recovery-card': '../../src/components/dashboard/KartuTidurPemulihan.tsx',
  'wellness.device-data-card': '../../src/components/dashboard/KartuDataPerangkat.tsx',
  'clinical.body-twin': '../../src/components/digital-twin/ClinicalBodyTwin.tsx',
  'clinical.manual-flowsheet': '../../src/components/clinical/ManualClinicalFlowsheet.tsx',
  'wellness.daily-checkin': '../../src/components/clinical/CekHarian.tsx',
  'care.emr-timeline': '../../src/components/clinical/EmrTimelineLens.tsx',
  'care.profile': '../../src/pages/dashboard/Profile.tsx',
  'body.exposure-os': '../../src/pages/bodyhub/BodyExposureOS.tsx',
  'body.patient-overlay': '../../src/components/digital-twin/BodyExposurePatientOverlay.tsx',
  'body.personal-signals': '../../src/components/clinical/SinyalPribadiDiTubuh.tsx',
  'body.personal-surface': '../../src/components/digital-twin/PersonalBodyUnifiedSurface.tsx',
  'body.pusat-tubuh': '../../src/pages/PusatTubuh.tsx',
  'body.status-bar': '../../src/components/bodyhub/BilahTubuh.tsx',
  'care.doctor-daily-plan': '../../src/components/clinical/RencanaHarianDokter.tsx',
  'care.hospitals': '../../src/pages/clinical/Hospitals.tsx',
  'care.kunjungan-emr': '../../src/components/clinical/KunjunganEmr.tsx',
  'care.lay-education': '../../src/pages/medstudy/EdukasiAwamBase.tsx',
  'care.learn': '../../src/pages/Learn.tsx',
  'care.learn-workspace': '../../src/pages/UnifiedLearnWorkspace.tsx',
  'care.patient-education': '../../src/pages/medstudy/PatientEducation.tsx',
  'care.pusat-catatan': '../../src/pages/medstudy/PusatCatatan.tsx',
  'care.visit-command': '../../src/components/clinical/VisitCommandCenter.tsx',
  'care.visit-prep': '../../src/pages/medstudy/VisitPrepChecklist.tsx',
  'clinical.angka-klinis': '../../src/components/clinical/AngkaKlinis.tsx',
  'clinical.diagnosis-notify': '../../src/components/notifications/DiagnosaNotifikasi.tsx',
  'clinical.drug-by-complaint': '../../src/components/clinical/ObatPerKeluhan.tsx',
  'clinical.drug-chain': '../../src/components/clinical/RantaiObat.tsx',
  'clinical.ecmo-panel': '../../src/components/digital-twin/PanelEcmo.tsx',
  'clinical.evidence-explorer': '../../src/components/medstudy/MedicalEvidenceExplorer.tsx',
  'clinical.lesion-morphology': '../../src/components/clinical/MorfologiLesi.tsx',
  'clinical.library-workbench': '../../src/components/medstudy/MedicalLibraryWorkbench.tsx',
  'clinical.med-study': '../../src/pages/medstudy/MedStudyHubBase.tsx',
  'clinical.medical-3d-lab': '../../src/components/digital-twin/Medical3DFrontierLab.tsx',
  'clinical.medical-news': '../../src/components/landing/MedicalNews.tsx',
  'clinical.mental-research-lab': '../../src/components/frontier/MentalHealthClinicalResearchLab.tsx',
  'clinical.osce': '../../src/pages/medstudy/OsceUkmppd.tsx',
  'clinical.pharmacy': '../../src/pages/clinical/Pharmacy.tsx',
  'clinical.pusat-rujukan': '../../src/pages/medstudy/PusatRujukan.tsx',
  'clinical.radiology': '../../src/pages/bodyhub/Radiology.tsx',
  'clinical.sync-status': '../../src/components/clinical/StatusSinkronKlinis.tsx',
  'clinical.trials': '../../src/pages/medstudy/ClinicalTrials.tsx',
  'clinical.validation-study': '../../src/components/clinical/StudiValidasiKlinis.tsx',
  'longevity.carbon-diet': '../../src/pages/bodyhub/CarbonDiet.tsx',
  'longevity.nutrition-data-controls': '../../src/pages/bodyhub/NutritionDataControls.tsx',
  'longevity.pusat-gizi': '../../src/pages/bodyhub/PusatGizi.tsx',
  'longevity.reality-check': '../../src/pages/bodyhub/RealityCheck.tsx',
  'pediatrics.growth-chart': '../../src/components/growth/GrowthChart.tsx',
  'performance.athlete-board': '../../src/pages/fitness/PapanAtlet.tsx',
  'performance.base-training': '../../src/pages/fitness/BaseTraining.tsx',
  'performance.crossfit': '../../src/pages/fitness/CrossFit.tsx',
  'performance.diving': '../../src/pages/fitness/Menyelam.tsx',
  'performance.fitness-science-panel': '../../src/components/fitness/PanelKebugaranIlmiah.tsx',
  'performance.gym-equipment': '../../src/pages/fitness/GymEquipment.tsx',
  'performance.nutrition-coach': '../../src/pages/fitness/PelatihAsupan.tsx',
  'performance.progress-coach': '../../src/pages/fitness/PelatihProgres.tsx',
  'performance.pusat-latihan': '../../src/pages/fitness/PusatLatihan.tsx',
  'performance.recomposition': '../../src/pages/fitness/Rekomposisi.tsx',
  'performance.running-form': '../../src/pages/fitness/TeknikLari.tsx',
  'performance.session-cockpit': '../../src/components/fitness/TrainingSessionCockpit.tsx',
  'performance.session-organizer': '../../src/pages/fitness/OrganizerLatihan.tsx',
  'performance.sports-science': '../../src/pages/fitness/SportsScience.tsx',
  'performance.sports-scores': '../../src/pages/fitness/SportsScores.tsx',
  'performance.stretching': '../../src/pages/fitness/Peregangan.tsx',
  'performance.training-analytics': '../../src/components/fitness/TrainingAnalyticsPanel.tsx',
  'performance.training-plan': '../../src/pages/fitness/TrainingPlan.tsx',
  'performance.workout': '../../src/pages/fitness/Workout.tsx',
  'performance.workout-history': '../../src/pages/fitness/WorkoutHistory.tsx',
  'wellness.change-log': '../../src/pages/bodyhub/Perubahan.tsx',
  'wellness.daily-hub': '../../src/pages/bodyhub/Harian.tsx',
  'wellness.daily-notes': '../../src/components/clinical/CatatanHarian.tsx',
  'wellness.health-alerts': '../../src/components/notifications/HealthAlertSettings.tsx',
  'wellness.home': '../../src/pages/dashboard/Beranda.tsx',
  'wellness.literacy-coach': '../../src/components/dashboard/HealthLiteracyCoach.tsx',
  'wellness.number-panel': '../../src/components/clinical/PanelAngka.tsx',
  'wellness.pusat-jiwa': '../../src/pages/PusatJiwa.tsx',
  'wellness.score-tile': '../../src/components/tiles/UbinSkor.tsx',
  'wellness.score-trend': '../../src/components/growth/ScoreTrend.tsx',
  'wellness.sleep-nutrition-tile': '../../src/components/tiles/UbinTidurGizi.tsx',
  'wellness.tdee-tile': '../../src/components/tiles/UbinTdee.tsx',
  'body.explorer': '../../src/pages/bodyhub/BodyExplorer.tsx',
  'body.multiscale-coupling': '../../src/components/digital-twin/PanelKoplingMultiSkala.tsx',
  'care.consult-chat': '../../src/components/clinical/ConsultChat.tsx',
  'care.innovation-lab': '../../src/pages/medstudy/RecentInnovationLabBase.tsx',
  'care.knowledge-bridge': '../../src/pages/medstudy/KnowledgeBridgeBase.tsx',
  'care.landing': '../../src/pages/landing/Landing.tsx',
  'care.learn-base': '../../src/pages/medstudy/LearnBase.tsx',
  'care.login': '../../src/pages/landing/Login.tsx',
  'care.practice-record-link': '../../src/components/clinical/TautanRekamPraktik.tsx',
  'environment.home-tile': '../../src/components/tiles/UbinLingkungan.tsx',
  'genomics.central-dogma-sim': '../../src/components/digital-twin/CentralDogmaEvolutionSimulator.tsx',
  'longevity.food-tile': '../../src/components/tiles/UbinPangan.tsx',
  'longevity.ubiquitin-panel': '../../src/components/digital-twin/PanelUbiquitin.tsx',
  'performance.activity-share': '../../src/components/fitness/ActivityShareCard.tsx',
  'performance.fitness-meaning': '../../src/components/fitness/ArtiKebugaran.tsx',
  'wellness.daily-plus-tile': '../../src/components/tiles/UbinHarianPlus.tsx',
  'wellness.daily-ring-tile': '../../src/components/tiles/UbinRingHarian.tsx',
  'wellness.device-tile': '../../src/components/tiles/UbinPerangkatImpl.tsx',
  'wellness.home-interactive-rail': '../../src/components/dashboard/HomeInteractiveRail.tsx',
  'wellness.home-live-rail': '../../src/components/dashboard/HomeLiveWidgetRail.tsx',
  'wellness.home-widget': '../../src/components/dashboard/WidgetBeranda.tsx',
  'wellness.measure-tile': '../../src/components/tiles/UbinUkurImpl.tsx',
  'wellness.monitor-tile': '../../src/components/tiles/UbinPantauan.tsx',
  'wellness.overview': '../../src/pages/bodyhub/Ikhtisar.tsx',
  'wellness.share-stat': '../../src/components/share/ShareStatCard.tsx',
}
const komponenKlaim = readFileSync(new URL('../../src/components/ui/BatasKlaimKesehatan.tsx', import.meta.url), 'utf8')
assert.match(komponenKlaim, /data-clinical-claim-maturity=\{maturity\}/, 'the shared claim boundary must stay machine-readable')
assert.match(komponenKlaim, /klaimPermukaanKesehatan\(permukaan, evidence\)/, 'the shared boundary must not hard-code a maturity')
for (const [permukaan, jalur] of Object.entries(berkasPermukaan)) {
  const sumber = readFileSync(new URL(jalur, import.meta.url), 'utf8')
  assert.match(
    sumber,
    new RegExp(`permukaan="${permukaan}"`),
    `${permukaan} is rendered without the shared claim boundary`,
  )
}

for (const jalur of ['../../src/pages/landing/Landing.tsx', '../../src/pages/landing/Login.tsx', '../../src/pages/finance/Pricing.tsx', '../../src/components/landing/PricingSection.tsx']) {
  const sumber = readFileSync(new URL(jalur, import.meta.url), 'utf8')
  assert.doesNotMatch(sumber, /Certified AI-EMR/, `${jalur} still sells AI-EMR as certified`)
}
assert.doesNotMatch(
  readFileSync(new URL('../../src/pages/clinical/ClinicalScores.tsx', import.meta.url), 'utf8'),
  /validated scores/,
  'the score list may call its own catalogue clinically validated',
)
assert.doesNotMatch(
  readFileSync(new URL('../../src/pages/mental/MentalHealthScreen.tsx', import.meta.url), 'utf8'),
  /validated way to gauge/,
  'mental screening may present Panacea itself as clinically validated',
)
assert.match(
  readFileSync(new URL('../../src/pages/clinical/ClinicalCalculators.tsx', import.meta.url), 'utf8'),
  /not a clinically validated Panacea decision/,
  'clinical calculators header must state they are not a clinically validated Panacea decision',
)
assert.doesNotMatch(
  readFileSync(new URL('../../src/pages/clinical/scores/EpworthSleepiness.tsx', import.meta.url), 'utf8'),
  /Validated measure of excessive daytime sleepiness/,
  'Epworth may present Panacea itself as clinically validated',
)
assert.doesNotMatch(
  readFileSync(new URL('../../src/pages/mental/SubstanceUseScreen.tsx', import.meta.url), 'utf8'),
  /Two short, validated screens/,
  'substance screening may present Panacea itself as clinically validated',
)
assert.doesNotMatch(
  readFileSync(new URL('../../src/pages/bodyhub/Chronotype.tsx', import.meta.url), 'utf8'),
  /A validated 5-item short form/,
  'chronotype may present Panacea itself as clinically validated',
)
assert.doesNotMatch(
  readFileSync(new URL('../../src/pages/bodyhub/SleepApneaScreen.tsx', import.meta.url), 'utf8'),
  /Validated obstructive sleep apnea/,
  'STOP-BANG may present Panacea itself as clinically validated',
)
assert.doesNotMatch(
  readFileSync(new URL('../../src/pages/PusatJiwa.tsx', import.meta.url), 'utf8'),
  /Validated self-report screens/,
  'mental hub may present Panacea screening as clinically validated',
)
assert.match(
  readFileSync(new URL('../../src/pages/clinical/scores/News2Score.tsx', import.meta.url), 'utf8'),
  /BatasKlaimSkorTerbit/,
  'NEWS2 must render the published-score claim boundary',
)
assert.match(
  readFileSync(new URL('../../src/pages/clinical/scores/CapriniScore.tsx', import.meta.url), 'utf8'),
  /published surgical cohorts/,
  'Caprini must not call Bahl 2010 a Panacea clinical validation',
)

assert.doesNotMatch(
  readFileSync(new URL('../../src/pages/clinical/scores/RiskCalculators.tsx', import.meta.url), 'utf8'),
  /Validated scores with their actual published formulas/,
  'risk calculators hub may present Panacea as clinically validated',
)
assert.doesNotMatch(
  readFileSync(new URL('../../src/pages/wellness/WellnessHub.tsx', import.meta.url), 'utf8'),
  /Validated depression & anxiety screening|Validated substance-use screening/,
  'wellness hub may present Panacea screening as clinically validated',
)
assert.match(
  readFileSync(new URL('../../src/pages/wellness/WellnessHub.tsx', import.meta.url), 'utf8'),
  /not a Panacea diagnosis/,
  'wellness hub mental/substance cards must match the catalog honesty boundary',
)
assert.match(
  readFileSync(new URL('../../src/components/tiles/UbinLab.tsx', import.meta.url), 'utf8'),
  /permukaan="lab.blood-trend"/,
  'Your Numbers lab widget must render the blood-trend claim boundary',
)
assert.doesNotMatch(
  readFileSync(new URL('../../src/pages/clinical/Chatbot.tsx', import.meta.url), 'utf8'),
  /Analyze this diagnostic imaging/,
  'chatbot vision must not ask the model to analyze diagnostic imaging as clinical diagnosis',
)
assert.doesNotMatch(
  readFileSync(new URL('../../src/pages/bodyhub/NutritionDataControls.tsx', import.meta.url), 'utf8'),
  /Validated now|Export validated JSON/,
  'nutrition data controls must not reuse clinical-validation wording for schema acceptance',
)

assert.match(
  readFileSync(new URL('../../src/pages/clinical/scores/DukeCriteria.tsx', import.meta.url), 'utf8'),
  /BatasKlaimSkorTerbit/,
  'Duke criteria must render the published-score claim boundary',
)
assert.match(
  readFileSync(new URL('../../src/pages/medstudy/EmpiricTherapyReference.tsx', import.meta.url), 'utf8'),
  /not a clinically validated Panacea prescribing decision/,
  'empiric therapy must state it is not a Panacea prescribing decision',
)

assert.doesNotMatch(
  readFileSync(new URL('../../src/pages/clinical/Chatbot.tsx', import.meta.url), 'utf8'),
  /Anamnesis Co-Physician/,
  'chatbot header must not imply the AI is a co-physician clinical authority',
)

assert.match(
  readFileSync(new URL('../../src/pages/clinical/scores/PercRule.tsx', import.meta.url), 'utf8'),
  /BatasKlaimSkorTerbit/,
  'PERC Rule must render the published-score claim boundary',
)
assert.doesNotMatch(
  readFileSync(new URL('../../src/pages/dashboard/Dashboard.tsx', import.meta.url), 'utf8'),
  /AI co-physician/,
  'dashboard insight prompt must not brand the model as a co-physician',
)
assert.doesNotMatch(
  readFileSync(new URL('../../src/pages/landing/Landing.tsx', import.meta.url), 'utf8'),
  /AI co-physician|Verified by licensed doctors/,
  'landing must not sell the product as a doctor-verified co-physician',
)
assert.doesNotMatch(
  readFileSync(new URL('../../src/pages/landing/Login.tsx', import.meta.url), 'utf8'),
  /doctors verify/,
  'login brand panel must not claim doctors always verify AI output',
)
assert.match(
  readFileSync(new URL('../../src/pages/clinical/scores/AaGradient.tsx', import.meta.url), 'utf8'),
  /BatasKlaimSkorTerbit/,
  'A-a gradient must render the published-score claim boundary',
)
assert.doesNotMatch(
  readFileSync(new URL('../../src/pages/clinical/Consult.tsx', import.meta.url), 'utf8'),
  /may indicate a need for surgery|AI Recommended|AI will suggest the appropriate specialist/,
  'consult triage must not claim surgical indication or clinician-authority AI recommendations',
)
assert.doesNotMatch(
  readFileSync(new URL('../../src/lib/katalogFitur.ts', import.meta.url), 'utf8'),
  /Validated depression|Validated substance|really functioning/,
  'feature catalog must not sell screens as Panacea-validated or biological age as true function',
)
assert.match(
  readFileSync(new URL('../../src/pages/bodyhub/GeneInfo.tsx', import.meta.url), 'utf8'),
  /not genetic counselling/,
  'gene info must not imply clinical genetic counselling',
)

console.log('clinical claim maturity: review and clinical validation remain distinct, evidence-gated states')

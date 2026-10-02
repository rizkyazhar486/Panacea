/**
 * Panacea Medical Device Integration Catalog
 *
 * This is an industry-level taxonomy and interoperability contract, not a claim
 * that Panacea already supports every vendor/model listed by the categories.
 * Vendor/model support is earned only after a source-specific adapter is
 * implemented, validated against deterministic fixtures, and promoted through
 * the maturity levels below.
 *
 * Existing scalar bedside/visit measurements continue to flow through
 * visitOperatingSystem.ts. Existing imaging continues to use the DICOM stack.
 * This catalog is the shared capability map that prevents each new device family
 * from inventing its own protocol, provenance, analyzer and safety model.
 */

export type MedicalDeviceDomain =
  | 'patient-monitoring'
  | 'cardiology'
  | 'intravascular-imaging'
  | 'radiology'
  | 'ultrasound'
  | 'respiratory'
  | 'anesthesia'
  | 'infusion'
  | 'renal-replacement'
  | 'extracorporeal-support'
  | 'laboratory'
  | 'point-of-care'
  | 'neurology'
  | 'endoscopy'
  | 'surgery'
  | 'ophthalmology'
  | 'implantable-cardiac'
  | 'obstetric-neonatal'
  | 'pathology'
  | 'rehabilitation'
  | 'home-monitoring'
  | 'wearable'

export type MedicalDeviceDataShape =
  | 'scalar'
  | 'timeseries'
  | 'waveform'
  | 'image'
  | 'volume'
  | 'video'
  | 'report'
  | 'event'
  | 'alarm'
  | 'setting'
  | 'therapy-delivery'
  | 'device-status'

export type MedicalDeviceInteropStandard =
  | 'dicom-dimse'
  | 'dicomweb'
  | 'hl7-v2'
  | 'fhir-r4'
  | 'ihe-dev-dec'
  | 'ihe-dev-acm'
  | 'ihe-dev-idco'
  | 'ihe-dev-ipec'
  | 'ihe-dev-piv'
  | 'ieee-11073-sdc'
  | 'ieee-11073-phd'
  | 'ble-gatt'
  | 'usb'
  | 'serial'
  | 'tcp-ip'
  | 'vendor-sdk'
  | 'vendor-cloud'

export type MedicalDeviceAnalyzerKind =
  | 'transport-integrity'
  | 'clock-skew'
  | 'signal-quality'
  | 'trend'
  | 'waveform'
  | 'hemodynamics'
  | 'coronary-physiology'
  | 'respiratory-mechanics'
  | 'image-geometry'
  | 'imaging-quantification'
  | 'dose-exposure'
  | 'alarm-context'
  | 'therapy-delivery'
  | 'laboratory-qc'
  | 'implant-interrogation'
  | 'movement-biomechanics'
  | 'device-health'

export type DeviceConnectorMaturity =
  | 'catalog-only'
  | 'contract-ready'
  | 'adapter-tested'
  | 'production-validated'

export type DeviceDataDirection = 'inbound-read-only' | 'bidirectional-regulated'

export interface MedicalDeviceIntegrationProfile {
  id: string
  label: string
  domain: MedicalDeviceDomain
  examples: readonly string[]
  dataShapes: readonly MedicalDeviceDataShape[]
  preferredStandards: readonly MedicalDeviceInteropStandard[]
  fallbackTransports: readonly MedicalDeviceInteropStandard[]
  analyzers: readonly MedicalDeviceAnalyzerKind[]
  maturity: DeviceConnectorMaturity
  dataDirection: DeviceDataDirection
  notes?: string
}

function profile(
  value: Omit<MedicalDeviceIntegrationProfile, 'maturity' | 'dataDirection'> &
    Partial<Pick<MedicalDeviceIntegrationProfile, 'maturity' | 'dataDirection'>>,
): MedicalDeviceIntegrationProfile {
  return Object.freeze({
    ...value,
    maturity: value.maturity ?? 'catalog-only',
    dataDirection: value.dataDirection ?? 'inbound-read-only',
  })
}

/**
 * Broad industry coverage by device family.
 *
 * These are capability families, not vendor claims. A Boston Scientific,
 * Philips, GE, Siemens, Medtronic, Dräger, Getinge, Baxter, Fresenius, Roche,
 * Abbott or other vendor model must still receive its own documented adapter
 * and validation evidence before Panacea may call it supported.
 */
export const MEDICAL_DEVICE_INTEGRATION_CATALOG = Object.freeze([
  profile({
    id: 'bedside-multiparameter-monitor',
    label: 'Bedside multiparameter monitor',
    domain: 'patient-monitoring',
    examples: ['ECG/HR', 'SpO2', 'NIBP/IBP', 'respiratory rate', 'temperature', 'cardiac output'],
    dataShapes: ['scalar', 'timeseries', 'waveform', 'alarm', 'setting', 'device-status'],
    preferredStandards: ['ihe-dev-dec', 'ieee-11073-sdc', 'fhir-r4'],
    fallbackTransports: ['hl7-v2', 'tcp-ip', 'serial', 'vendor-sdk'],
    analyzers: ['transport-integrity', 'clock-skew', 'signal-quality', 'trend', 'waveform', 'hemodynamics', 'alarm-context', 'device-health'],
  }),
  profile({
    id: 'ecg-telemetry',
    label: 'ECG and telemetry',
    domain: 'cardiology',
    examples: ['12-lead ECG', 'continuous telemetry', 'Holter', 'ambulatory ECG patch'],
    dataShapes: ['scalar', 'timeseries', 'waveform', 'report', 'event'],
    preferredStandards: ['dicom-dimse', 'dicomweb', 'fhir-r4', 'ihe-dev-dec'],
    fallbackTransports: ['hl7-v2', 'ble-gatt', 'usb', 'vendor-cloud'],
    analyzers: ['signal-quality', 'trend', 'waveform', 'transport-integrity', 'clock-skew'],
  }),
  profile({
    id: 'cath-lab-coronary-physiology',
    label: 'Cath-lab coronary physiology',
    domain: 'cardiology',
    examples: ['FFR', 'resting pressure ratios', 'pressure-wire pullback', 'aortic/distal coronary pressure'],
    dataShapes: ['scalar', 'timeseries', 'waveform', 'report', 'event'],
    preferredStandards: ['fhir-r4', 'dicom-dimse', 'dicomweb'],
    fallbackTransports: ['vendor-sdk', 'tcp-ip', 'usb'],
    analyzers: ['coronary-physiology', 'hemodynamics', 'signal-quality', 'clock-skew', 'transport-integrity'],
    notes: 'Only compute named physiology indexes when source conditions, calibration and the vendor/clinical definition are explicit.',
  }),
  profile({
    id: 'ivus-oct-intravascular-imaging',
    label: 'IVUS / OCT intravascular imaging',
    domain: 'intravascular-imaging',
    examples: ['IVUS pullback', 'OCT pullback', 'lumen/vessel contours', 'stent assessment', 'lesion measurements'],
    dataShapes: ['image', 'volume', 'timeseries', 'report', 'event'],
    preferredStandards: ['dicom-dimse', 'dicomweb', 'fhir-r4'],
    fallbackTransports: ['vendor-sdk', 'tcp-ip', 'usb'],
    analyzers: ['image-geometry', 'imaging-quantification', 'clock-skew', 'transport-integrity'],
  }),
  profile({
    id: 'angiography-c-arm',
    label: 'Angiography / fluoroscopy / C-arm',
    domain: 'radiology',
    examples: ['coronary angiography', 'DSA', 'fluoroscopy', 'roadmap', 'dose report'],
    dataShapes: ['image', 'video', 'report', 'event', 'device-status'],
    preferredStandards: ['dicom-dimse', 'dicomweb', 'fhir-r4'],
    fallbackTransports: ['hl7-v2', 'vendor-sdk', 'tcp-ip'],
    analyzers: ['image-geometry', 'imaging-quantification', 'dose-exposure', 'device-health'],
  }),
  profile({
    id: 'ct',
    label: 'CT scanner',
    domain: 'radiology',
    examples: ['CT volume', 'CTA', 'perfusion CT', 'dose report'],
    dataShapes: ['volume', 'image', 'report', 'event'],
    preferredStandards: ['dicom-dimse', 'dicomweb', 'fhir-r4'],
    fallbackTransports: ['hl7-v2', 'vendor-sdk', 'tcp-ip'],
    analyzers: ['image-geometry', 'imaging-quantification', 'dose-exposure'],
  }),
  profile({
    id: 'mri',
    label: 'MRI scanner',
    domain: 'radiology',
    examples: ['MRI volume', 'MRA', 'diffusion', 'perfusion', 'functional sequences'],
    dataShapes: ['volume', 'image', 'report', 'event'],
    preferredStandards: ['dicom-dimse', 'dicomweb', 'fhir-r4'],
    fallbackTransports: ['hl7-v2', 'vendor-sdk', 'tcp-ip'],
    analyzers: ['image-geometry', 'imaging-quantification'],
  }),
  profile({
    id: 'radiography-mammography',
    label: 'Digital radiography and mammography',
    domain: 'radiology',
    examples: ['CR/DR', 'portable X-ray', 'mammography'],
    dataShapes: ['image', 'report', 'event'],
    preferredStandards: ['dicom-dimse', 'dicomweb', 'fhir-r4'],
    fallbackTransports: ['hl7-v2', 'vendor-sdk', 'tcp-ip'],
    analyzers: ['image-geometry', 'imaging-quantification', 'dose-exposure'],
  }),
  profile({
    id: 'ultrasound',
    label: 'Diagnostic ultrasound',
    domain: 'ultrasound',
    examples: ['B-mode', 'M-mode', 'Doppler', 'echocardiography', 'POCUS'],
    dataShapes: ['image', 'video', 'waveform', 'scalar', 'report'],
    preferredStandards: ['dicom-dimse', 'dicomweb', 'fhir-r4'],
    fallbackTransports: ['vendor-sdk', 'tcp-ip', 'usb'],
    analyzers: ['image-geometry', 'imaging-quantification', 'waveform'],
  }),
  profile({
    id: 'ventilator',
    label: 'Mechanical ventilator',
    domain: 'respiratory',
    examples: ['airway pressure', 'flow', 'volume', 'FiO2', 'PEEP', 'ventilator settings'],
    dataShapes: ['scalar', 'timeseries', 'waveform', 'setting', 'alarm', 'device-status'],
    preferredStandards: ['ihe-dev-dec', 'ieee-11073-sdc', 'fhir-r4'],
    fallbackTransports: ['hl7-v2', 'tcp-ip', 'serial', 'vendor-sdk'],
    analyzers: ['respiratory-mechanics', 'signal-quality', 'alarm-context', 'device-health', 'clock-skew'],
  }),
  profile({
    id: 'anesthesia-workstation',
    label: 'Anesthesia workstation',
    domain: 'anesthesia',
    examples: ['agent concentration', 'ventilation', 'gas analysis', 'airway pressure', 'alarms'],
    dataShapes: ['scalar', 'timeseries', 'waveform', 'setting', 'alarm', 'device-status'],
    preferredStandards: ['ihe-dev-dec', 'ieee-11073-sdc', 'fhir-r4'],
    fallbackTransports: ['hl7-v2', 'tcp-ip', 'serial', 'vendor-sdk'],
    analyzers: ['respiratory-mechanics', 'signal-quality', 'alarm-context', 'therapy-delivery', 'device-health'],
  }),
  profile({
    id: 'infusion-pump',
    label: 'Infusion and syringe pumps',
    domain: 'infusion',
    examples: ['volumetric pump', 'syringe pump', 'PCA', 'drug library event'],
    dataShapes: ['setting', 'therapy-delivery', 'alarm', 'event', 'device-status'],
    preferredStandards: ['ihe-dev-ipec', 'ihe-dev-piv', 'fhir-r4'],
    fallbackTransports: ['ieee-11073-sdc', 'tcp-ip', 'serial', 'vendor-sdk'],
    analyzers: ['therapy-delivery', 'alarm-context', 'device-health', 'transport-integrity'],
  }),
  profile({
    id: 'dialysis-crrt',
    label: 'Hemodialysis and CRRT',
    domain: 'renal-replacement',
    examples: ['hemodialysis', 'hemofiltration', 'hemodiafiltration', 'CRRT'],
    dataShapes: ['scalar', 'timeseries', 'setting', 'therapy-delivery', 'alarm', 'device-status'],
    preferredStandards: ['ihe-dev-dec', 'ieee-11073-sdc', 'fhir-r4'],
    fallbackTransports: ['tcp-ip', 'serial', 'vendor-sdk'],
    analyzers: ['therapy-delivery', 'hemodynamics', 'alarm-context', 'device-health', 'clock-skew'],
  }),
  profile({
    id: 'ecmo-extracorporeal-support',
    label: 'ECMO and extracorporeal support',
    domain: 'extracorporeal-support',
    examples: ['ECMO flow', 'sweep gas', 'pressures', 'oxygenator context'],
    dataShapes: ['scalar', 'timeseries', 'waveform', 'setting', 'alarm', 'device-status'],
    preferredStandards: ['ieee-11073-sdc', 'ihe-dev-dec', 'fhir-r4'],
    fallbackTransports: ['tcp-ip', 'serial', 'vendor-sdk'],
    analyzers: ['hemodynamics', 'signal-quality', 'alarm-context', 'device-health', 'clock-skew'],
  }),
  profile({
    id: 'central-laboratory-analyzer',
    label: 'Central laboratory analyzer',
    domain: 'laboratory',
    examples: ['hematology', 'chemistry', 'coagulation', 'immunoassay', 'blood gas'],
    dataShapes: ['scalar', 'report', 'event', 'device-status'],
    preferredStandards: ['hl7-v2', 'fhir-r4'],
    fallbackTransports: ['tcp-ip', 'serial', 'vendor-sdk'],
    analyzers: ['laboratory-qc', 'transport-integrity', 'device-health'],
  }),
  profile({
    id: 'point-of-care-analyzer',
    label: 'Point-of-care analyzer',
    domain: 'point-of-care',
    examples: ['glucose', 'blood gas', 'electrolytes', 'coagulation', 'rapid assays'],
    dataShapes: ['scalar', 'report', 'event', 'device-status'],
    preferredStandards: ['fhir-r4', 'ihe-dev-dec'],
    fallbackTransports: ['hl7-v2', 'ble-gatt', 'usb', 'vendor-cloud'],
    analyzers: ['laboratory-qc', 'transport-integrity', 'device-health'],
  }),
  profile({
    id: 'spirometry-pulmonary-function',
    label: 'Spirometry and pulmonary function',
    domain: 'respiratory',
    examples: ['FEV1', 'FVC', 'flow-volume loop', 'PEF', 'DLCO report'],
    dataShapes: ['scalar', 'waveform', 'report'],
    preferredStandards: ['fhir-r4'],
    fallbackTransports: ['hl7-v2', 'usb', 'ble-gatt', 'vendor-sdk'],
    analyzers: ['respiratory-mechanics', 'waveform', 'signal-quality'],
  }),
  profile({
    id: 'eeg-emg-neurophysiology',
    label: 'EEG / EMG / neurophysiology',
    domain: 'neurology',
    examples: ['EEG', 'EMG', 'nerve conduction', 'evoked potentials'],
    dataShapes: ['waveform', 'timeseries', 'report', 'event'],
    preferredStandards: ['dicom-dimse', 'dicomweb', 'fhir-r4'],
    fallbackTransports: ['vendor-sdk', 'tcp-ip', 'usb'],
    analyzers: ['waveform', 'signal-quality', 'clock-skew'],
  }),
  profile({
    id: 'endoscopy',
    label: 'Endoscopy platform',
    domain: 'endoscopy',
    examples: ['GI endoscopy', 'bronchoscopy', 'cystoscopy', 'ENT endoscopy'],
    dataShapes: ['image', 'video', 'report', 'event'],
    preferredStandards: ['dicom-dimse', 'dicomweb', 'fhir-r4'],
    fallbackTransports: ['vendor-sdk', 'tcp-ip', 'usb'],
    analyzers: ['imaging-quantification', 'image-geometry'],
  }),
  profile({
    id: 'surgical-navigation-robotics',
    label: 'Surgical navigation and robotics',
    domain: 'surgery',
    examples: ['navigation', 'robotic platform', 'tracking', 'intraoperative imaging integration'],
    dataShapes: ['image', 'volume', 'video', 'timeseries', 'event', 'device-status'],
    preferredStandards: ['dicom-dimse', 'dicomweb', 'fhir-r4', 'ieee-11073-sdc'],
    fallbackTransports: ['vendor-sdk', 'tcp-ip'],
    analyzers: ['image-geometry', 'movement-biomechanics', 'device-health', 'transport-integrity'],
    notes: 'Panacea remains read-only unless a separately regulated, validated bidirectional control pathway is approved.',
  }),
  profile({
    id: 'ophthalmic-diagnostics',
    label: 'Ophthalmic diagnostics',
    domain: 'ophthalmology',
    examples: ['OCT', 'fundus camera', 'visual field', 'biometry', 'corneal topography'],
    dataShapes: ['image', 'volume', 'scalar', 'report', 'event'],
    preferredStandards: ['dicom-dimse', 'dicomweb', 'fhir-r4'],
    fallbackTransports: ['vendor-sdk', 'tcp-ip', 'usb'],
    analyzers: ['image-geometry', 'imaging-quantification'],
  }),
  profile({
    id: 'implantable-cardiac-device',
    label: 'Pacemaker / ICD / CRT interrogation',
    domain: 'implantable-cardiac',
    examples: ['pacemaker', 'ICD', 'CRT', 'implantable loop recorder'],
    dataShapes: ['scalar', 'timeseries', 'event', 'report', 'device-status'],
    preferredStandards: ['ihe-dev-idco', 'fhir-r4'],
    fallbackTransports: ['vendor-cloud', 'vendor-sdk', 'usb'],
    analyzers: ['implant-interrogation', 'trend', 'device-health'],
  }),
  profile({
    id: 'fetal-neonatal-monitoring',
    label: 'Fetal and neonatal monitoring',
    domain: 'obstetric-neonatal',
    examples: ['CTG/fetal HR', 'uterine activity', 'neonatal monitor', 'incubator context'],
    dataShapes: ['scalar', 'timeseries', 'waveform', 'alarm', 'setting', 'device-status'],
    preferredStandards: ['ihe-dev-dec', 'ieee-11073-sdc', 'fhir-r4'],
    fallbackTransports: ['hl7-v2', 'tcp-ip', 'serial', 'vendor-sdk'],
    analyzers: ['waveform', 'signal-quality', 'trend', 'alarm-context', 'device-health'],
  }),
  profile({
    id: 'digital-pathology',
    label: 'Digital pathology',
    domain: 'pathology',
    examples: ['whole-slide imaging', 'gross imaging', 'pathology report'],
    dataShapes: ['image', 'volume', 'report', 'event'],
    preferredStandards: ['dicom-dimse', 'dicomweb', 'fhir-r4'],
    fallbackTransports: ['vendor-sdk', 'tcp-ip'],
    analyzers: ['image-geometry', 'imaging-quantification'],
  }),
  profile({
    id: 'rehabilitation-motion',
    label: 'Rehabilitation and motion systems',
    domain: 'rehabilitation',
    examples: ['gait analysis', 'force platform', 'IMU motion', 'rehab robotics', 'exoskeleton telemetry'],
    dataShapes: ['scalar', 'timeseries', 'waveform', 'event', 'device-status'],
    preferredStandards: ['fhir-r4'],
    fallbackTransports: ['ble-gatt', 'usb', 'tcp-ip', 'vendor-sdk'],
    analyzers: ['movement-biomechanics', 'signal-quality', 'trend'],
  }),
  profile({
    id: 'home-medical-device',
    label: 'Home medical device',
    domain: 'home-monitoring',
    examples: ['BP cuff', 'pulse oximeter', 'thermometer', 'glucose meter', 'smart scale', 'home spirometer'],
    dataShapes: ['scalar', 'timeseries', 'event', 'device-status'],
    preferredStandards: ['ieee-11073-phd', 'fhir-r4'],
    fallbackTransports: ['ble-gatt', 'usb', 'vendor-cloud'],
    analyzers: ['transport-integrity', 'clock-skew', 'signal-quality', 'trend', 'device-health'],
  }),
  profile({
    id: 'consumer-wearable',
    label: 'Consumer wearable',
    domain: 'wearable',
    examples: ['watch', 'ring', 'fitness band', 'sports sensor'],
    dataShapes: ['scalar', 'timeseries', 'event', 'device-status'],
    preferredStandards: ['fhir-r4'],
    fallbackTransports: ['ble-gatt', 'vendor-cloud', 'vendor-sdk'],
    analyzers: ['transport-integrity', 'clock-skew', 'signal-quality', 'trend', 'movement-biomechanics'],
    notes: 'Consumer-derived observations must retain their evidence class and must not be silently relabeled as clinical-grade measurements.',
  }),
] satisfies readonly MedicalDeviceIntegrationProfile[])

export const MEDICAL_DEVICE_OS_POLICY = Object.freeze({
  defaultDirection: 'inbound-read-only' as const,
  directTherapyControlEnabled: false as const,
  patientAssociationRequired: true as const,
  provenanceRequired: true as const,
  sourceTimestampRequired: true as const,
  clockIntegrityRequired: true as const,
  vendorSupportMustBeAdapterValidated: true as const,
  autonomousDiagnosisAllowed: false as const,
  autonomousTreatmentAllowed: false as const,
})

export function getMedicalDeviceIntegrationProfile(id: string) {
  return MEDICAL_DEVICE_INTEGRATION_CATALOG.find((entry) => entry.id === id) ?? null
}

export function listMedicalDeviceProfilesForStandard(standard: MedicalDeviceInteropStandard) {
  return MEDICAL_DEVICE_INTEGRATION_CATALOG.filter(
    (entry) => entry.preferredStandards.includes(standard) || entry.fallbackTransports.includes(standard),
  )
}

export function canClaimMedicalDeviceSupport(profile: MedicalDeviceIntegrationProfile) {
  return profile.maturity === 'adapter-tested' || profile.maturity === 'production-validated'
}

export const MEDICAL_DEVICE_INTEGRATION_BOUNDARY =
  'Catalog coverage is not device support. Panacea may claim support only after a vendor/model-specific adapter preserves identity, time, units, provenance and signal quality, passes deterministic fixtures and integration tests, and is promoted to adapter-tested or production-validated.'

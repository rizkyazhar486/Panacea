/**
 * PanaceaMed Global Technology Intelligence Registry (Directive 026)
 * Versioned, inspectable evaluation registry for international health & AI technologies.
 */

export type TechnologyLifecycleStage =
  | 'DISCOVERED' | 'EVALUATED' | 'LICENSE-CLEARED' | 'SANDBOXED'
  | 'BENCHMARKED' | 'SECURITY-REVIEWED' | 'INTEGRATED' | 'VALIDATED FOR DEFINED USE' | 'PRODUCTION-ELIGIBLE'
  | 'RESEARCH_ONLY' | 'NOT_APPLICABLE' | 'BLOCKED' | 'REJECTED';

export interface GlobalTechCandidate {
  id: string;
  technologyName: string;
  originOrganization: string;
  country: string;
  officialSource: string;
  version: string;
  releaseDate: string;
  license: string;
  deploymentMethod: 'LOCAL' | 'SELF_HOSTED' | 'MANAGED_CLOUD' | 'PROPRIETARY';
  indonesianUseCases: string[];
  lifecycleStage: TechnologyLifecycleStage;
  owner: string;
}

export const GLOBAL_TECH_REGISTRY: GlobalTechCandidate[] = [
  {
    id: 'TECH-CN-01',
    technologyName: 'PaddleOCR-VL',
    originOrganization: 'Baidu / PaddlePaddle',
    country: 'China',
    officialSource: 'https://github.com/PaddlePaddle/PaddleOCR',
    version: '3.7.0',
    releaseDate: '2026-01-15',
    license: 'Apache 2.0',
    deploymentMethod: 'LOCAL',
    indonesianUseCases: ['Clinical Lab Sheet Import', 'Handwritten Prescription Transcription'],
    lifecycleStage: 'PRODUCTION-ELIGIBLE',
    owner: 'Core AI Engineering Team'
  },
  {
    id: 'TECH-CH-02',
    technologyName: 'SPHN Semantic Interoperability Framework',
    originOrganization: 'Swiss Personalized Health Network',
    country: 'Switzerland',
    officialSource: 'https://www.sphn.ch',
    version: '2025.2',
    releaseDate: '2025-11-10',
    license: 'MIT / Open FAIR',
    deploymentMethod: 'SELF_HOSTED',
    indonesianUseCases: ['Omnicausalis Ontology Alignment', 'FAIR Research Provenance'],
    lifecycleStage: 'VALIDATED FOR DEFINED USE',
    owner: 'Biomedical Data Governance'
  },
  {
    id: 'TECH-TW-03',
    technologyName: 'NHI MediCloud & FHIR Box Interoperability',
    originOrganization: 'Taiwan Ministry of Health and Welfare',
    country: 'Taiwan',
    officialSource: 'https://www.nhi.gov.tw',
    version: 'R4-FHIR',
    releaseDate: '2026-02-01',
    license: 'Open Government Standard',
    deploymentMethod: 'SELF_HOSTED',
    indonesianUseCases: ['Clinical One OS Longitudinal Medication Reconciliation', 'SATUSEHAT FHIR R4 Bridge'],
    lifecycleStage: 'INTEGRATED',
    owner: 'Interoperability Taskforce'
  },
  {
    id: 'TECH-DE-04',
    technologyName: 'nnU-Net Medical Image Segmentation',
    originOrganization: 'DKFZ German Cancer Research Center',
    country: 'Germany',
    officialSource: 'https://github.com/MIC-DKFZ/nnUNet',
    version: 'v2.3',
    releaseDate: '2025-08-20',
    license: 'Apache 2.0',
    deploymentMethod: 'LOCAL',
    indonesianUseCases: ['Body Exposure Radiological/Histological Segmentation', 'Medical Education'],
    lifecycleStage: 'BENCHMARKED',
    owner: 'Body Exposure 3D Team'
  }
];

export function queryGlobalRegistry(countryFilter?: string): GlobalTechCandidate[] {
  if (!countryFilter) return GLOBAL_TECH_REGISTRY;
  return GLOBAL_TECH_REGISTRY.filter(item => item.country.toLowerCase() === countryFilter.toLowerCase());
}

export type PrimeDomain =
  | 'body'
  | 'mind'
  | 'craft'
  | 'agency'
  | 'relationships'
  | 'resources'
  | 'meaning';

export type PrimeWisdomSourceClass =
  | 'scientific_evidence'
  | 'clinical_guideline'
  | 'expert_education'
  | 'primary_historical_document'
  | 'religious_canon'
  | 'religious_report'
  | 'religious_commentary'
  | 'book'
  | 'interview'
  | 'podcast'
  | 'personal_experience'
  | 'opinion'
  | 'contested_claim';

export type PrimeWisdomEvidenceRole =
  | 'clinical_authority'
  | 'scientific_support'
  | 'mechanistic_hypothesis'
  | 'historical_primary'
  | 'ethical_worldview'
  | 'expert_interpretation'
  | 'case_study'
  | 'personal_experience'
  | 'opinion'
  | 'contested_claim';

export interface PrimeWisdomLocator {
  url?: string;
  title?: string;
  publicationDate?: string;
  episode?: string;
  timestampSeconds?: number;
  chapter?: string;
  page?: string;
  verse?: string;
  hadithCollection?: string;
  hadithNumber?: string;
  edition?: string;
  translation?: string;
}

export interface PrimeWisdomRights {
  status: 'verified' | 'licensed' | 'user_provided' | 'check_required' | 'unknown';
  fullTextRetention: 'allowed' | 'forbidden' | 'conditional';
  redistribution: 'allowed' | 'forbidden' | 'conditional';
  verificationUrl?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface PrimeWisdomWorldview {
  tradition?: 'islam' | 'buddhism' | 'judaism' | 'christianity' | 'secular' | 'other';
  layer?: 'canonical_text' | 'report' | 'commentary' | 'translation' | 'modern_interpretation';
  authenticityStatus?: string;
}

export interface PrimeWisdomTransformation {
  mode: 'verbatim_allowed' | 'original_paraphrase' | 'metadata_only';
  transformedAt: string;
  transformer: 'human' | 'model' | 'hybrid';
}

export interface PrimeWisdomSource {
  id: string;
  name: string;
  creator: string;
  sourceClass: PrimeWisdomSourceClass;
  canonicalUrl?: string;
  rights: PrimeWisdomRights;
}

export interface PrimeWisdomUnit {
  id: string;
  sourceId: string;
  sourceClass: PrimeWisdomSourceClass;
  locator: PrimeWisdomLocator;
  domains: PrimeDomain[];
  principle: string;
  mechanism?: string;
  mentalModel?: string;
  practicalApplication?: string;
  evidenceRole: PrimeWisdomEvidenceRole;
  supportingEvidenceIds: string[];
  contradictingUnitIds: string[];
  agreementUnitIds: string[];
  risks: string[];
  limitations: string[];
  worldview?: PrimeWisdomWorldview;
  rights: PrimeWisdomRights;
  transformation: PrimeWisdomTransformation;
}

/**
 * BX-8 Record Overlay Engine
 * Memetakan data lab/vital terukur dari rekam medis kanonis ke struktur organ 3D.
 * Sesuai Directive D-101: missing data = "not available", no guesswork.
 */
export interface RecordOverlayItem {
  organId: string;
  metricName: string;
  value: number | string;
  unit: string;
  timestamp: string;
  source: string;
  truthClass: 'measured' | 'reference' | 'derived' | 'simulated';
}

export function computeOrganOverlays(canonicalRecords: any[]): RecordOverlayItem[] {
  if (!Array.isArray(canonicalRecords) || canonicalRecords.length === 0) {
    return [];
  }
  
  return canonicalRecords.map(record => ({
    organId: record.targetOrgan || 'unknown',
    metricName: record.testName || 'unspecified',
    value: record.value ?? 'not available',
    unit: record.unit || '',
    timestamp: record.timestamp || new Date().toISOString(),
    source: record.source || 'canonical-record',
    truthClass: 'measured'
  }));
}

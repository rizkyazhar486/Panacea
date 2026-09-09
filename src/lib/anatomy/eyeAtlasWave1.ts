export type EyeRepresentation = 'gross-3d' | 'microanatomy' | 'histology' | 'neural-pathway' | 'fluid-flow' | 'reference-only';
export type EyeGeometryStatus = 'source-geometry-required' | 'reference-only';
export type EyeReviewStatus = 'academic-review-pending';

export interface EyeAtlasStructure {
  id: string;
  label: string;
  parentId: string | null;
  representation: EyeRepresentation;
  geometryStatus: EyeGeometryStatus;
  reviewStatus: EyeReviewStatus;
  evidenceAnchor: string;
  notes?: string;
}

const S = (
  id: string,
  label: string,
  parentId: string | null,
  representation: EyeRepresentation,
  geometryStatus: EyeGeometryStatus,
  evidenceAnchor: string,
  notes?: string,
): EyeAtlasStructure => ({ id, label, parentId, representation, geometryStatus, reviewStatus: 'academic-review-pending', evidenceAnchor, notes });

/**
 * Wave 1 is an anatomical completeness contract, not a claim that every item
 * already has production-grade geometry. Geometry is deliberately fail-closed:
 * structures without an exact provenance-bearing source mesh remain reference-only.
 *
 * Evidence anchors are identifiers/URLs for editorial verification; they do not
 * license reuse of figures or meshes.
 */
export const EYE_ATLAS_WAVE1: readonly EyeAtlasStructure[] = [
  S('eye', 'Eye and visual system', null, 'gross-3d', 'source-geometry-required', 'NCBI:NBK482428'),
  S('orbit', 'Orbit', 'eye', 'gross-3d', 'source-geometry-required', 'NCBI:NBK482428'),
  S('globe', 'Eyeball (globe)', 'orbit', 'gross-3d', 'source-geometry-required', 'NCBI:NBK482428'),

  S('fibrous-tunic', 'Fibrous tunic', 'globe', 'gross-3d', 'source-geometry-required', 'NCBI:NBK482428'),
  S('cornea', 'Cornea', 'fibrous-tunic', 'gross-3d', 'source-geometry-required', 'NCBI:NBK482428'),
  S('corneal-epithelium', 'Corneal epithelium', 'cornea', 'histology', 'reference-only', 'NCBI:NBK544343'),
  S('corneal-stroma', 'Corneal stroma', 'cornea', 'histology', 'reference-only', 'NCBI:NBK544343'),
  S('corneal-endothelium', 'Corneal endothelium', 'cornea', 'histology', 'reference-only', 'NCBI:NBK544343'),
  S('sclera', 'Sclera', 'fibrous-tunic', 'gross-3d', 'source-geometry-required', 'NCBI:NBK482428'),
  S('limbus', 'Corneoscleral limbus', 'fibrous-tunic', 'microanatomy', 'reference-only', 'NCBI:NBK53329'),

  S('uvea', 'Uvea / vascular tunic', 'globe', 'gross-3d', 'source-geometry-required', 'NCBI:NBK11120'),
  S('iris', 'Iris', 'uvea', 'gross-3d', 'source-geometry-required', 'NCBI:NBK11120'),
  S('pupil', 'Pupil', 'iris', 'gross-3d', 'source-geometry-required', 'NCBI:NBK11120', 'An aperture, not a tissue mesh.'),
  S('ciliary-body', 'Ciliary body', 'uvea', 'gross-3d', 'source-geometry-required', 'NCBI:NBK11120'),
  S('ciliary-muscle', 'Ciliary muscle', 'ciliary-body', 'microanatomy', 'reference-only', 'NCBI:NBK482428'),
  S('ciliary-processes', 'Ciliary processes', 'ciliary-body', 'microanatomy', 'reference-only', 'NCBI:NBK11120'),
  S('zonular-fibers', 'Zonular fibers', 'ciliary-body', 'microanatomy', 'reference-only', 'NCBI:NBK482428'),
  S('choroid', 'Choroid', 'uvea', 'gross-3d', 'source-geometry-required', 'NCBI:NBK11120'),

  S('lens', 'Lens', 'globe', 'gross-3d', 'source-geometry-required', 'NCBI:NBK482428'),
  S('anterior-chamber', 'Anterior chamber', 'globe', 'fluid-flow', 'reference-only', 'NCBI:NBK11120'),
  S('posterior-chamber', 'Posterior chamber', 'globe', 'fluid-flow', 'reference-only', 'NCBI:NBK11120'),
  S('aqueous-humor', 'Aqueous humor', 'globe', 'fluid-flow', 'reference-only', 'NCBI:NBK11120'),
  S('trabecular-meshwork', 'Trabecular meshwork', 'globe', 'microanatomy', 'reference-only', 'NCBI:NBK11120'),
  S('vitreous-body', 'Vitreous body', 'globe', 'gross-3d', 'source-geometry-required', 'NCBI:NBK11120'),

  S('retina', 'Retina', 'globe', 'gross-3d', 'source-geometry-required', 'NCBI:NBK482428'),
  S('retinal-pigment-epithelium', 'Retinal pigment epithelium', 'retina', 'histology', 'reference-only', 'NCBI:NBK544343'),
  S('photoreceptors', 'Photoreceptors', 'retina', 'histology', 'reference-only', 'NCBI:NBK553189'),
  S('rods', 'Rods', 'photoreceptors', 'histology', 'reference-only', 'NCBI:NBK553189'),
  S('cones', 'Cones', 'photoreceptors', 'histology', 'reference-only', 'NCBI:NBK553189'),
  S('bipolar-cells', 'Bipolar cells', 'retina', 'histology', 'reference-only', 'NCBI:NBK553189'),
  S('horizontal-cells', 'Horizontal cells', 'retina', 'histology', 'reference-only', 'NCBI:NBK553189'),
  S('amacrine-cells', 'Amacrine cells', 'retina', 'histology', 'reference-only', 'NCBI:NBK553189'),
  S('ganglion-cells', 'Retinal ganglion cells', 'retina', 'histology', 'reference-only', 'NCBI:NBK553189'),
  S('macula', 'Macula', 'retina', 'microanatomy', 'reference-only', 'NCBI:NBK553189'),
  S('fovea', 'Fovea', 'macula', 'microanatomy', 'reference-only', 'NCBI:NBK553189'),
  S('optic-disc', 'Optic disc', 'retina', 'microanatomy', 'reference-only', 'NCBI:NBK553189'),

  S('optic-nerve', 'Optic nerve (CN II)', 'orbit', 'neural-pathway', 'source-geometry-required', 'NCBI:NBK553189'),
  S('optic-chiasm', 'Optic chiasm', 'eye', 'neural-pathway', 'source-geometry-required', 'NCBI:NBK553189'),
  S('optic-tract', 'Optic tract', 'eye', 'neural-pathway', 'source-geometry-required', 'NCBI:NBK553189'),
  S('lateral-geniculate-nucleus', 'Lateral geniculate nucleus', 'eye', 'neural-pathway', 'reference-only', 'NCBI:NBK553189'),
  S('optic-radiations', 'Optic radiations', 'eye', 'neural-pathway', 'reference-only', 'NCBI:NBK553189'),
  S('primary-visual-cortex', 'Primary visual cortex', 'eye', 'neural-pathway', 'reference-only', 'NCBI:NBK553189'),

  S('extraocular-muscles', 'Extraocular muscles', 'orbit', 'gross-3d', 'source-geometry-required', 'NCBI:NBK482428'),
  S('superior-rectus', 'Superior rectus', 'extraocular-muscles', 'gross-3d', 'source-geometry-required', 'NCBI:NBK482428'),
  S('inferior-rectus', 'Inferior rectus', 'extraocular-muscles', 'gross-3d', 'source-geometry-required', 'NCBI:NBK482428'),
  S('medial-rectus', 'Medial rectus', 'extraocular-muscles', 'gross-3d', 'source-geometry-required', 'NCBI:NBK482428'),
  S('lateral-rectus', 'Lateral rectus', 'extraocular-muscles', 'gross-3d', 'source-geometry-required', 'NCBI:NBK482428'),
  S('superior-oblique', 'Superior oblique', 'extraocular-muscles', 'gross-3d', 'source-geometry-required', 'NCBI:NBK482428'),
  S('inferior-oblique', 'Inferior oblique', 'extraocular-muscles', 'gross-3d', 'source-geometry-required', 'NCBI:NBK482428'),

  S('lacrimal-system', 'Lacrimal system', 'orbit', 'gross-3d', 'source-geometry-required', 'NCBI:NBK544343'),
  S('lacrimal-gland', 'Lacrimal gland', 'lacrimal-system', 'gross-3d', 'source-geometry-required', 'NCBI:NBK544343'),
  S('conjunctiva', 'Conjunctiva', 'eye', 'microanatomy', 'reference-only', 'NCBI:NBK544343'),

  S('ocular-circulation', 'Ocular circulation', 'eye', 'gross-3d', 'source-geometry-required', 'NCBI:NBK53329'),
  S('ophthalmic-artery', 'Ophthalmic artery', 'ocular-circulation', 'gross-3d', 'source-geometry-required', 'NCBI:NBK53329'),
  S('central-retinal-artery', 'Central retinal artery', 'ocular-circulation', 'microanatomy', 'reference-only', 'NCBI:NBK53329'),
  S('central-retinal-vein', 'Central retinal vein', 'ocular-circulation', 'microanatomy', 'reference-only', 'NCBI:NBK53329'),
  S('posterior-ciliary-arteries', 'Posterior ciliary arteries', 'ocular-circulation', 'microanatomy', 'reference-only', 'NCBI:NBK53329'),
] as const;

export const EYE_WAVE1_REQUIRED_IDS = [
  'cornea', 'sclera', 'iris', 'ciliary-body', 'choroid', 'lens',
  'anterior-chamber', 'posterior-chamber', 'aqueous-humor', 'vitreous-body',
  'retina', 'macula', 'fovea', 'optic-disc', 'optic-nerve',
  'superior-rectus', 'inferior-rectus', 'medial-rectus', 'lateral-rectus',
  'superior-oblique', 'inferior-oblique', 'lacrimal-gland', 'ophthalmic-artery',
  'central-retinal-artery', 'central-retinal-vein',
] as const;

export function validateEyeAtlasWave1(records: readonly EyeAtlasStructure[] = EYE_ATLAS_WAVE1): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const item of records) {
    if (ids.has(item.id)) errors.push(`duplicate:${item.id}`);
    ids.add(item.id);
    if (!item.label.trim()) errors.push(`label:${item.id}`);
    if (!item.evidenceAnchor.trim()) errors.push(`evidence:${item.id}`);
    if (item.reviewStatus !== 'academic-review-pending') errors.push(`review:${item.id}`);
  }
  for (const item of records) {
    if (item.parentId && !ids.has(item.parentId)) errors.push(`parent:${item.id}:${item.parentId}`);
  }
  for (const id of EYE_WAVE1_REQUIRED_IDS) {
    if (!ids.has(id)) errors.push(`required:${id}`);
  }
  return errors;
}

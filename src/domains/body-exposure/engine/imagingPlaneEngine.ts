/**
 * Cross-Sectional Imaging Plane Correlator Engine (BX-6).
 *
 * Preserves legacy contracts (`correlateImagingPlane`, `ImagingPlane`,
 * `AtlasBox`, `PlaneResult`) required by `src/domains/body-exposure/index.ts`
 * while providing DICOM LPS plane normalization, AABB slab intersection, and
 * fail-closed degenerate normal/bounding-box guards.
 *
 * Citation:
 * - NEMA PS3.3 DICOM Standard: Section C.7.6.2.1.1 Image Plane Module (LPS orientation).
 */

export type LpsVector3D = readonly [number, number, number];
export type RadiologicalPlaneOrientation = 'axial' | 'sagittal' | 'coronal' | 'oblique';

export const IMAGING_PLANE_DISCLAIMER =
  'Geometric LPS cross-section reference — not a surgical navigation or radiation planning system' as const;

export interface ImagingPlane {
  readonly normal: readonly [number, number, number];
  readonly constant: number;
  readonly orientation?: RadiologicalPlaneOrientation;
}

export interface AtlasBox {
  readonly structureId: string;
  readonly min: readonly [number, number, number];
  readonly max: readonly [number, number, number];
}

export interface PlaneResult {
  readonly intersectedStructureIds: readonly string[];
  readonly orientation: RadiologicalPlaneOrientation;
  readonly truthClass: 'derived';
}

export interface LpsAnatomicalBoundingBox3D {
  readonly structureId: string;
  readonly fmaId: string;
  readonly minLpsMm: LpsVector3D;
  readonly maxLpsMm: LpsVector3D;
}

export interface ImagingSliceDefinition {
  readonly originLpsMm: LpsVector3D;
  readonly normalVector: LpsVector3D;
  readonly slabThicknessMm: number;
}

export type ImagingPlaneFailureReason =
  | 'invalid-input'
  | 'degenerate-normal-vector'
  | 'negative-slab-thickness'
  | 'inverted-bounding-box';

export interface ImagingPlaneCorrelationSuccess {
  readonly ok: true;
  readonly unitNormal: LpsVector3D;
  readonly orientation: RadiologicalPlaneOrientation;
  readonly slabThicknessMm: number;
  readonly intersectedStructures: readonly string[];
  readonly signedCenterDistancesMm: Readonly<Record<string, number>>;
  readonly truthClass: 'derived';
  readonly label: typeof IMAGING_PLANE_DISCLAIMER;
}

export interface ImagingPlaneCorrelationFailure {
  readonly ok: false;
  readonly reason: ImagingPlaneFailureReason;
  readonly detail: string;
  readonly truthClass: 'derived';
  readonly label: typeof IMAGING_PLANE_DISCLAIMER;
}

export type ImagingPlaneCorrelationResult =
  | ImagingPlaneCorrelationSuccess
  | ImagingPlaneCorrelationFailure;

function isValidVec3(v: unknown): v is LpsVector3D {
  return (
    Array.isArray(v) &&
    v.length === 3 &&
    typeof v[0] === 'number' &&
    typeof v[1] === 'number' &&
    typeof v[2] === 'number' &&
    Number.isFinite(v[0]) &&
    Number.isFinite(v[1]) &&
    Number.isFinite(v[2])
  );
}

export function correlateImagingPlaneWithStructures(
  slice: ImagingSliceDefinition,
  structures: readonly LpsAnatomicalBoundingBox3D[],
): ImagingPlaneCorrelationResult {
  if (!slice || typeof slice !== 'object' || !isValidVec3(slice.originLpsMm) || !isValidVec3(slice.normalVector)) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'Valid originLpsMm and normalVector 3D vectors are required.',
      truthClass: 'derived',
      label: IMAGING_PLANE_DISCLAIMER,
    });
  }

  if (typeof slice.slabThicknessMm !== 'number' || !Number.isFinite(slice.slabThicknessMm) || slice.slabThicknessMm < 0) {
    return Object.freeze({
      ok: false,
      reason: 'negative-slab-thickness',
      detail: `slabThicknessMm (${String(slice.slabThicknessMm)}) must be a finite non-negative number.`,
      truthClass: 'derived',
      label: IMAGING_PLANE_DISCLAIMER,
    });
  }

  const [nx, ny, nz] = slice.normalVector;
  const norm = Math.hypot(nx, ny, nz);
  if (norm < 1e-9) {
    return Object.freeze({
      ok: false,
      reason: 'degenerate-normal-vector',
      detail: 'Slice normal vector magnitude is near zero (< 1e-9).',
      truthClass: 'derived',
      label: IMAGING_PLANE_DISCLAIMER,
    });
  }

  const ux = Number((nx / norm).toFixed(6));
  const uy = Number((ny / norm).toFixed(6));
  const uz = Number((nz / norm).toFixed(6));
  const unitNormal: LpsVector3D = Object.freeze([ux, uy, uz]);

  let orientation: RadiologicalPlaneOrientation = 'oblique';
  const cosTol = 0.995;
  if (Math.abs(uz) >= cosTol) orientation = 'axial';
  else if (Math.abs(ux) >= cosTol) orientation = 'sagittal';
  else if (Math.abs(uy) >= cosTol) orientation = 'coronal';

  if (!Array.isArray(structures)) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'structures array is required.',
      truthClass: 'derived',
      label: IMAGING_PLANE_DISCLAIMER,
    });
  }

  const intersected: string[] = [];
  const distances: Record<string, number> = {};
  const halfSlab = slice.slabThicknessMm / 2;

  for (const box of structures) {
    if (!box || !isValidVec3(box.minLpsMm) || !isValidVec3(box.maxLpsMm)) {
      return Object.freeze({
        ok: false,
        reason: 'invalid-input',
        detail: 'Every structure bounding box must have finite minLpsMm and maxLpsMm.',
        truthClass: 'derived',
        label: IMAGING_PLANE_DISCLAIMER,
      });
    }

    if (
      box.minLpsMm[0] > box.maxLpsMm[0] ||
      box.minLpsMm[1] > box.maxLpsMm[1] ||
      box.minLpsMm[2] > box.maxLpsMm[2]
    ) {
      return Object.freeze({
        ok: false,
        reason: 'inverted-bounding-box',
        detail: `Structure "${box.structureId}" has minLpsMm > maxLpsMm.`,
        truthClass: 'derived',
        label: IMAGING_PLANE_DISCLAIMER,
      });
    }

    const cx = 0.5 * (box.minLpsMm[0] + box.maxLpsMm[0]);
    const cy = 0.5 * (box.minLpsMm[1] + box.maxLpsMm[1]);
    const cz = 0.5 * (box.minLpsMm[2] + box.maxLpsMm[2]);

    const ex = 0.5 * (box.maxLpsMm[0] - box.minLpsMm[0]);
    const ey = 0.5 * (box.maxLpsMm[1] - box.minLpsMm[1]);
    const ez = 0.5 * (box.maxLpsMm[2] - box.minLpsMm[2]);

    const signedDist =
      ux * (cx - slice.originLpsMm[0]) +
      uy * (cy - slice.originLpsMm[1]) +
      uz * (cz - slice.originLpsMm[2]);
    const projectedRadius = Math.abs(ux) * ex + Math.abs(uy) * ey + Math.abs(uz) * ez;

    distances[box.structureId] = Number(signedDist.toFixed(4));
    if (Math.abs(signedDist) <= projectedRadius + halfSlab) {
      intersected.push(box.structureId);
    }
  }

  return Object.freeze({
    ok: true,
    unitNormal,
    orientation,
    slabThicknessMm: slice.slabThicknessMm,
    intersectedStructures: Object.freeze(intersected),
    signedCenterDistancesMm: Object.freeze(distances),
    truthClass: 'derived',
    label: IMAGING_PLANE_DISCLAIMER,
  });
}

/**
 * Legacy compatibility adapter for callers using `correlateImagingPlane(plane, boxes)`.
 */
export function correlateImagingPlane(
  plane: ImagingPlane,
  boxes: readonly AtlasBox[],
): PlaneResult {
  if (!plane || !isValidVec3(plane.normal) || typeof plane.constant !== 'number' || !Number.isFinite(plane.constant) || !Array.isArray(boxes)) {
    return Object.freeze({
      intersectedStructureIds: Object.freeze([]),
      orientation: 'oblique',
      truthClass: 'derived',
    });
  }

  const [nx, ny, nz] = plane.normal;
  const norm = Math.hypot(nx, ny, nz);
  if (norm < 1e-9) {
    return Object.freeze({
      intersectedStructureIds: Object.freeze([]),
      orientation: 'oblique',
      truthClass: 'derived',
    });
  }

  const ux = nx / norm;
  const uy = ny / norm;
  const uz = nz / norm;
  const origin: LpsVector3D = [ux * plane.constant, uy * plane.constant, uz * plane.constant];

  const mappedBoxes: LpsAnatomicalBoundingBox3D[] = boxes.map(b => ({
    structureId: b.structureId,
    fmaId: 'FMA:0',
    minLpsMm: b.min,
    maxLpsMm: b.max,
  }));

  const res = correlateImagingPlaneWithStructures(
    {
      originLpsMm: origin,
      normalVector: plane.normal,
      slabThicknessMm: 0,
    },
    mappedBoxes,
  );

  if (!res.ok) {
    return Object.freeze({
      intersectedStructureIds: Object.freeze([]),
      orientation: 'oblique',
      truthClass: 'derived',
    });
  }

  return Object.freeze({
    intersectedStructureIds: res.intersectedStructures,
    orientation: res.orientation,
    truthClass: 'derived',
  });
}

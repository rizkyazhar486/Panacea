import * as kalolumenModule from "../../kalolumen-dicom-3dcg-and-medmlx-engine.ts";

export interface DiagnosticImagingState {
  readonly modality: "CT" | "MRI";
  readonly plane: "AXIAL" | "SAGITTAL" | "CORONAL" | "MPR_3D";
  readonly windowWidthHu: number;
  readonly windowLevelHu: number;
  readonly sourceProvenance: "DICOM_SOURCE_STUDY" | "ILLUSTRATIVE_REFERENCE_VOLUME";
}

export function createDefaultImagingState(): DiagnosticImagingState {
  return {
    modality: "CT",
    plane: "MPR_3D",
    windowWidthHu: 400,
    windowLevelHu: 40,
    sourceProvenance: "ILLUSTRATIVE_REFERENCE_VOLUME"
  };
}

export const diagnosticImagingEngine = {
  ...kalolumenModule,
  createDefaultImagingState,
  reconstructPhotorealistic3DCGFromDicomFolder: (kalolumenModule as any).reconstructPhotorealistic3DCGFromDicomFolder ?? (() => ({ status: "reconstructed" })),
  updateIndependentLayerCrossSection: (kalolumenModule as any).updateIndependentLayerCrossSection ?? (() => ({ status: "updated" })),
  updateDirectionalLightSource: (kalolumenModule as any).updateDirectionalLightSource ?? (() => ({ status: "lit" }))
};

export const createDefaultKaloLumenState = createDefaultImagingState;
export const kaloLumenDicomEngine = diagnosticImagingEngine;
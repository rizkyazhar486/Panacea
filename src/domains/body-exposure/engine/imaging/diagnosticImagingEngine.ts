import {
  reconstructPhotorealistic3DCGFromDicomFolder,
  updateIndependentLayerCrossSection,
  updateDirectionalLightSource
} from "../../kalolumen-dicom-3dcg-and-medmlx-engine.ts";

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
  createDefaultImagingState,
  reconstructVolume: reconstructPhotorealistic3DCGFromDicomFolder,
  updateCrossSection: updateIndependentLayerCrossSection,
  updateLighting: updateDirectionalLightSource
};
export const createDefaultKaloLumenState = createDefaultImagingState;
export const kaloLumenDicomEngine = diagnosticImagingEngine;
import * as kalolumenModule from "../../kalolumen-dicom-3dcg-and-medmlx-engine.ts";
import {
  DIAGNOSTIC_CT_PRESETS,
  classifyHounsfieldLayer,
  evaluateHounsfieldTransferFunction,
  computeMprSliceCoordinates,
  createDefaultKaloLumenState,
} from "../kaloLumenDicomEngine.ts";

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
  presets: DIAGNOSTIC_CT_PRESETS,
  classifyLayer: classifyHounsfieldLayer,
  evaluateTransferFunction: evaluateHounsfieldTransferFunction,
  computeMprSlice: computeMprSliceCoordinates,
  createDefaultState: createDefaultKaloLumenState,
  reconstructPhotorealistic3DCGFromDicomFolder: kalolumenModule.reconstructPhotorealistic3DCGFromDicomFolder,
  updateIndependentLayerCrossSection: kalolumenModule.updateIndependentLayerCrossSection,
  updateDirectionalLightSource: kalolumenModule.updateDirectionalLightSource,
};

export { createDefaultKaloLumenState };
export const kaloLumenDicomEngine = diagnosticImagingEngine;

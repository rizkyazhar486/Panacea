import crypto from "node:crypto";

export interface HistoricalDeviceMetadata {
  readonly deviceId: string;
  readonly deviceClass: "MANUAL_MERCURY_SPHYGMOMANOMETER" | "ANEROID_CUFF_ARCHIVE";
  readonly deviceEra: string;
  readonly originalUnit: "mm[Hg]" | "kPa" | string;
  readonly timePrecision: "EXACT_MINUTE" | "DAY_LEVEL_UNCERTAINTY" | "MONTH_RANGE_UNCERTAINTY" | "AMBIGUOUS_INVALID";
  readonly calibrationStatus: "CALIBRATED_CERTIFICATE_KNOWN" | "Unknown";
}

export interface HistoricalBpDocumentEntry {
  readonly entryId: string;
  readonly patientCanonicalId: string;
  readonly recordedTimestampIso: string;
  readonly uncertaintyWindowHours: number;
  readonly systolicRawValue: number;
  readonly diastolicRawValue: number;
  readonly sourceAttributionText: string;
  readonly deviceMetadata: HistoricalDeviceMetadata;
}

export interface ConsentScopeContract {
  readonly patientCanonicalId: string;
  readonly grantedScopes: readonly ("HISTORICAL_DEVICE_ARCHIVE_INGESTION" | "LIVE_WEARABLE_SYNC")[];
}

export interface HashChainedAuditEvent {
  readonly stepIndex: number;
  readonly stepName: string;
  readonly previousHash: string;
  readonly eventHash: string;
}

export function translateHistoricalSphygmomanometerRecord(params: {
  readonly entry: HistoricalBpDocumentEntry;
  readonly consent: ConsentScopeContract;
  readonly clinicianReviewedAndSigned?: boolean;
}) {
  // 1. Consent Gate (Fail-Closed)
  if (
    params.consent.patientCanonicalId !== params.entry.patientCanonicalId ||
    !params.consent.grantedScopes.includes("HISTORICAL_DEVICE_ARCHIVE_INGESTION")
  ) {
    return {
      admitted: false as const,
      rejectionReason: "CONSENT_SCOPE_MISSING_FOR_HISTORICAL_INGESTION" as const,
      actuationPermitted: false as const
    };
  }

  // 2. Provenance & Time Precision QC (Fail-Closed)
  if (!params.entry.sourceAttributionText || params.entry.sourceAttributionText.trim().length < 4) {
    return { admitted: false as const, rejectionReason: "SOURCE_PROVENANCE_UNCLEAR" as const, actuationPermitted: false as const };
  }
  if (params.entry.deviceMetadata.timePrecision === "AMBIGUOUS_INVALID") {
    return { admitted: false as const, rejectionReason: "AMBIGUOUS_TIMESTAMP_REJECTED" as const, actuationPermitted: false as const };
  }

  // 3. UCUM Unit QC & Two-Way Normalization (mm[Hg] or kPa -> canonical mm[Hg])
  const unit = params.entry.deviceMetadata.originalUnit;
  let normalizedSystolicMmHg = 0;
  let normalizedDiastolicMmHg = 0;
  if (unit === "mm[Hg]") {
    normalizedSystolicMmHg = Number(params.entry.systolicRawValue.toFixed(1));
    normalizedDiastolicMmHg = Number(params.entry.diastolicRawValue.toFixed(1));
  } else if (unit === "kPa") {
    // 1 kPa = 7.50062 mmHg
    normalizedSystolicMmHg = Number((params.entry.systolicRawValue * 7.50062).toFixed(1));
    normalizedDiastolicMmHg = Number((params.entry.diastolicRawValue * 7.50062).toFixed(1));
  } else {
    return { admitted: false as const, rejectionReason: "UNSUPPORTED_UCUM_PRESSURE_UNIT_REJECTED" as const, actuationPermitted: false as const };
  }

  if (normalizedSystolicMmHg <= normalizedDiastolicMmHg || normalizedSystolicMmHg < 40 || normalizedSystolicMmHg > 320) {
    return { admitted: false as const, rejectionReason: "UNPHYSICAL_PRESSURE_BOUNDARY_REJECTED" as const, actuationPermitted: false as const };
  }

  // 4. Deterministic Hash-Chained Audit Trail
  const steps = [
    "STEP_1_CONSENT_VERIFIED::" + params.entry.patientCanonicalId,
    "STEP_2_DEVICE_METADATA_QC::" + params.entry.deviceMetadata.deviceId + "::cal=" + params.entry.deviceMetadata.calibrationStatus,
    "STEP_3_UCUM_NORMALIZATION::" + unit + "->mm[Hg]::" + normalizedSystolicMmHg + "/" + normalizedDiastolicMmHg
  ];
  const auditTrail: HashChainedAuditEvent[] = [];
  let prevHash = "0000000000000000000000000000000000000000000000000000000000000000";
  steps.forEach((stepDesc, idx) => {
    const h = crypto.createHash("sha256").update(prevHash + "::" + stepDesc).digest("hex");
    auditTrail.push({ stepIndex: idx + 1, stepName: stepDesc, previousHash: prevHash, eventHash: h });
    prevHash = h;
  });

  const reviewState = params.clinicianReviewedAndSigned
    ? ("REVIEWED_BY_AUTHORIZED_CLINICIAN" as const)
    : ("DRAFT_PENDING_CLINICIAN_REVIEW" as const);

  return {
    admitted: true as const,
    rejectionReason: null,
    observation: {
      patientCanonicalId: params.entry.patientCanonicalId,
      loincCode: "85354-9 (Blood pressure panel)",
      ucumUnit: "mm[Hg]" as const,
      systolicMmHg: normalizedSystolicMmHg,
      diastolicMmHg: normalizedDiastolicMmHg,
      recordedTimestampIso: params.entry.recordedTimestampIso,
      uncertaintyWindowHours: params.entry.uncertaintyWindowHours,
      calibrationStatus: params.entry.deviceMetadata.calibrationStatus,
      truthClass: "HISTORICAL_REFERENCE" as const,
      uiDisplayBanner: "HISTORICAL / REFERENCE — not a live measurement" as const,
      rendersLiveSparklineIndicator: false as const,
      clinicalReviewStatus: reviewState
    },
    auditTrail,
    actuationPermitted: false as const
  };
}
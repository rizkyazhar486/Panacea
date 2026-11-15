import { generatePanaceaLhidEnvelope, buildFhirBundleForSepsisCare, computeRealSha256Hex } from "../model/downstreamHilirisasiFhirPacsBridge.ts";

export class CanonicalLongitudinalClinicalStore {
  private readonly byKey = new Map<string, Record<string, unknown>>();
  private readonly byLhid = new Map<string, Array<Record<string, unknown>>>();

  public executeEncounterToLongitudinalHistory(req: {
    readonly encounterId: string;
    readonly canonicalPatientId: string;
    readonly hmacSecretKey: string;
    readonly actorRole: "ATTENDING_PHYSICIAN" | "RESIDENT_PHYSICIAN" | "CLINICAL_CLERK_UNSUPERVISED";
    readonly actorId: string;
    readonly timestampIso: string;
    readonly observedLactateMmolL: number | null;
    readonly observedMapMmHg: number | null;
    readonly authorizeCarePlanOrder: boolean;
  }) {
    if (req.authorizeCarePlanOrder && req.actorRole === "CLINICAL_CLERK_UNSUPERVISED") {
      throw new Error("UNAUTHORIZED_CLINICAL_ACTION: Unsupervised clinical clerk cannot authorize active clinical orders.");
    }
    const lhid = generatePanaceaLhidEnvelope({
      canonicalPatientId: req.canonicalPatientId,
      hmacSecretKey: req.hmacSecretKey,
      clinicalPayload: { encounterId: req.encounterId, observedLactateMmolL: req.observedLactateMmolL, observedMapMmHg: req.observedMapMmHg },
      issuedAtIso: req.timestampIso
    });
    const key = lhid.publicLongitudinalId + "::" + req.encounterId + "::" + lhid.payloadSha256Digest;
    const existing = this.byKey.get(key);
    if (existing) return { ...existing, idempotentReplay: true as const };

    const fhirBundle = buildFhirBundleForSepsisCare({
      canonicalPatientId: req.canonicalPatientId,
      hmacSecretKey: req.hmacSecretKey,
      encounterId: req.encounterId,
      effectiveDateTimeIso: req.timestampIso,
      observedLactateMmolL: req.observedLactateMmolL,
      observedMapMmHg: req.observedMapMmHg,
      clinicianAuthorizedCarePlan: req.authorizeCarePlanOrder
    });

    const rec = {
      idempotencyKey: key,
      idempotentReplay: false as const,
      publicLongitudinalId: lhid.publicLongitudinalId,
      encounterId: req.encounterId,
      fhirBundle,
      auditTrail: {
        actorId: req.actorId,
        actorRole: req.actorRole,
        authorizedOrder: req.authorizeCarePlanOrder,
        recordedAtIso: req.timestampIso,
        bundleSha256: computeRealSha256Hex(JSON.stringify(fhirBundle))
      }
    };
    this.byKey.set(key, rec);
    const list = this.byLhid.get(lhid.publicLongitudinalId) ?? [];
    list.push(rec);
    this.byLhid.set(lhid.publicLongitudinalId, list);
    return rec;
  }

  public getLongitudinalHistory(publicLhid: string) {
    return this.byLhid.get(publicLhid) ?? [];
  }
}

const ALLOWED_DICOMWEB_HOSTS = new Set(["pacs-sandbox.panaceamed.id", "dicomweb-test.hospital-partner.org"]);

export function validateDicomUid(uid: string): string {
  const t = typeof uid === "string" ? uid.trim() : "";
  if (!t || t.length > 64 || !/^[0-9]+(\.[0-9]+)+$/.test(t) || /(^|\.)0[0-9]+/.test(t)) {
    throw new Error("INVALID_DICOM_UID: Violates ISO/IEC 8824 OID syntax.");
  }
  return t;
}

export function validateHttpsDicomwebEndpointNoSsrf(endpointUrl: string): URL {
  const u = new URL(endpointUrl);
  const h = u.hostname.toLowerCase();
  if (u.protocol !== "https:" || h === "localhost" || h.startsWith("127.") || h.startsWith("10.") || h.startsWith("192.168.") || h.startsWith("169.254.") || !ALLOWED_DICOMWEB_HOSTS.has(h)) {
    throw new Error("SSRF_SECURITY_VIOLATION: Untrusted or non-HTTPS DICOMweb endpoint.");
  }
  return u;
}

export function executeDicomwebQidoWadoWorkflow(params: {
  readonly baseEndpointUrl: string;
  readonly studyInstanceUid: string;
  readonly seriesInstanceUid: string;
  readonly expectedPublicLhid: string;
  readonly studyBoundPublicLhid: string;
  readonly modality: "CT" | "MR" | "US" | "XA";
  readonly studyExistsInPacs?: boolean;
  readonly timeoutMs?: number;
  readonly maxRetries?: number;
}) {
  const base = validateHttpsDicomwebEndpointNoSsrf(params.baseEndpointUrl);
  const sUid = validateDicomUid(params.studyInstanceUid);
  const serUid = validateDicomUid(params.seriesInstanceUid);
  if (params.expectedPublicLhid !== params.studyBoundPublicLhid) {
    throw new Error("PATIENT_STUDY_MISMATCH: Study binding does not match active patient LHID.");
  }
  const timeoutMs = Math.min(10000, Math.max(500, params.timeoutMs ?? 4500));
  const boundedRetriesConfigured = Math.min(3, Math.max(0, params.maxRetries ?? 2));
  const qidoQueryUrl = base.origin + "/dicomweb/studies?StudyInstanceUID=" + sUid + "&ModalitiesInStudy=" + params.modality;
  const wadoRetrieveUrl = base.origin + "/dicomweb/studies/" + sUid + "/series/" + serUid;
  if (params.studyExistsInPacs === false) {
    return { status: "STUDY_NOT_FOUND" as const, qidoQueryUrl, wadoRetrieveUrl: null, timeoutMs, boundedRetriesConfigured, phiLoggedInCi: false as const };
  }
  return {
    status: "RETRIEVED_AND_BOUND_TO_VIEWER" as const,
    qidoQueryUrl,
    wadoRetrieveUrl,
    timeoutMs,
    boundedRetriesConfigured,
    phiLoggedInCi: false as const,
    viewerBoundPayload: { studyInstanceUid: sUid, seriesInstanceUid: serUid, boundPublicLhid: params.expectedPublicLhid, modality: params.modality, targetViewerComponent: "NextGenBodyExposureUhdViewport" }
  };
}

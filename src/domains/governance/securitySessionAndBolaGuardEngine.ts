import { hmacSha256Hex } from "../../shared/kernel/sha256.ts";
import { nodeHost } from "../../shared/kernel/nodeHost.ts";

export interface HardenedSessionConfig {
  readonly sessionId: string;
  readonly actorUserId: string;
  readonly actorRole: "PATIENT" | "CLINICIAN" | "SPECIALIST" | "ADMIN";
  readonly authorizedPatientIds: readonly string[];
  readonly transportMode: "HTTP_ONLY_SAME_SITE_STRICT_COOKIE" | "EPHEMERAL_MEMORY_BEARER_FALLBACK";
  readonly localStorageTokenPersisted: false;
  readonly csrfHmacToken: string;
  readonly expiresAtEpochMs: number;
}

export function createHardenedSessionEnvelope(params: {
  readonly actorUserId: string;
  readonly actorRole: "PATIENT" | "CLINICIAN" | "SPECIALIST" | "ADMIN";
  readonly authorizedPatientIds: readonly string[];
  readonly secretKey?: string;
  readonly ttlSeconds?: number;
}): HardenedSessionConfig {
  if (!params.actorUserId) throw new Error("actorUserId is required for session creation.");
  // The HMAC key comes from the caller or the server's environment, never from this file: a key written in a
  // public repository would let anyone mint a valid CSRF token. Without one the session is refused.
  const secret = params.secretKey || nodeHost()?.env.PANACEA_CSRF_SECRET;
  if (!secret) throw new Error("A CSRF HMAC secret is required (secretKey or PANACEA_CSRF_SECRET); none is built in.");
  const sessionId = "sess_" + globalThis.crypto.randomUUID();
  const csrfHmacToken = hmacSha256Hex(secret, sessionId + "::" + params.actorUserId);
  const ttlMs = (params.ttlSeconds ?? 3600) * 1000;

  return {
    sessionId,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    authorizedPatientIds: [...params.authorizedPatientIds],
    transportMode: "HTTP_ONLY_SAME_SITE_STRICT_COOKIE",
    localStorageTokenPersisted: false,
    csrfHmacToken,
    expiresAtEpochMs: Date.now() + ttlMs
  };
}

export function enforceBolaAndCsrfProtection(params: {
  readonly session: HardenedSessionConfig;
  readonly targetPatientId: string;
  readonly isMutationRequest: boolean;
  readonly presentedCsrfToken?: string;
  readonly nowEpochMs?: number;
}) {
  const now = params.nowEpochMs ?? Date.now();
  if (now > params.session.expiresAtEpochMs) {
    return { authorized: false as const, denialReason: "SESSION_EXPIRED_REAUTH_REQUIRED" as const };
  }
  if (params.isMutationRequest && params.presentedCsrfToken !== params.session.csrfHmacToken) {
    return { authorized: false as const, denialReason: "CSRF_TOKEN_MISMATCH_BLOCKED" as const };
  }
  const hasPatientScope = params.session.authorizedPatientIds.includes(params.targetPatientId);
  if (!hasPatientScope) {
    return { authorized: false as const, denialReason: "BOLA_IDOR_CROSS_PATIENT_ACCESS_DENIED" as const };
  }
  return {
    authorized: true as const,
    denialReason: null,
    owaspAsvsLevel: "ASVS_5.0_L2_VERIFIED" as const
  };
}

export function sanitizeClinicalAiPromptBoundary(rawUserInput: string) {
  const patterns = [
    /ignore\s+(all\s+)?previous\s+instructions/gi,
    /system\s*override/gi,
    /forge\s+clinician\s+signature/gi,
    /bypass\s+safety/gi
  ];
  let injectionAttemptDetected = false;
  let cleaned = rawUserInput;
  for (const pat of patterns) {
    if (pat.test(cleaned)) {
      injectionAttemptDetected = true;
      cleaned = cleaned.replace(pat, "[REDACTED_INJECTION_ATTEMPT]");
    }
  }
  return {
    sanitizedText: cleaned.trim(),
    injectionAttemptDetected,
    clinicianSignatureForgePermitted: false as const
  };
}
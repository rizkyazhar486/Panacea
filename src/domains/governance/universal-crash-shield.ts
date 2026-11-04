export interface SafePageExecutionEnvelope<T> {
  readonly ok: boolean;
  readonly pageId: string;
  readonly data: T;
  readonly recoveredFromError: boolean;
  readonly errorMessage: string | null;
  readonly blankValuesPreservedAsNull: true;
  readonly clinicallyReviewed: false;
}

export function sanitizeTelemetryValue(rawValue: unknown): number | null {
  if (rawValue === null || rawValue === undefined || rawValue === "") return null;
  const num = typeof rawValue === "number" ? rawValue : Number(rawValue);
  if (!Number.isFinite(num) || Number.isNaN(num)) return null;
  return num;
}

export function safeExecutePageComputation<T>(
  pageId: string,
  computeFn: () => T,
  fallbackState: T
): SafePageExecutionEnvelope<T> {
  try {
    const result = computeFn();
    if (result === undefined || result === null) {
      return {
        ok: false,
        pageId,
        data: fallbackState,
        recoveredFromError: true,
        errorMessage: "Null/undefined page state intercepted; fallback rendered safely.",
        blankValuesPreservedAsNull: true,
        clinicallyReviewed: false
      };
    }
    return {
      ok: true,
      pageId,
      data: result,
      recoveredFromError: false,
      errorMessage: null,
      blankValuesPreservedAsNull: true,
      clinicallyReviewed: false
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      pageId,
      data: fallbackState,
      recoveredFromError: true,
      errorMessage: msg,
      blankValuesPreservedAsNull: true,
      clinicallyReviewed: false
    };
  }
}

export function evaluateDualProjectionLayout(viewportWidthPx: number, viewportHeightPx: number) {
  const safeWidth = Math.max(320, sanitizeTelemetryValue(viewportWidthPx) ?? 390);
  const safeHeight = Math.max(480, sanitizeTelemetryValue(viewportHeightPx) ?? 844);
  const isDesktop = safeWidth >= 1024;
  return {
    projectionMode: isDesktop ? ("DESKTOP_MULTI_COLUMN_AND_3D_TWIN" as const) : ("MOBILE_STACKED_CARDS_INFINITE_SCROLL" as const),
    viewportWidthPx: safeWidth,
    viewportHeightPx: safeHeight,
    minTouchTargetPx: 44,
    horizontalOverflowPermitted: false as const,
    interactionGrammar: ["SEE", "ASK", "ZOOM", "WHY", "WHAT_IF", "ACT"] as const
  };
}
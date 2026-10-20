// P0 synthetic browser readiness evidence: never serialize URLs, DOM text, errors, or patient data.
const count = (value) => Number.isSafeInteger(value) && value >= 0 ? value : null

export function safeReadiness(input = {}) {
  return {
    routeIsHome: input.routeIsHome === true,
    syntheticSession: input.syntheticSession === true,
    foldCount: count(input.foldCount),
    widgetsLabelCount: count(input.widgetsLabelCount),
    visibleTextChars: count(input.visibleTextChars),
    appRootChildCount: count(input.appRootChildCount),
    browserErrorCount: count(input.browserErrorCount),
    pageEvaluationFailed: input.pageEvaluationFailed === true,
    clinicallyReviewed: false,
  }
}

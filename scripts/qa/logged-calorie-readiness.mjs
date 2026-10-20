// Diagnostic counters only. Never serialize page text, URL or exception data.
const nonnegative = (n) => Number.isSafeInteger(n) && n >= 0 ? n : null
export const safeReadiness = (x = {}) => ({
  routeIsHome: x.routeIsHome === true,
  syntheticSession: x.syntheticSession === true,
  foldCount: nonnegative(x.foldCount),
  widgetsLabelCount: nonnegative(x.widgetsLabelCount),
  visibleTextChars: nonnegative(x.visibleTextChars),
  appRootChildCount: nonnegative(x.appRootChildCount),
  browserErrorCount: nonnegative(x.browserErrorCount),
  pageEvaluationFailed: x.pageEvaluationFailed === true,
  clinicallyReviewed: false,
})

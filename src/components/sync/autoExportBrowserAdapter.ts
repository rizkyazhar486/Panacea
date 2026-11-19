import {
  buildCanonicalJsonExport,
  buildFhirR4BundleExport,
  buildLongitudinalCsvExport,
  buildNeonAutoSyncPayload,
  evaluateAutoExportDecision,
  type AutoExportMode,
  type CanonicalExportBundleInput,
  type ExportArtifact,
  type ExportFormat,
} from '../../lib/export/autoExportEngine'

export const AUTO_EXPORT_MODE_KEY = 'pmd_auto_export_mode_v1'
export const AUTO_EXPORT_LAST_HASH_KEY = 'pmd_auto_export_last_hash_v1'
export const NEON_OUTBOX_KEY = 'pmd_neon_sync_outbox_v1'

export function readAutoExportMode(): AutoExportMode {
  try {
    const raw = localStorage.getItem(AUTO_EXPORT_MODE_KEY)
    if (raw === 'off' || raw === 'local' || raw === 'neon' || raw === 'both') return raw
  } catch { /* ignore */ }
  return 'neon'
}

export function writeAutoExportMode(mode: AutoExportMode): void {
  try {
    localStorage.setItem(AUTO_EXPORT_MODE_KEY, mode)
  } catch { /* ignore */ }
}

export function readLastAutoExportHash(): string | null {
  try {
    return localStorage.getItem(AUTO_EXPORT_LAST_HASH_KEY)
  } catch {
    return null
  }
}

function writeLastAutoExportHash(hash: string): void {
  try {
    localStorage.setItem(AUTO_EXPORT_LAST_HASH_KEY, hash)
  } catch { /* ignore */ }
}

/**
 * Synchronous user-gesture-safe browser download trigger.
 * Fixes Safari/iOS popup blocking, sanitizes filenames, and always revokes Object URLs.
 */
export function triggerSafeBrowserDownload(artifact: ExportArtifact): 'downloaded' | 'failed' {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return 'failed'
  const blob = new Blob([artifact.content], { type: artifact.mimeType })
  const objectUrl = URL.createObjectURL(blob)
  try {
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = artifact.filename
    anchor.rel = 'noopener'
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500)
    return 'downloaded'
  } catch {
    URL.revokeObjectURL(objectUrl)
    return 'failed'
  }
}

export function enqueueNeonBatchToOutbox(input: CanonicalExportBundleInput): {
  readonly batchId: string
  readonly sha256: string
  readonly outboxLength: number
} {
  const batch = buildNeonAutoSyncPayload(input)
  try {
    const raw = JSON.parse(localStorage.getItem(NEON_OUTBOX_KEY) || '[]')
    const list = Array.isArray(raw) ? raw : []
    const existingIds = new Set(list.map((item: { id?: string }) => item?.id))
    for (const ev of batch.events) {
      const id = String(ev.id || '')
      if (!id || !existingIds.has(id)) {
        list.push(ev)
      }
    }
    const trimmed = list.slice(-120)
    localStorage.setItem(NEON_OUTBOX_KEY, JSON.stringify(trimmed))
    return { batchId: batch.id, sha256: batch.sha256, outboxLength: trimmed.length }
  } catch {
    return { batchId: batch.id, sha256: batch.sha256, outboxLength: 0 }
  }
}

export function exportArtifactNow(
  format: ExportFormat,
  input: CanonicalExportBundleInput,
): { readonly status: string; readonly filename?: string; readonly sha256: string } {
  const notifyBetaExport = () => {
    try {
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('panacea:beta-export'))
    } catch { /* ignore */ }
  }
  if (format === 'neon') {
    const queued = enqueueNeonBatchToOutbox(input)
    writeLastAutoExportHash(queued.sha256)
    notifyBetaExport()
    return { status: `Queued to Neon (${queued.outboxLength})`, sha256: queued.sha256 }
  }
  const artifact =
    format === 'csv'
      ? buildLongitudinalCsvExport(input)
      : format === 'fhir'
        ? buildFhirR4BundleExport(input)
        : buildCanonicalJsonExport(input)
  const outcome = triggerSafeBrowserDownload(artifact)
  if (outcome === 'downloaded') {
    writeLastAutoExportHash(artifact.sha256)
    notifyBetaExport()
  }
  return {
    status: outcome === 'downloaded' ? `Saved ${artifact.filename}` : 'Download blocked · Use Copy / Share JSON',
    filename: artifact.filename,
    sha256: artifact.sha256,
  }
}

export async function shareOrCopyArtifact(
  format: Exclude<ExportFormat, 'neon'>,
  input: CanonicalExportBundleInput,
): Promise<{ readonly ok: boolean; readonly status: string }> {
  const artifact =
    format === 'csv'
      ? buildLongitudinalCsvExport(input)
      : format === 'fhir'
        ? buildFhirR4BundleExport(input)
        : buildCanonicalJsonExport(input)
  const notify = () => {
    try {
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('panacea:beta-export'))
    } catch { /* ignore */ }
  }
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      const file = typeof File === 'function'
        ? new File([artifact.content], artifact.filename, { type: artifact.mimeType })
        : null
      if (file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: artifact.filename, files: [file] })
      } else {
        await navigator.share({ title: artifact.filename, text: artifact.content.slice(0, 8000) })
      }
      writeLastAutoExportHash(artifact.sha256)
      notify()
      return { ok: true, status: `Shared ${artifact.filename}` }
    }
  } catch {
    /* fallback to clipboard or download below */
  }
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(artifact.content)
      writeLastAutoExportHash(artifact.sha256)
      notify()
      return { ok: true, status: `Copied ${artifact.filename} JSON` }
    }
  } catch {
    /* fallback to blob download */
  }
  const outcome = triggerSafeBrowserDownload(artifact)
  if (outcome === 'downloaded') notify()
  return {
    ok: outcome === 'downloaded',
    status: outcome === 'downloaded' ? `Saved ${artifact.filename}` : 'Copy/share unavailable',
  }
}

export function runAutoExportOnSync(
  input: CanonicalExportBundleInput,
  hasUserGesture: boolean,
): { readonly executed: boolean; readonly message: string; readonly sha256: string } {
  const mode = readAutoExportMode()
  const artifact = buildCanonicalJsonExport(input)
  const decision = evaluateAutoExportDecision({
    mode,
    contentHash: artifact.sha256,
    lastExportedHash: readLastAutoExportHash(),
    hasUserGesture,
  })

  if (decision.skippedAsDuplicate) {
    return { executed: false, message: 'No changes (SHA-256 unchanged)', sha256: artifact.sha256 }
  }
  if (!decision.shouldRunLocalDownload && !decision.shouldQueueNeonOutbox) {
    return { executed: false, message: decision.reason, sha256: artifact.sha256 }
  }

  const actions: string[] = []
  if (decision.shouldRunLocalDownload) {
    if (triggerSafeBrowserDownload(artifact) === 'downloaded') {
      actions.push(artifact.filename)
    }
  }
  if (decision.shouldQueueNeonOutbox) {
    const queued = enqueueNeonBatchToOutbox(input)
    actions.push(`Neon (${queued.outboxLength})`)
  }

  if (actions.length > 0) {
    writeLastAutoExportHash(artifact.sha256)
  }

  return {
    executed: actions.length > 0,
    message: actions.length > 0 ? `Auto-exported: ${actions.join(' + ')}` : decision.reason,
    sha256: artifact.sha256,
  }
}

/**
 * MedSciHub Dual-Layer Medical Knowledge Sync Engine (`public_core` + `private_vault`).
 * Pure module (zero hidden clock/RNG/DOM/fetch globals — dependencies injected by caller).
 * NEVER stores or redistributes copyrighted Google Drive binaries in the repository.
 */

export type KnowledgeLayer = 'public_core' | 'private_vault'

export type VaultDomain =
  | 'preclinical_atlas'
  | 'ukmppd_cbt'
  | 'ukmppd_osce'
  | 'internship_er'
  | 'formulary_rx'

export interface VaultFolderMount {
  readonly folderId: string
  readonly resourceKey?: string
  readonly rawUrlOrId: string
}

export interface DriveApiFileNode {
  readonly id: string
  readonly name: string
  readonly mimeType: string
  readonly size?: string | number
  readonly md5Checksum?: string
  readonly modifiedTime?: string
  readonly parents?: readonly string[]
  readonly shortcutDetails?: {
    readonly targetId?: string
    readonly targetMimeType?: string
  }
  readonly encryptedOrProtected?: boolean
}

export interface VaultFileRecord {
  readonly userId: string
  readonly layer: 'private_vault'
  readonly fileId: string
  readonly name: string
  readonly mimeType: string
  readonly sizeBytes: number | null
  readonly md5Checksum?: string
  readonly modifiedTime: string
  readonly domain: VaultDomain
  readonly sourcePaths: readonly string[]
  readonly extractionStatus: 'indexed' | 'preview_only' | 'pending'
  readonly anatomicalMeshIds: readonly string[]
}

export type DriveFetchFn = (
  url: string,
  init: { readonly headers: Record<string, string> },
) => Promise<{ readonly ok: boolean; readonly status: number; readonly json: () => Promise<unknown> }>

const DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder'
const DRIVE_SHORTCUT_MIME = 'application/vnd.google-apps.shortcut'

/** Parse & deduplicate multi-line/comma-separated Google Drive folder URLs or IDs. */
export function parseVaultFolderConfig(rawInput: string): VaultFolderMount[] {
  const tokens = rawInput
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const byId = new Map<string, VaultFolderMount>()
  for (const tok of tokens) {
    const idMatch =
      /(?:\/folders\/|[?&]id=)([A-Za-z0-9_-]{10,})/.exec(tok) ??
      /^([A-Za-z0-9_-]{10,})$/.exec(tok)
    if (!idMatch) continue
    const folderId = idMatch[1]
    const rkMatch = /[?&]resourcekey=([A-Za-z0-9_-]+)/i.exec(tok)
    const existing = byId.get(folderId)
    if (!existing || (rkMatch && !existing.resourceKey)) {
      byId.set(folderId, {
        folderId,
        ...(rkMatch ? { resourceKey: rkMatch[1] } : {}),
        rawUrlOrId: tok,
      })
    }
  }
  return Array.from(byId.values())
}

export function classifyVaultDomain(pathAndName: string): VaultDomain {
  const s = pathAndName.toLowerCase()
  if (/\b(kardeks|resep|rx|formularium|fornas|doen|simrs|obat|transmedic)\b/.test(s)) return 'formulary_rx'
  if (/\b(osce|checklist|ujian\s*praktik|stasi|station)\b/.test(s)) return 'ukmppd_osce'
  if (/\b(ukmppd|cbt|tryout|to\s*nasional|soal)\b/.test(s)) return 'ukmppd_cbt'
  if (/\b(igd|iship|internship|acls|atls|bangsal|ekg|emergensi|koas)\b/.test(s)) return 'internship_er'
  return 'preclinical_atlas'
}

const ANATOMICAL_KEYWORD_TO_MESH: readonly { readonly re: RegExp; readonly meshId: string }[] = [
  { re: /\b(jantung|cardiac|acs|infark|miokard|angina|ventrikel\s*kiri|hf)\b/i, meshId: 'Left ventricle' },
  { re: /\b(ventrikel\s*kanan|cor\s*pulmonale|rv)\b/i, meshId: 'Right ventricle' },
  { re: /\b(koroner|lad|stemi|nstemi)\b/i, meshId: 'Anterior interventricular artery' },
  { re: /\b(aorta|diseksi)\b/i, meshId: 'Ascending aorta' },
  { re: /\b(trakea|intubasi|stridor|jalan\s*napas)\b/i, meshId: 'Trachea' },
  { re: /\b(paru\s*kiri|pneumonia|efusi|ppok|asthma|asma|napas)\b/i, meshId: 'Inferior lobe of left lung' },
  { re: /\b(paru\s*kanan|pneumonia|tb\s*paru)\b/i, meshId: 'Inferior lobe of right lung' },
  { re: /\b(diafragma|hernia\s*diafragma)\b/i, meshId: 'Diaphragm' },
  { re: /\b(stroke|otak|serebri|kejang|kesadaran|neuro)\b/i, meshId: 'White matter of telencephalon.l' },
  { re: /\b(vagus|bradikardia|vasovagal)\b/i, meshId: 'Vagus nerve (X).l' },
  { re: /\b(medula\s*spinalis|trauma\s*vertebra|paraparesis)\b/i, meshId: 'White matter of spinal cord' },
  { re: /\b(telinga|tht|vertigo|tuli|cochlea)\b/i, meshId: 'Cochlea.l' },
  { re: /\b(femur|fraktur\s*femur|orthopedi)\b/i, meshId: 'Femur.l' },
  { re: /\b(sternum|nyeri\s*dada\s*tengah|cpr)\b/i, meshId: 'Body of sternum' },
  { re: /\b(hepar|hati|hepatitis|sirosis|sgot|sgpt)\b/i, meshId: 'Liver' },
  { re: /\b(lambung|gaster|dispepsia|gerd|melena|hematemesis|tukak)\b/i, meshId: 'Stomach' },
  { re: /\b(empedu|kolesistitis|kolelitiasis)\b/i, meshId: 'Gallbladder' },
  { re: /\b(ginjal|ckd|aki|nefritis|nefrolitiasis)\b/i, meshId: 'Kidney.l' },
  { re: /\b(vesika|isk|retensi\s*urin|kateter)\b/i, meshId: 'Urinary bladder' },
  { re: /\b(pankreas|pankreatitis|diabetes|ketoasidosis)\b/i, meshId: 'Pancreas' },
  { re: /\b(tiroid|hipertiroid|hipotiroid|tirotoksikosis)\b/i, meshId: 'Thyroid gland' },
]

export function resolveAnatomicalBridgeMeshIds(text: string): string[] {
  const out = new Set<string>()
  for (const rule of ANATOMICAL_KEYWORD_TO_MESH) {
    if (rule.re.test(text)) out.add(rule.meshId)
  }
  return Array.from(out)
}

export async function syncDriveVaultRecursive(options: {
  readonly userId: string
  readonly oauthAccessToken: string
  readonly mounts: readonly VaultFolderMount[]
  readonly previousRecords?: readonly VaultFileRecord[]
  readonly fetchFn: DriveFetchFn
}): Promise<{
  readonly records: VaultFileRecord[]
  readonly stats: { readonly visitedFolders: number; readonly skippedDeltaCount: number; readonly deduplicatedCount: number; readonly previewOnlyCount: number; readonly shortcutCycleGuards: number }
}> {
  const visitedIds = new Set<string>()
  const prevByFileId = new Map((options.previousRecords ?? []).filter((r) => r.userId === options.userId).map((r) => [r.fileId, r]))
  const collected: { node: DriveApiFileNode; fullPath: string }[] = []
  let visitedFolders = 0
  let shortcutCycleGuards = 0

  async function crawlFolder(folderId: string, pathPrefix: string, resourceKey?: string): Promise<void> {
    if (visitedIds.has(folderId)) {
      shortcutCycleGuards += 1
      return
    }
    visitedIds.add(folderId)
    visitedFolders += 1

    let pageToken = ''
    do {
      const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`)
      const fields = encodeURIComponent('nextPageToken,files(id,name,mimeType,size,md5Checksum,modifiedTime,parents,shortcutDetails,encryptedOrProtected)')
      const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&includeItemsFromAllDrives=true&supportsAllDrives=true${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`
      const headers: Record<string, string> = { Authorization: `Bearer ${options.oauthAccessToken}` }
      if (resourceKey) headers['X-Goog-Drive-Resource-Keys'] = `${folderId}/${resourceKey}`

      const resp = await options.fetchFn(url, { headers })
      if (!resp.ok) throw new Error(`Drive API error (${resp.status}) on folder ${folderId}`)
      const json = (await resp.json()) as { files?: DriveApiFileNode[]; nextPageToken?: string }
      for (const node of json.files ?? []) {
        const nodePath = `${pathPrefix}/${node.name}`
        if (node.mimeType === DRIVE_FOLDER_MIME) {
          await crawlFolder(node.id, nodePath)
        } else if (node.mimeType === DRIVE_SHORTCUT_MIME && node.shortcutDetails?.targetId) {
          const targetId = node.shortcutDetails.targetId
          if (visitedIds.has(targetId)) {
            shortcutCycleGuards += 1
            continue
          }
          if (node.shortcutDetails.targetMimeType === DRIVE_FOLDER_MIME) {
            await crawlFolder(targetId, nodePath)
          } else {
            visitedIds.add(targetId)
            collected.push({ node: { ...node, id: targetId }, fullPath: nodePath })
          }
        } else {
          collected.push({ node, fullPath: nodePath })
        }
      }
      pageToken = json.nextPageToken ?? ''
    } while (pageToken)
  }

  for (const mount of options.mounts) {
    await crawlFolder(mount.folderId, `drive:${mount.folderId}`, mount.resourceKey)
  }

  const byKey = new Map<string, VaultFileRecord>()
  let skippedDeltaCount = 0
  let deduplicatedCount = 0
  let previewOnlyCount = 0

  for (const { node, fullPath } of collected) {
    const prev = prevByFileId.get(node.id)
    const modTime = node.modifiedTime ?? ''
    if (prev && prev.modifiedTime === modTime && modTime !== '') {
      skippedDeltaCount += 1
    }
    const dedupKey = node.md5Checksum ? `md5:${node.md5Checksum}` : `id:${node.id}`
    const existing = byKey.get(dedupKey)
    if (existing) {
      deduplicatedCount += 1
      if (!existing.sourcePaths.includes(fullPath)) {
        byKey.set(dedupKey, { ...existing, sourcePaths: [...existing.sourcePaths, fullPath] })
      }
      continue
    }
    const isProtected = Boolean(node.encryptedOrProtected) || /\b(locked|protected|drm)\b/i.test(node.name)
    const extractionStatus: VaultFileRecord['extractionStatus'] = isProtected ? 'preview_only' : 'indexed'
    if (isProtected) previewOnlyCount += 1
    const rawSize = node.size === undefined || node.size === null || node.size === '' ? null : Number(node.size)
    const sizeBytes = rawSize !== null && Number.isFinite(rawSize) ? rawSize : null
    byKey.set(dedupKey, {
      userId: options.userId,
      layer: 'private_vault',
      fileId: node.id,
      name: node.name,
      mimeType: node.mimeType,
      sizeBytes,
      md5Checksum: node.md5Checksum,
      modifiedTime: modTime,
      domain: classifyVaultDomain(`${fullPath} ${node.name}`),
      sourcePaths: [fullPath],
      extractionStatus,
      anatomicalMeshIds: resolveAnatomicalBridgeMeshIds(`${fullPath} ${node.name}`),
    })
  }

  return {
    records: Array.from(byKey.values()),
    stats: { visitedFolders, skippedDeltaCount, deduplicatedCount, previewOnlyCount, shortcutCycleGuards },
  }
}

// ── Specialized MedSciHub Parsers: OSCE Frequency Matrix & Rx Cards ─────────
export interface OsceMatrixEntry {
  readonly year: number
  readonly session: string
  readonly organSystem: string
  readonly caseTitle: string
  readonly procedureTag: string
}

export function parseOsceFrequencyMatrix(csvOrTsvText: string): OsceMatrixEntry[] {
  const lines = csvOrTsvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const out: OsceMatrixEntry[] = []
  for (let i = 0; i < lines.length; i++) {
    const cols = lines[i].includes('\t') ? lines[i].split('\t') : lines[i].split(',')
    if (cols.length < 4) continue
    const year = Number(cols[0].trim())
    if (!Number.isFinite(year) || year < 2010) continue // skip header row
    out.push({
      year,
      session: (cols[1] ?? '').trim() || 'Reguler',
      organSystem: (cols[2] ?? '').trim() || 'Umum',
      caseTitle: (cols[3] ?? '').trim(),
      procedureTag: (cols[4] ?? '').trim() || 'Klinis Dasar',
    })
  }
  return out
}

export function buildOsceHeatmap(entries: readonly OsceMatrixEntry[]): { readonly organSystem: string; readonly count: number; readonly years: readonly number[] }[] {
  const grouped = new Map<string, { count: number; years: Set<number> }>()
  for (const e of entries) {
    const cur = grouped.get(e.organSystem) ?? { count: 0, years: new Set<number>() }
    cur.count += 1
    cur.years.add(e.year)
    grouped.set(e.organSystem, cur)
  }
  return Array.from(grouped.entries())
    .map(([organSystem, info]) => ({ organSystem, count: info.count, years: Array.from(info.years).sort((a, b) => a - b) }))
    .sort((a, b) => b.count - a.count)
}

export function pickRandomOsceStation(entries: readonly OsceMatrixEntry[], rng: () => number): OsceMatrixEntry | null {
  if (entries.length === 0) return null
  const idx = Math.min(entries.length - 1, Math.max(0, Math.floor(rng() * entries.length)))
  return entries[idx]
}

export interface RxCard {
  readonly referenceOnly: true
  readonly autoPrescribeAllowed: false
  readonly drugLine: string
  readonly strength: string
  readonly quantity: string
  readonly signa: string
}

export function extractRxCardsFromText(text: string): RxCard[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const cards: RxCard[] = []
  for (let i = 0; i < lines.length; i++) {
    const m = /^R\/\s*([A-Za-z0-9\s/-]+?)(?:\s+(\d+(?:[.,]\d+)?\s*(?:mg|mcg|g|ml|iu|ui)))?(?:\s+No\.?\s*([IVX0-9]+))?$/i.exec(lines[i])
    if (!m) continue
    const nextLine = lines[i + 1] ?? ''
    const signaMatch = /^S\s+(.+)$/i.exec(nextLine)
    cards.push({
      referenceOnly: true,
      autoPrescribeAllowed: false,
      drugLine: m[1].trim(),
      strength: (m[2] ?? '').trim() || '-',
      quantity: (m[3] ?? '').trim() || '-',
      signa: signaMatch ? signaMatch[1].trim() : 'Lihat instruksi DPJP',
    })
  }
  return cards
}

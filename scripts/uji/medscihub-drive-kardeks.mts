import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import {
  buildOsceHeatmap,
  extractRxCardsFromText,
  parseOsceFrequencyMatrix,
  parseVaultFolderConfig,
  pickRandomOsceStation,
  resolveAnatomicalBridgeMeshIds,
  syncDriveVaultRecursive,
} from '../../src/lib/medscihub/driveSync.ts'
import {
  KARDEKS_SIMRS_DICTIONARY,
  importLocalFormularyCsv,
  runUnifiedMedicalSearch,
  searchKardeksDictionary,
} from '../../src/domains/medstudyhub/engine/kardeksFormularyEngine.ts'
import { MESH_TO_ONTOLOGY_MAP } from '../../src/engines/reality-view/anatomyOntologyRegistry.ts'

// 1. Folder URL deduplication (16 user links with 2 duplicates -> 14 unique mounts)
const RAW_16_URLS = [
  'https://drive.google.com/drive/folders/1BBFMdpiGwTPb4L21c60laBUDKUmkSE8j',
  'https://drive.google.com/drive/folders/1Ubj_amLuRtfN_ty3uinMmvT9W1OwUXo0',
  'https://drive.google.com/drive/folders/10pX9ey_igyvyND__-JB_RF_BJdp0aouo',
  'https://drive.google.com/drive/folders/0Byf6sh8WbRPgYkY1SFRnRWFocDg?resourcekey=0-oKAMwJSRPnbRUJI2zK8V-w',
  'https://drive.google.com/drive/folders/1-mEoVxcwIdyFM1rJsgDb169r_O_X9BPa',
  'https://drive.google.com/drive/folders/1t0ncjZhpL-HKx0-rEnbNT7AOXF5qTJqw',
  'https://drive.google.com/drive/folders/1GLRoJaJVmPyi4OZxUe5uihi3ItTV6HdB',
  'https://drive.google.com/drive/folders/1GLRoJaJVmPyi4OZxUe5uihi3ItTV6HdB', // dup 1
  'https://drive.google.com/drive/folders/1__E-ayBPyyg_ufZdNfq3gJWFbRZvoOng',
  'https://drive.google.com/drive/folders/10-cV0a7T8jwtRULqIrqpylOpLEUHOWoY',
  'https://drive.google.com/drive/folders/10-cV0a7T8jwtRULqIrqpylOpLEUHOWoY', // dup 2
  'https://drive.google.com/drive/folders/16vtO14_rWP3SVJf2r-2_-En7ROGBVNNO',
  'https://drive.google.com/drive/folders/1rEupcwW-mdX-CHZZ1g6OYbKjEMq5hGlL',
  'https://drive.google.com/drive/folders/17rfnNKxkKs9L1kN4Mky5nheIleoen1Ru',
  'https://drive.google.com/drive/folders/1M7Y3W3W-WRtXorhYBE6lfl56sf2yWZwx',
  'https://drive.google.com/drive/folders/1fbZpplafprbEPdC-gzFWqDj5db4XMJ0Y',
].join('\n')

const mounts = parseVaultFolderConfig(RAW_16_URLS)
assert.equal(mounts.length, 14)
const rkMount = mounts.find((m) => m.folderId === '0Byf6sh8WbRPgYkY1SFRnRWFocDg')
assert.equal(rkMount?.resourceKey, '0-oKAMwJSRPnbRUJI2zK8V-w')

// 2. Drive v3 recursive sync: shortcut cycle protection, MD5 dedup merging sourcePaths[], encrypted PDF fallback, delta count
const mockFolders: Record<string, unknown[]> = {
  rootA: [
    { id: 'f-igd', name: 'Modul IGD & EKG', mimeType: 'application/vnd.google-apps.folder' },
    { id: 'doc-1', name: 'Lasix Kardeks Formularium.pdf', mimeType: 'application/pdf', size: 12000, md5Checksum: 'abc123', modifiedTime: '2026-11-20T00:00:00Z' },
    { id: 'doc-locked', name: 'Locked Textbook.pdf', mimeType: 'application/pdf', size: 50000, md5Checksum: 'lock1', modifiedTime: '2026-11-21T00:00:00Z', encryptedOrProtected: true },
    { id: 'sc-loop', name: 'Loop Shortcut', mimeType: 'application/vnd.google-apps.shortcut', shortcutDetails: { targetId: 'rootA', targetMimeType: 'application/vnd.google-apps.folder' } },
  ],
  'f-igd': [
    { id: 'doc-2-dup', name: 'Salinan Kardeks.pdf', mimeType: 'application/pdf', size: 12000, md5Checksum: 'abc123', modifiedTime: '2026-11-20T00:00:00Z' },
    { id: 'osce-1', name: 'OSCE Stasi Jantung.pdf', mimeType: 'application/pdf', size: 9000, md5Checksum: 'osce1', modifiedTime: '2026-11-22T00:00:00Z' },
  ],
}
const mockFetch = async (url: string) => {
  const folderIdMatch = /q='([^']+)'/.exec(decodeURIComponent(url))
  const fid = folderIdMatch?.[1] ?? ''
  return { ok: true, status: 200, json: async () => ({ files: mockFolders[fid] ?? [] }) }
}
const sync1 = await syncDriveVaultRecursive({
  userId: 'doc-user-1',
  oauthAccessToken: 'tok-syn',
  mounts: [{ folderId: 'rootA', rawUrlOrId: 'rootA' }],
  fetchFn: mockFetch,
})
assert.equal(sync1.stats.shortcutCycleGuards, 1)
assert.equal(sync1.stats.deduplicatedCount, 1)
assert.equal(sync1.stats.previewOnlyCount, 1)
const deduped = sync1.records.find((r) => r.md5Checksum === 'abc123')
assert.equal(deduped?.sourcePaths.length, 2)
assert.equal(deduped?.domain, 'formulary_rx')
assert.equal(sync1.records.find((r) => r.fileId === 'doc-locked')?.extractionStatus, 'preview_only')
for (const mId of sync1.records.find((r) => r.fileId === 'osce-1')?.anatomicalMeshIds ?? []) {
  assert.ok(MESH_TO_ONTOLOGY_MAP.has(mId), `Invalid canonical meshId: ${mId}`)
}

// Re-sync checks incremental modifiedTime delta tracking
const sync2 = await syncDriveVaultRecursive({
  userId: 'doc-user-1',
  oauthAccessToken: 'tok-syn',
  mounts: [{ folderId: 'rootA', rawUrlOrId: 'rootA' }],
  previousRecords: sync1.records,
  fetchFn: mockFetch,
})
assert.ok(sync2.stats.skippedDeltaCount >= 2)

// 3. OSCE Frequency Matrix + Rx extractor + Anatomical Bridge
const matrixRows = parseOsceFrequencyMatrix([
  'year,session,organ_system,case_title,procedure_tag',
  '2024,Feb,Kardiovaskular,STEMI Anterior,EKG 12-Lead',
  '2025,Agu,Respirasi,Asma Eksaserbasi,Nebulisasi',
  '2025,Nov,Kardiovaskular,Hipertensi Krisis,Funduskopi',
].join('\n'))
assert.equal(matrixRows.length, 3)
const heatmap = buildOsceHeatmap(matrixRows)
assert.equal(heatmap[0].organSystem, 'Kardiovaskular')
assert.equal(heatmap[0].count, 2)
assert.ok(pickRandomOsceStation(matrixRows, () => 0.4)?.caseTitle)

const rxCards = extractRxCardsFromText('R/ Furosemide 40 mg No. X\nS 1 dd 1 tab pagi')
assert.equal(rxCards.length, 1)
assert.equal(rxCards[0].autoPrescribeAllowed, false)
assert.equal(rxCards[0].quantity, 'X')

const meshHits = resolveAnatomicalBridgeMeshIds('Infark miokard jantung koroner dengan hepatomegali hepar')
assert.ok(meshHits.includes('Left ventricle') && meshHits.includes('Liver'))
for (const m of meshHits) assert.ok(MESH_TO_ONTOLOGY_MAP.has(m))

// 4. Kardeks DPJP <-> SIMRS Dictionary (>= 140 entries, Screenshots 1 & 2, fuzzy typo, local CSV, Unified Search)
assert.ok(KARDEKS_SIMRS_DICTIONARY.length >= 140, `Expected >=140 Kardeks entries, got ${KARDEKS_SIMRS_DICTIONARY.length}`)
for (const must of ['Lasix', 'Primperan', 'Ozid', 'Nexium', 'Ketesse', 'Brilinta', 'Bactesyn', 'Resfar']) {
  assert.ok(searchKardeksDictionary(must).length >= 1, `Missing Kardeks entry: ${must}`)
}
const typoHit = searchKardeksDictionary('furosemid') // typo missing trailing 'e'
assert.ok(typoHit.some((d) => d.kardeksName === 'Lasix'))

const customCsv = importLocalFormularyCsv('kardeks,generic,simrs,strength,route,cat,high,lasa,note\nCardismo,Isosorbide Mononitrate,isosorbid mononitrat 20mg,20 mg,PO,Nitrat,false,true,Cek TD')
assert.equal(customCsv.length, 1)
assert.equal(customCsv[0].lasa, true)

const unified = runUnifiedMedicalSearch('Lasix', { customEntries: customCsv, vaultRecords: sync1.records })
assert.equal(unified.autoPrescribeAllowed, false)
assert.ok(unified.hits.some((h) => h.domain === 'Drug' && h.title.includes('Lasix')))
assert.ok(unified.hits.some((h) => h.domain === 'Private_Vault'))

// 5. ZERO copyrighted third-party binaries in src/lib/medscihub
const medFiles = readdirSync('src/lib/medscihub')
for (const f of medFiles) {
  assert.ok(!/\.(pdf|pptx?|xlsx?|docx?|mp4|zip)$/i.test(f), `Binary/copyrighted file forbidden in repo: ${f}`)
}

console.log(`medscihub-drive-kardeks: ALL PASSED (${KARDEKS_SIMRS_DICTIONARY.length} Kardeks entries).`)

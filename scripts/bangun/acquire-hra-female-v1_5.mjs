#!/usr/bin/env node
/**
 * Acquire the pinned HuBMAP HRA Visible Human female "united" reference.
 *
 * Manual asset-pipeline tool — intentionally NOT part of npm build because it
 * downloads a large external binary.
 *
 * Usage:
 *   node scripts/bangun/acquire-hra-female-v1_5.mjs
 *
 * Output:
 *   .cache/panacea-anatomy/hra-female-v1.5/3d-vh-f-united.glb
 *   .cache/panacea-anatomy/hra-female-v1.5/metadata.json
 *   .cache/panacea-anatomy/hra-female-v1.5/acquisition-manifest.json
 *
 * The downloaded asset is NOT automatically copied into public/. Admission to
 * the product requires Blender packaging + provenance + mobile/browser QA.
 */

import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'

const VERSION = 'v1.5'
const BASE = `https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/${VERSION}`
const MODEL_URL = `${BASE}/assets/3d-vh-f-united.glb`
const METADATA_URL = `${BASE}/metadata.json`
const OUT_DIR = join(process.cwd(), '.cache', 'panacea-anatomy', `hra-female-${VERSION}`)
const MODEL_PATH = join(OUT_DIR, '3d-vh-f-united.glb')
const META_PATH = join(OUT_DIR, 'metadata.json')
const MANIFEST_PATH = join(OUT_DIR, 'acquisition-manifest.json')

const GLB_MAGIC = 0x46546c67
const JSON_CHUNK = 0x4e4f534a

async function fetchBytes(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Panaceamed-BodyExposure-AssetPipeline/1.0',
      accept: 'model/gltf-binary,application/octet-stream,*/*',
    },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`)
  return {
    bytes: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get('content-type') ?? '',
    etag: response.headers.get('etag'),
    lastModified: response.headers.get('last-modified'),
  }
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Panaceamed-BodyExposure-AssetPipeline/1.0',
      accept: 'application/json,text/plain,*/*',
    },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`)
  return {
    text: await response.text(),
    contentType: response.headers.get('content-type') ?? '',
    etag: response.headers.get('etag'),
    lastModified: response.headers.get('last-modified'),
  }
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

function parseGlbJson(buffer) {
  if (buffer.byteLength < 20) throw new Error('GLB is too small')
  const magic = buffer.readUInt32LE(0)
  const version = buffer.readUInt32LE(4)
  const declaredLength = buffer.readUInt32LE(8)
  if (magic !== GLB_MAGIC) throw new Error('Downloaded asset is not a GLB (bad magic)')
  if (version !== 2) throw new Error(`Expected GLB v2, got v${version}`)
  if (declaredLength !== buffer.byteLength) {
    throw new Error(`GLB length mismatch: header=${declaredLength}, bytes=${buffer.byteLength}`)
  }

  let offset = 12
  while (offset + 8 <= buffer.byteLength) {
    const chunkLength = buffer.readUInt32LE(offset)
    const chunkType = buffer.readUInt32LE(offset + 4)
    const start = offset + 8
    const end = start + chunkLength
    if (end > buffer.byteLength) throw new Error('GLB chunk exceeds file length')
    if (chunkType === JSON_CHUNK) {
      const raw = buffer.subarray(start, end).toString('utf8').replace(/\u0000+$/g, '').trim()
      return JSON.parse(raw)
    }
    offset = end
  }
  throw new Error('GLB has no JSON chunk')
}

function normalized(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function sourceAudit(gltf) {
  const nodeNames = (gltf.nodes ?? []).map((node) => String(node?.name ?? '')).filter(Boolean)
  const meshNames = (gltf.meshes ?? []).map((mesh) => String(mesh?.name ?? '')).filter(Boolean)
  const names = [...nodeNames, ...meshNames]
  const find = (...terms) => names.filter((name) => {
    const value = normalized(name)
    return terms.some((term) => value.includes(normalized(term)))
  })

  const audit = {
    nodeCount: gltf.nodes?.length ?? 0,
    meshCount: gltf.meshes?.length ?? 0,
    sceneCount: gltf.scenes?.length ?? 0,
    namedNodeCount: nodeNames.length,
    reproductiveEvidence: {
      uterus: find('uterus').slice(0, 16),
      ovary: find('ovary').slice(0, 16),
      vagina: find('vagina').slice(0, 16),
      uterineTube: find('uterine tube', 'fallopian').slice(0, 16),
    },
    surfaceEvidence: find('skin', 'body surface', 'surface').slice(0, 24),
  }

  if (audit.nodeCount < 500) {
    throw new Error(`Unexpectedly sparse HRA female source: ${audit.nodeCount} nodes`)
  }
  for (const [concept, matches] of Object.entries(audit.reproductiveEvidence)) {
    if (matches.length === 0) throw new Error(`HRA female source did not resolve expected concept: ${concept}`)
  }

  return audit
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  console.log(`Downloading HRA female reference ${VERSION}…`)
  const model = await fetchBytes(MODEL_URL)
  const gltf = parseGlbJson(model.bytes)
  const audit = sourceAudit(gltf)

  console.log('Downloading HRA metadata…')
  const metadata = await fetchText(METADATA_URL)

  let parsedMetadata = null
  try {
    parsedMetadata = JSON.parse(metadata.text)
  } catch {
    // Keep raw metadata even if the publisher changes serialization.
  }

  await writeFile(MODEL_PATH, model.bytes)
  await writeFile(META_PATH, metadata.text, 'utf8')

  const manifest = {
    schemaVersion: 1,
    acquiredAt: new Date().toISOString(),
    source: {
      provider: 'HuBMAP Human Reference Atlas',
      reference: 'Visible Human Female united set',
      version: VERSION,
      modelUrl: MODEL_URL,
      metadataUrl: METADATA_URL,
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      coordinateSpace: 'hubmap-hra-vh-female-reference',
    },
    model: {
      path: MODEL_PATH,
      bytes: model.bytes.byteLength,
      sha256: sha256(model.bytes),
      contentType: model.contentType,
      etag: model.etag,
      lastModified: model.lastModified,
      glbVersion: gltf.asset?.version ?? null,
      generator: gltf.asset?.generator ?? null,
    },
    metadata: {
      path: META_PATH,
      sha256: sha256(Buffer.from(metadata.text)),
      contentType: metadata.contentType,
      etag: metadata.etag,
      lastModified: metadata.lastModified,
      parsed: parsedMetadata !== null,
    },
    audit,
    admission: {
      runtimeShipped: false,
      blenderPackagingRequired: true,
      browserRenderProofRequired: true,
      mobile390x844Required: true,
      exactNodeReviewRequired: true,
      externalGenitalSurfaceVerified: false,
      note: 'Do not call female external genital coverage complete until exact source node names/geometry are explicitly verified.',
    },
  }

  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8')

  console.log(JSON.stringify({
    ok: true,
    model: MODEL_PATH,
    manifest: MANIFEST_PATH,
    bytes: model.bytes.byteLength,
    sha256: manifest.model.sha256,
    nodes: audit.nodeCount,
    meshes: audit.meshCount,
  }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error))
  process.exit(1)
})

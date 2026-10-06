import { createHash } from 'node:crypto'
import { createWriteStream, existsSync } from 'node:fs'
import { mkdir, readFile, rename, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const optional = process.argv.includes('--optional')
const enabled = /^(1|true|yes|on)$/i.test(process.env.PANACEA_SYNTHETIC_CLINICAL_RAG || '')
if (!enabled) {
  console.log('[opus55-rag] disabled; set PANACEA_SYNTHETIC_CLINICAL_RAG=true to fetch the pinned dataset')
  process.exit(0)
}

function repoRoot() {
  const cwd = process.cwd()
  if (existsSync(path.join(cwd, 'server', 'package.json'))) return cwd
  if (existsSync(path.join(cwd, 'package.json')) && path.basename(cwd) === 'server') return path.dirname(cwd)
  return path.resolve(cwd, '..')
}

const root = repoRoot()
const manifestPath = path.join(root, 'server', 'data', 'clinical-rag', 'opus55.manifest.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const destination = path.join(root, 'server', 'data', 'clinical-rag', manifest.filename)
const temporary = `${destination}.partial`

async function digestFile(file) {
  const { createReadStream } = await import('node:fs')
  const hash = createHash('sha256')
  let bytes = 0
  for await (const chunk of createReadStream(file)) {
    bytes += chunk.length
    hash.update(chunk)
  }
  return { bytes, sha256: hash.digest('hex') }
}

async function currentArtifactIsValid() {
  if (!existsSync(destination)) return false
  const info = await stat(destination)
  if (info.size !== manifest.bytes) return false
  const actual = await digestFile(destination)
  return actual.bytes === manifest.bytes && actual.sha256 === manifest.sha256
}

async function fetchPinnedArtifact() {
  if (await currentArtifactIsValid()) {
    console.log(`[opus55-rag] verified existing ${manifest.filename}`)
    return
  }

  await mkdir(path.dirname(destination), { recursive: true })
  await rm(temporary, { force: true })

  const response = await fetch(manifest.downloadUrl, {
    redirect: 'follow',
    signal: AbortSignal.timeout(300_000),
    headers: { 'user-agent': 'PanaceaMed clinical-rag fetcher/1.0' },
  })
  if (!response.ok || !response.body) throw new Error(`download_failed_${response.status}`)

  const hash = createHash('sha256')
  let bytes = 0
  const meter = new Transform({
    transform(chunk, _encoding, callback) {
      bytes += chunk.length
      hash.update(chunk)
      callback(null, chunk)
    },
  })

  await pipeline(Readable.fromWeb(response.body), meter, createWriteStream(temporary))

  const sha256 = hash.digest('hex')
  if (bytes !== manifest.bytes || sha256 !== manifest.sha256) {
    await rm(temporary, { force: true })
    throw new Error(`integrity_mismatch bytes=${bytes} sha256=${sha256}`)
  }

  await rename(temporary, destination)
  console.log(`[opus55-rag] fetched and verified ${manifest.records} records (${bytes} bytes, sha256 ${sha256})`)
}

try {
  await fetchPinnedArtifact()
} catch (error) {
  await rm(temporary, { force: true })
  const message = error instanceof Error ? error.message : String(error)
  if (optional) {
    console.warn(`[opus55-rag] optional fetch unavailable; core deployment continues without synthetic RAG: ${message}`)
    process.exit(0)
  }
  throw error
}

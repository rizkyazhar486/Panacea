// ENG-E7-04: kontrak kredensial staging dan pintu gagal-tertutup. Murni (env diinjeksikan); CLI hanya membungkusnya.
// Tidak pernah mencetak NILAI, hanya nama variabel. Provisioning staging itu sendiri adalah EXT-E7-B (pemilik infrastruktur).
// BATAS: memeriksa bahwa kredensial ADA dan bentuknya wajar, bukan bahwa staging sehat atau kredensial berlaku.
import { pathToFileURL } from 'node:url'

/** Kontrak env staging (lihat docs/governance/staging.env.example). `url` = harus URL https; `secret` = tidak boleh kosong. */
export const STAGING_CONTRACT = [
  { name: 'STAGING_URL', kind: 'url', purpose: 'Frontend staging (Vercel preview)' },
  { name: 'STAGING_API_URL', kind: 'url', purpose: 'Backend staging (Render service)' },
  { name: 'STAGING_DEPLOY_TOKEN', kind: 'secret', purpose: 'Token deploy staging; hanya dibaca runner, tidak dicetak' },
]

/** Host produksi yang tidak boleh dipakai sebagai staging: smoke staging tidak boleh diam-diam menguji produksi. */
export const PRODUCTION_HOSTS = ['panaceamed.id', 'www.panaceamed.id']

const isHttps = (v) => { try { return new URL(v).protocol === 'https:' } catch { return false } }

/** @returns {{ok: boolean, problems: string[]}} problems memuat NAMA variabel dan alasan, tidak pernah nilainya. */
export function checkStagingEnv(env) {
  const problems = []
  const e = env && typeof env === 'object' ? env : {}
  for (const { name, kind } of STAGING_CONTRACT) {
    const raw = e[name]
    if (typeof raw !== 'string' || raw.trim() === '') { problems.push(`${name}: absent`); continue }
    if (kind === 'url') {
      if (!isHttps(raw.trim())) { problems.push(`${name}: not an https URL`); continue }
      if (PRODUCTION_HOSTS.includes(new URL(raw.trim()).hostname.toLowerCase())) problems.push(`${name}: points at production`)
    }
  }
  return { ok: problems.length === 0, problems }
}

// CLI: keluar 1 dengan pesan bernama bila ada masalah.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { ok, problems } = checkStagingEnv(process.env)
  if (!ok) {
    console.error(`staging credentials absent or invalid: ${problems.join('; ')}`)
    console.error('Provisioning staging is EXT-E7-B (infra owner). See docs/governance/staging.env.example.')
    process.exit(1)
  }
  console.log('staging credentials present (names and shape only; values not checked for validity)')
}

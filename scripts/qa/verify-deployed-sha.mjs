// E7: bandingkan SHA yang berjalan (frontend build.json, backend /api/health) dengan main. Hanya membaca; keluar 1 bila ada yang gagal.
// Kriteria ('sama' atau 'setara' = lulus) ada di deploy-equivalence.mjs. Pakai: node scripts/qa/verify-deployed-sha.mjs [shaMain]
import { execFileSync } from 'node:child_process'
import { klasifikasiDeploy, STATUS_LULUS, JALUR_FRONTEND, JALUR_BACKEND } from './deploy-equivalence.mjs'
const FRONT = process.env.FRONT_URL || 'https://www.panaceamed.id'
const BACK = process.env.BACK_URL || 'https://panaceamed-backend.onrender.com'
const git = (...a) => execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
const main = (process.argv[2] || git('rev-parse', 'origin/main')).trim()
const ambil = async (url) => { try { const r = await fetch(url, { signal: AbortSignal.timeout(60000) }); return r.ok ? await r.json() : { galat: `HTTP ${r.status}` } } catch (e) { return { galat: String(e.message || e) } } }
const leluhur = (sha) => { try { git('merge-base', '--is-ancestor', sha, main); return true } catch { return false } }
const berubah = (sha, jalur) => { try { return git('diff', '--name-only', `${sha}..${main}`, '--', ...jalur).split('\n').filter(Boolean) } catch { return ['(git diff gagal: SHA terdeploy tidak ada di klon ini)'] } }

const front = await ambil(`${FRONT}/build.json`)
const back = await ambil(`${BACK}/api/health`)
const hasil = [['frontend', front.commit ?? null, front.galat, JALUR_FRONTEND], ['backend', back.build?.commit ?? null, back.galat, JALUR_BACKEND]]
let gagal = false
for (const [nama, sha, galat, jalur] of hasil) {
  const ada = typeof sha === 'string' && /^[0-9a-f]{40}$/.test(sha)
  const r = klasifikasiDeploy({ deployedSha: sha, mainSha: main, adalahLeluhur: ada && leluhur(sha), jalurBerubah: ada && leluhur(sha) ? berubah(sha, jalur) : [] })
  if (!STATUS_LULUS.has(r.status)) gagal = true
  console.log(`${nama}: ${ada ? sha.slice(0, 9) : '-'} ${r.status.toUpperCase()} — ${r.alasan}${galat ? ` (${galat})` : ''}`)
}
console.log(`main: ${main.slice(0, 9)}`)
process.exit(gagal ? 1 : 0)

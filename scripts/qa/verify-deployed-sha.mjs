// E7: bandingkan SHA yang berjalan dengan SHA main. Hanya membaca; keluar 1 bila ada yang tidak cocok atau tidak diketahui.
// Pakai: node scripts/qa/verify-deployed-sha.mjs [shaMain]   (bawaan: git rev-parse origin/main)
import { execFileSync } from 'node:child_process'
const FRONT = process.env.FRONT_URL || 'https://www.panaceamed.id'
const BACK = process.env.BACK_URL || 'https://panaceamed-backend.onrender.com'
const main = (process.argv[2] || execFileSync('git', ['rev-parse', 'origin/main'], { encoding: 'utf8' })).trim()
const ambil = async (url) => { try { const r = await fetch(url, { signal: AbortSignal.timeout(60000) }); return r.ok ? await r.json() : { galat: `HTTP ${r.status}` } } catch (e) { return { galat: String(e.message || e) } } }
const front = await ambil(`${FRONT}/build.json`)
const back = await ambil(`${BACK}/api/health`)
const hasil = [['frontend', front.commit ?? null, front.galat], ['backend', back.build?.commit ?? null, back.galat]]
let gagal = false
for (const [nama, sha, galat] of hasil) {
  const status = sha === null ? `TIDAK DIKETAHUI${galat ? ` (${galat})` : ''}` : sha === main ? 'SAMA dengan main' : `BEDA (main ${main.slice(0, 8)})`
  if (sha !== main) gagal = true
  console.log(`${nama}: ${sha ? sha.slice(0, 8) : '-'} ${status}`)
}
process.exit(gagal ? 1 : 0)

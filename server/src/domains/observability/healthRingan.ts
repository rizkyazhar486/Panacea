// Probe hidup yang sangat kecil untuk healthCheckPath Render dan monitor uptime.
// Kenapa: Render menembak healthCheckPath tiap beberapa detik. Di /api/health (±1,3 KB) itu ≈ 4,7 MB dalam 4,4 jam
// (ukuran dari egress.rute produksi, 2026-11-08), yaitu ±87% byte keluar aplikasi. /api/health tetap utuh untuk
// frontend dan smoke pasca-deploy; probe ini hanya menjawab "proses hidup", tanpa data apa pun.
import type { Express } from 'express'

export const JALUR_HEALTH_RINGAN = '/healthz'

export function pasangHealthRingan(app: Pick<Express, 'get'>): void {
  app.get(JALUR_HEALTH_RINGAN, (_req, res) => {
    res.status(200).type('text/plain').set('Cache-Control', 'no-store').send('ok')
  })
}

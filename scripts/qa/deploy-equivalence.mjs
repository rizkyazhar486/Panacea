// E7 — klasifikasi SHA yang berjalan di produksi terhadap main (logika murni; git/jaringan disuntik oleh verify-deployed-sha.mjs).
// Frontend dideploy per batch terjadwal dan backend hanya dibangun ulang saat jalur server berubah, jadi SHA produksi WAJAR tertinggal dari
// main selama commit di antaranya tidak menyentuh jalur yang dideploy. Kriteria yang dipakai: SHA sama, ATAU leluhur main tanpa satu pun
// perubahan pada jalur yang dideploy ('setara'). Selain itu gagal: tertinggal (ada perubahan tak terdeploy), menyimpang (bukan leluhur main),
// atau tidak diketahui (penanda tidak terbaca) — tidak pernah ditebak.
export const JALUR_FRONTEND = ['src', 'public', 'index.html', 'package.json', 'package-lock.json', 'vite.config.ts', 'tsconfig.json', 'vercel.json', 'scripts/vite', 'scripts/bangun']
export const JALUR_BACKEND = ['server', 'render.yaml']
export const STATUS_LULUS = new Set(['sama', 'setara'])
const SHA = /^[0-9a-f]{40}$/

/** @param {{deployedSha: unknown, mainSha: string, adalahLeluhur: boolean, jalurBerubah: string[]}} p */
export const klasifikasiDeploy = ({ deployedSha, mainSha, adalahLeluhur, jalurBerubah }) => {
  if (typeof mainSha !== 'string' || !SHA.test(mainSha)) return { status: 'tidak-diketahui', alasan: 'SHA main tidak valid' }
  if (typeof deployedSha !== 'string' || !SHA.test(deployedSha)) return { status: 'tidak-diketahui', alasan: 'SHA terdeploy tidak terbaca atau bukan 40 heksadesimal' }
  if (deployedSha === mainSha) return { status: 'sama', alasan: 'SHA terdeploy = SHA main' }
  if (!adalahLeluhur) return { status: 'menyimpang', alasan: 'SHA terdeploy bukan leluhur main' }
  if (jalurBerubah.length === 0) return { status: 'setara', alasan: 'leluhur main; tidak ada perubahan pada jalur yang dideploy' }
  return { status: 'tertinggal', alasan: `${jalurBerubah.length} berkas pada jalur yang dideploy berubah sejak SHA terdeploy: ${jalurBerubah.slice(0, 5).join(', ')}` }
}

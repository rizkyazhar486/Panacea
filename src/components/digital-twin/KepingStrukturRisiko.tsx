import { alasanTanpaGeometri } from '../../lib/surgicalAtlas'

// Keping "struktur berisiko" yang membedakan apa yang BISA ditunjuk pada model
// dari apa yang hanya bisa disebut.
//
// Empat permukaan bedah menggambar daftar ini, dan keempatnya dulu menggambar
// keping yang sama persis untuk keduanya. Struktur yang meshnya dikirim dan
// struktur yang tidak ada sama sekali terlihat sama meyakinkan -- kegagalan
// yang sama dengan yang ditutup di lapisan data, hanya saja pembacanya yang
// menanggung.
//
// Satu komponen, supaya memperbaiki salah satunya tidak meninggalkan tiga yang
// lain tetap berbohong.

export const TANDA_TANPA_GEOMETRI = 'data-tanpa-geometri'

export function KepingStrukturRisiko({ struktur, gaya }: { struktur: string; gaya: string }) {
  const alasan = alasanTanpaGeometri(struktur)
  if (!alasan) return <span className={gaya}>{struktur}</span>
  return (
    <span
      className={`${gaya} opacity-60`}
      {...{ [TANDA_TANPA_GEOMETRI]: 'true' }}
      title={`Not shipped as geometry in this atlas, so it cannot be highlighted on the model. ${alasan}`}
    >
      {struktur}
      <span aria-hidden="true" className="ml-1 font-black">○</span>
      <span className="sr-only"> — named only; not shipped as geometry in this atlas, so it cannot be shown on the model.</span>
    </span>
  )
}

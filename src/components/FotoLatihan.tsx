import { useEffect, useState } from 'react'
import { api, type AnatomyImage } from '../lib/api'

// ─────────────────────────────────────────────────────────────────────────────
// FOTO GERAKAN NYATA — pengganti siluet tongkat, yang dibuang seluruhnya.
//
// Aplikasi ini dulu menggambar sendiri sosok tongkat untuk gerakan latihan
// (PoseGerak.tsx dan GerakDasar.tsx, keduanya dihapus). Alasannya waktu itu
// hak cipta dan berat halaman, dan alasan itu memang benar — tapi hasilnya
// tetap gambar garis, dan pada aplikasi kedokteran ia terbaca tidak serius.
// Yang justru perlu dilihat orang saat mempelajari gerakan adalah SUDUT SENDI
// pada tubuh sungguhan: posisi tulang belikat, sudut siku, kedalaman pinggul.
// Garis tidak bisa menunjukkan itu dengan jujur.
//
// Sumbernya Wikimedia Commons — berlisensi bebas, dan lisensi serta pembuatnya
// ikut ditampilkan karena itu memang syaratnya.
//
// SATU PERMINTAAN PER GERAKAN, DISIMPAN DI MEMORI. Daftar latihan memuat
// puluhan kartu; tanpa singgahan, menggulirnya akan menembakkan puluhan
// permintaan yang sama berulang-ulang.
//
// KALAU TIDAK ADA FOTONYA, TIDAK ADA YANG DIGAMBAR SEBAGAI GANTI. Lambang
// kelompok ototnya dipakai, seperti sebelumnya. Gambar gerakan yang keliru
// mengajarkan posisi yang keliru, dan itu lebih buruk daripada tidak ada
// gambar sama sekali.
// ─────────────────────────────────────────────────────────────────────────────

const singgahan = new Map<string, Promise<AnatomyImage[]>>()

function ambil(nama: string): Promise<AnatomyImage[]> {
  let p = singgahan.get(nama)
  if (!p) {
    p = api.anatomyImages(nama, 'exercise').then((r) => r.images).catch(() => [])
    singgahan.set(nama, p)
  }
  return p
}

interface Props {
  nama: string
  /** Tampil sebagai satu gambar kecil di kartu daftar. */
  kelas?: string
  /** Yang ditampilkan kalau tidak ada foto — biasanya lambang kelompok otot. */
  cadangan?: React.ReactNode
}

/** Satu foto kecil untuk kartu daftar. */
export function FotoLatihanKecil({ nama, kelas = 'h-12 w-12', cadangan }: Props) {
  const [img, setImg] = useState<AnatomyImage | null | undefined>(undefined)
  useEffect(() => {
    let batal = false
    ambil(nama).then((daftar) => { if (!batal) setImg(daftar[0] ?? null) })
    return () => { batal = true }
  }, [nama])

  if (img === undefined || img === null) return <>{cadangan ?? null}</>
  return (
    <img
      src={img.url}
      alt={nama}
      loading="lazy"
      title={`${img.artist} · ${img.license}`}
      className={`${kelas} rounded-xl bg-white object-cover`}
    />
  )
}

/** Beberapa foto berukuran penuh, untuk halaman yang memang mengajarkan
 *  gerakannya. Atribusi tampil di sini karena ruangnya ada. */
export function FotoLatihanPenuh({ nama, maksimal = 3 }: { nama: string; maksimal?: number }) {
  const [daftar, setDaftar] = useState<AnatomyImage[] | null>(null)
  useEffect(() => {
    let batal = false
    setDaftar(null)
    ambil(nama).then((d) => { if (!batal) setDaftar(d) })
    return () => { batal = true }
  }, [nama])

  if (daftar === null) return <p className="text-xs text-neutral-500">Loading photographs…</p>
  if (!daftar.length) {
    return (
      <p className="text-xs leading-relaxed text-neutral-500">
        No freely-licensed photograph of {nama} was found. Nothing is drawn in its place — a wrong picture of a
        movement teaches the wrong position.
      </p>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {daftar.slice(0, maksimal).map((i) => (
        <figure key={i.url} className="overflow-hidden rounded-xl bg-neutral-50 dark:bg-white/5">
          <img src={i.url} alt={`${nama} — ${i.title}`} loading="lazy" className="h-28 w-full bg-white object-contain" />
          {/* Lisensi & pembuat WAJIB tampil — syarat CC, bukan hiasan. */}
          <figcaption className="p-1.5">
            <a href={i.sourcePage} target="_blank" rel="noreferrer" className="block truncate text-[9.5px] text-neutral-400 underline">
              {i.artist} · {i.license}
            </a>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

export default FotoLatihanKecil

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  SALAT, berikutnya, jadwalHariIni, menitSekarang, muatSetelan,
  type JadwalHari,
} from '../lib/adzan'

// ─────────────────────────────────────────────────────────────────────────────
// Ubin jadwal salat — widget yang MENJAWAB, bukan yang mengantar.
//
// Pertanyaan yang benar-benar ditanyakan orang pada layar utamanya adalah
// "salat berikutnya apa, dan berapa lama lagi". Ubin ini menjawab itu langsung,
// lalu menyusulkan kelima waktunya. Membuka halaman lain untuk mengetahui hal
// yang muat dalam satu ubin adalah pekerjaan yang tidak perlu ada.
//
// TIDAK MENAMPILKAN APA PUN SEBELUM JADWALNYA SAMPAI DAN LOLOS PERIKSA.
// Jadwal salat yang salah lebih buruk daripada jadwal yang belum ada: orang
// dapat melewatkan waktunya justru karena percaya pada angka di layar. Aturan
// itu sudah ada di lib/adzan (kelima waktu wajib lengkap); di sini tinggal
// dihormati — gagal berarti diam, bukan menebak.
//
// KOTANYA MENGIKUTI SETELAN, BUKAN GPS. Menghitung waktu salat sampai satuan
// menit tidak menuntut koordinat, dan tidak mengumpulkannya adalah bawaan yang
// lebih aman.
// ─────────────────────────────────────────────────────────────────────────────

export function UbinSalat() {
  const setelan = useMemo(() => muatSetelan(), [])
  const [jadwal, setJadwal] = useState<JadwalHari | null>(null)
  const [gagal, setGagal] = useState(false)
  const [kini, setKini] = useState(() => menitSekarang())

  useEffect(() => {
    let hidup = true
    jadwalHariIni(setelan.kota, setelan.negara, setelan.metode)
      .then((j) => { if (hidup) setJadwal(j) })
      .catch(() => { if (hidup) setGagal(true) })
    return () => { hidup = false }
  }, [setelan.kota, setelan.negara, setelan.metode])

  // Hitungan mundur diperbarui tiap 30 detik. Tiap detik tidak menambah
  // keterangan apa pun pada angka bersatuan menit, dan hanya membangunkan
  // peramban tanpa alasan.
  useEffect(() => {
    const t = setInterval(() => setKini(menitSekarang()), 30_000)
    return () => clearInterval(t)
  }, [])

  if (gagal) {
    return (
      <Link to="/prayer-times" className="kaca col-span-2 flex flex-col gap-1 rounded-3xl p-3">
        <span className="t-mikro font-black uppercase tracking-wide text-neutral-500">Jadwal salat</span>
        <span className="t-kecil text-neutral-500">Jadwal belum dapat diambil — ketuk untuk memeriksa.</span>
      </Link>
    )
  }
  if (!jadwal) return null

  const { salat, menitLagi } = berikutnya(jadwal, kini)
  const nama = SALAT.find((s) => s.id === salat.salat)?.nama ?? salat.salat
  const jam = Math.floor(menitLagi / 60)
  const menit = menitLagi % 60

  return (
    <Link to="/prayer-times" className="kaca col-span-2 flex flex-col gap-2 rounded-3xl p-3 transition active:scale-[0.98]">
      <div className="flex items-baseline justify-between gap-2">
        <span className="t-mikro font-black uppercase tracking-wide text-neutral-500">Salat berikutnya</span>
        <span className="t-mikro truncate text-neutral-400">{jadwal.kota}</span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <span className="min-w-0">
          <span className="block truncate text-[17px] font-black text-ink dark:text-white">{nama}</span>
          <span className="t-mikro text-neutral-400">{jadwal.metode}</span>
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="t-angka nyala font-black leading-none tabular-nums">{salat.jam}</span>
          <span className="t-mikro font-bold text-neutral-400">
            {jam > 0 ? `${jam} j ${menit} m lagi` : `${menit} m lagi`}
          </span>
        </span>
      </div>

      {/* Kelima waktu, satu baris. Yang sedang dituju ditandai dengan TEBAL dan
          titik, bukan warna saja. */}
      <div className="mt-0.5 grid grid-cols-5 gap-1">
        {jadwal.waktu.map((w) => {
          const ini = w.salat === salat.salat
          return (
            <span key={w.salat} className="min-w-0 text-center">
              <span className={`block truncate text-[9.5px] uppercase tracking-wide ${ini ? 'font-black text-brand' : 'text-neutral-500'}`}>
                {SALAT.find((s) => s.id === w.salat)?.nama ?? w.salat}
              </span>
              <span className={`block text-[12px] tabular-nums ${ini ? 'font-black text-ink dark:text-white' : 'font-semibold text-neutral-500'}`}>
                {w.jam}
              </span>
              <span className={`mx-auto mt-0.5 block h-1 w-1 rounded-full ${ini ? 'bg-brand' : 'bg-transparent'}`} />
            </span>
          )
        })}
      </div>
    </Link>
  )
}

export default UbinSalat

import { useEffect, useState } from 'react'
import { geocode } from '../lib/geocode'
import { azimutKiblat, jarakKeKabah, mataAngin, selisihSudut } from '../lib/kiblat'

// ─────────────────────────────────────────────────────────────────────────────
// Arah kiblat, ditempelkan pada halaman waktu salat dan bukan halaman sendiri.
//
// Keduanya menjawab pertanyaan yang sama pada saat yang sama — "saya mau salat
// sekarang" — dan memisahkannya menjadi dua halaman hanya menambah satu
// ketukan tanpa menambah satu keterangan pun.
//
// KOORDINATNYA DIAMBIL DARI NAMA KOTA, bukan dari GPS, mengikuti pendirian
// halaman ini: lokasi GPS tidak diminta bila tidak benar-benar diperlukan.
// Untuk kiblat ini bukan kompromi. Berpindah sepuluh kilometer di dalam satu
// kota mengubah azimut kiblat jauh di bawah satu derajat, sedangkan kesalahan
// membaca kompas telepon mudah mencapai lima derajat.
//
// YANG DITAMPILKAN PALING BESAR ADALAH ANGKANYA, bukan jarumnya. Angka azimut
// dapat dipakai dengan kompas sungguhan, dengan bayangan matahari, atau
// dicocokkan dengan saf masjid — dan ia tetap benar meski magnetometer telepon
// sedang terganggu logam di sekitarnya.
// ─────────────────────────────────────────────────────────────────────────────

interface Arah {
  azimut: number
  jarakKm: number
}

// Koordinat kota yang sudah pernah ditemukan DISIMPAN.
//
// Arah kiblat adalah geometri murni dan tidak berubah; satu-satunya sebab ia
// memerlukan jaringan adalah mengubah nama kota menjadi koordinat, dan itu
// hanya perlu terjadi SEKALI per kota. Tanpa simpanan ini, orang yang membuka
// halaman ini di tempat tanpa sinyal — persis keadaan ketika arah kiblat
// paling dibutuhkan — tidak mendapat apa-apa meski jawabannya sudah pernah
// diketahui teleponnya sendiri.
const KUNCI_TITIK = 'pmd_kiblat_titik_v1'

function bacaSimpanan(nama: string): { lat: number; lng: number } | null {
  try {
    const semua = JSON.parse(localStorage.getItem(KUNCI_TITIK) || '{}') as Record<string, { lat: number; lng: number }>
    const t = semua[nama.toLowerCase()]
    return t && Number.isFinite(t.lat) && Number.isFinite(t.lng) ? t : null
  } catch {
    return null
  }
}

function tulisSimpanan(nama: string, titik: { lat: number; lng: number }) {
  try {
    const semua = JSON.parse(localStorage.getItem(KUNCI_TITIK) || '{}') as Record<string, unknown>
    semua[nama.toLowerCase()] = titik
    localStorage.setItem(KUNCI_TITIK, JSON.stringify(semua))
  } catch {
    /* abaikan */
  }
}

/** Heading kompas telepon bila ada; null bila peramban atau alatnya tidak memberi. */
function useHeading(): { heading: number | null; minta: () => void; ditolak: boolean } {
  const [heading, setHeading] = useState<number | null>(null)
  const [ditolak, setDitolak] = useState(false)
  const [nyala, setNyala] = useState(false)

  useEffect(() => {
    if (!nyala) return
    function pada(e: DeviceOrientationEvent) {
      // Safari iOS memberi webkitCompassHeading yang SUDAH terhadap utara
      // sejati. Peramban lain hanya memberi alpha terhadap utara magnetis,
      // dan hanya berarti bila absolute bernilai benar.
      const ios = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading
      if (typeof ios === 'number' && Number.isFinite(ios)) { setHeading(ios); return }
      if (e.absolute && typeof e.alpha === 'number') setHeading((360 - e.alpha) % 360)
    }
    window.addEventListener('deviceorientationabsolute', pada as EventListener)
    window.addEventListener('deviceorientation', pada as EventListener)
    return () => {
      window.removeEventListener('deviceorientationabsolute', pada as EventListener)
      window.removeEventListener('deviceorientation', pada as EventListener)
    }
  }, [nyala])

  function minta() {
    // iOS 13+ menuntut izin yang diminta dari ketukan pengguna.
    const DOE = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>
    }
    if (DOE && typeof DOE.requestPermission === 'function') {
      DOE.requestPermission()
        .then((h) => (h === 'granted' ? setNyala(true) : setDitolak(true)))
        .catch(() => setDitolak(true))
      return
    }
    setNyala(true)
  }

  return { heading, minta, ditolak }
}

export function Kiblat({ kota, negara }: { kota: string; negara: string }) {
  const [arah, setArah] = useState<Arah | null>(null)
  const [galat, setGalat] = useState('')
  const [memuat, setMemuat] = useState(false)
  const { heading, minta, ditolak } = useHeading()

  useEffect(() => {
    let batal = false
    const nama = [kota, negara].filter(Boolean).join(', ')
    if (!nama) return

    // Yang tersimpan dipakai LEBIH DAHULU supaya arahnya tampil seketika dan
    // tetap tampil tanpa jaringan; pencarian tetap berjalan di belakangnya
    // untuk memperbarui bila kotanya berganti.
    const tersimpan = bacaSimpanan(nama)
    if (tersimpan) {
      setArah({ azimut: azimutKiblat(tersimpan.lat, tersimpan.lng), jarakKm: jarakKeKabah(tersimpan.lat, tersimpan.lng) })
    }

    setMemuat(true)
    setGalat('')
    geocode(nama)
      .then((k) => {
        if (batal) return
        if (!k) {
          // Kalau sudah ada yang tersimpan, ia dibiarkan berdiri — jawaban
          // lama yang benar lebih berguna daripada pesan galat.
          if (!tersimpan) {
            setArah(null)
            setGalat(`Could not place "${nama}" on the map, so no direction is shown rather than a guessed one.`)
          }
          return
        }
        tulisSimpanan(nama, k)
        setArah({ azimut: azimutKiblat(k.lat, k.lng), jarakKm: jarakKeKabah(k.lat, k.lng) })
      })
      .catch(() => { if (!batal && !tersimpan) setGalat('Lookup failed. Check your connection.') })
      .finally(() => { if (!batal) setMemuat(false) })
    return () => { batal = true }
  }, [kota, negara])

  if (memuat && !arah) {
    return <p className="text-[11px] font-semibold text-neutral-500">Working out the direction…</p>
  }
  if (galat) {
    return <p className="text-[11px] leading-snug text-amber-700 dark:text-amber-300">{galat}</p>
  }
  if (!arah) return null

  const bulat = Math.round(arah.azimut)
  // Jarum diputar berlawanan dengan arah hadap telepon, sehingga ia tetap
  // menunjuk kiblat di dunia nyata saat teleponnya diputar.
  const putaran = heading === null ? arah.azimut : selisihSudut(heading, arah.azimut)
  const beda = heading === null ? null : Math.abs(selisihSudut(heading, arah.azimut))
  const tepat = beda !== null && beda <= 5

  return (
    <div>
      <div className="flex items-center gap-3">
        <div
          className={`relative h-24 w-24 shrink-0 rounded-full border-2 ${
            tepat ? 'border-emerald-500' : 'border-neutral-300 dark:border-white/20'
          }`}
          role="img"
          aria-label={`Qibla is ${bulat} degrees from true north`}
        >
          {(['N', 'E', 'S', 'W'] as const).map((m, i) => (
            <span
              key={m}
              className="absolute text-[9px] font-black text-neutral-400"
              style={{
                top: i === 0 ? 2 : i === 2 ? undefined : '50%',
                bottom: i === 2 ? 2 : undefined,
                left: i === 3 ? 3 : i === 1 ? undefined : '50%',
                right: i === 1 ? 3 : undefined,
                transform: i % 2 === 0 ? 'translateX(-50%)' : 'translateY(-50%)',
              }}
            >
              {m}
            </span>
          ))}
          <span
            aria-hidden
            className="absolute left-1/2 top-1/2 origin-bottom"
            style={{ transform: `translate(-50%,-100%) rotate(${putaran}deg)`, transition: 'transform 0.15s linear' }}
          >
            <span className={`block h-9 w-1 rounded-full ${tepat ? 'bg-emerald-500' : 'bg-brand'}`} />
          </span>
          <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-500" />
        </div>

        <div className="min-w-0">
          <div className="text-[30px] font-black leading-none tabular-nums text-ink dark:text-white">{bulat}°</div>
          <div className="text-[11px] font-bold text-neutral-500">{mataAngin(arah.azimut)} of true north</div>
          <div className="mt-1 text-[10px] text-neutral-400">
            {arah.jarakKm.toLocaleString()} km to the Kaaba
          </div>
          {beda !== null && (
            <div className={`mt-1 text-[11px] font-bold ${tepat ? 'text-emerald-600' : 'text-brand'}`}>
              {tepat
                ? 'Facing the Qibla'
                : `Turn ${Math.abs(Math.round(selisihSudut(heading!, arah.azimut)))}° ${
                    selisihSudut(heading!, arah.azimut) > 0 ? 'right' : 'left'
                  }`}
            </div>
          )}
        </div>
      </div>

      {heading === null && !ditolak && (
        <button
          onClick={minta}
          className="mt-2 min-h-[44px] w-full rounded-xl bg-brand px-3 text-[12px] font-bold text-white"
        >
          Use the phone compass
        </button>
      )}
      {ditolak && (
        <p className="mt-2 text-[10px] leading-snug text-neutral-500">
          Compass access was declined. The number above still works — set {bulat}° on any compass.
        </p>
      )}

      <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">
        The angle is pure geometry and is exact: the great-circle bearing from {kota} to the Kaaba, computed on this
        device with nothing sent anywhere. What is not exact is the phone&apos;s compass — it reads magnetic north
        rather than true north, and it drifts near metal, speakers, magnetic cases, and cars. Trust the number over the
        needle, and check it against the rows of a nearby mosque when you can.
      </p>
    </div>
  )
}

export default Kiblat

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { deretMetrik, rentangPribadi } from '../lib/riwayatVitals'
import { getWorkouts } from '../lib/workoutStore'

// ─────────────────────────────────────────────────────────────────────────────
// Empat widget yang membaca RENTANG WAKTU LEBIH PANJANG daripada tujuh hari.
//
// MENGAPA PERLU. Seluruh grafik beranda sebelumnya berjendela tujuh hari, dan
// tujuh hari adalah jendela yang tepat untuk menjawab "bagaimana pekan ini"
// tetapi tidak dapat menjawab "apakah ini berubah". Nadi istirahat yang naik
// tiga denyut selama sebulan tidak pernah terlihat pada grafik tujuh hari:
// tiap pekan ia tampak datar.
//
// YANG TIDAK DILAKUKAN DI SINI. Tidak ada angka gabungan — tidak ada "skor
// pemulihan", tidak ada "usia biologis", tidak ada persentase kesiapan. Tiap
// ubin menampilkan satu besaran yang diukur, dibandingkan terhadap kebiasaan
// ORANG ITU SENDIRI, dan menyebut jumlah titik yang menjadi dasarnya. Bila
// titiknya kurang, ubinnya tidak digambar sama sekali.
// ─────────────────────────────────────────────────────────────────────────────

function Kepala({ judul, ke }: { judul: string; ke: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">{judul}</h2>
      <Link to={ke} className="t-kecil flex min-h-[40px] items-center font-bold text-brand">Buka →</Link>
    </div>
  )
}

/** Grafik garis kecil dengan pita kebiasaan di belakangnya. */
function Garis({ nilai, bawah, atas, warna }: { nilai: number[]; bawah?: number; atas?: number; warna: string }) {
  const L = 100
  const T = 34
  const semua = [...nilai, ...(bawah != null ? [bawah] : []), ...(atas != null ? [atas] : [])]
  const min = Math.min(...semua)
  const maks = Math.max(...semua)
  const bentang = maks - min || 1
  const y = (v: number) => T - ((v - min) / bentang) * (T - 4) - 2
  const x = (i: number) => (i / Math.max(1, nilai.length - 1)) * L
  const jalur = nilai.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${L} ${T}`} preserveAspectRatio="none" className="mt-2 h-9 w-full" aria-hidden>
      {bawah != null && atas != null && (
        <rect x="0" y={y(atas)} width={L} height={Math.max(1, y(bawah) - y(atas))} className="fill-current text-neutral-300/40 dark:text-white/12" />
      )}
      <path d={jalur} fill="none" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" className={`stroke-current ${warna}`} />
      <circle cx={x(nilai.length - 1)} cy={y(nilai[nilai.length - 1])} r="2.2" className={`fill-current ${warna}`} />
    </svg>
  )
}

// ── Nadi istirahat 30 hari, dengan pita kebiasaan Anda sendiri ─────────────
//
// Nilainya justru pada PITA-nya: 58 bpm tidak dapat disebut baik atau buruk
// tanpa tahu siapa orangnya, tetapi 58 pada orang yang tiga bulan terakhir
// berada di 46-52 adalah sesuatu yang berubah — dan perubahan itu fakta.
export function UbinNadiPanjang() {
  const { deret, rentang } = useMemo(() => ({
    deret: deretMetrik('restingHr', 30),
    rentang: rentangPribadi('restingHr'),
  }), [])
  if (deret.length < 7) return null
  const nilai = deret.map((d) => d.nilai)
  const kini = nilai[nilai.length - 1]
  const luar = rentang && (kini < rentang.bawah || kini > rentang.atas)
  return (
    <section>
      <Kepala judul="Nadi istirahat 30 hari" ke="/tubuh" />
      <div className="kaca rounded-3xl p-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-black leading-none tabular-nums nyala text-ink dark:text-white">{Math.round(kini)}</span>
          <span className="t-mikro font-bold text-neutral-400">bpm</span>
          <span className="t-mikro ml-auto shrink-0 tabular-nums text-neutral-400">{deret.length} hari tercatat</span>
        </div>
        <Garis nilai={nilai} bawah={rentang?.bawah} atas={rentang?.atas} warna={luar ? 'text-amber-500' : 'text-rose-500'} />
        <p className="t-mikro mt-1 leading-snug text-neutral-400">
          {rentang
            ? `Pita abu-abu adalah kebiasaan Anda sendiri, ${Math.round(rentang.bawah)}–${Math.round(rentang.atas)} bpm. ${luar ? 'Hari ini di luar pita itu — satu hari di luar pita bukan penyakit; yang berarti adalah bila ia menetap beberapa hari.' : 'Hari ini masih di dalamnya.'}`
            : 'Belum cukup titik untuk menyebut kebiasaan Anda sendiri; yang digambar baru garisnya.'}
        </p>
      </div>
    </section>
  )
}

// ── Tidur 14 malam ─────────────────────────────────────────────────────────
export function UbinTidurDuaPekan() {
  const { state } = useStore()
  const malam = useMemo(() => {
    const peta = new Map<string, number>()
    for (const l of state.sleepLogs ?? []) {
      if (typeof l?.hours === 'number' && l.hours > 0 && l.date) peta.set(l.date, l.hours)
    }
    const out: { tanggal: string; jam: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5)
      const p = (x: number) => String(x).padStart(2, '0')
      const t = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
      out.push({ tanggal: t, jam: peta.get(t) ?? 0 })
    }
    return out
  }, [state.sleepLogs])

  const tercatat = malam.filter((m) => m.jam > 0)
  if (tercatat.length < 4) return null
  const urut = [...tercatat].map((m) => m.jam).sort((a, b) => a - b)
  const tengah = urut.length % 2 ? urut[(urut.length - 1) / 2] : (urut[urut.length / 2 - 1] + urut[urut.length / 2]) / 2
  const maks = Math.max(...urut, 9)
  const dibawah7 = tercatat.filter((m) => m.jam < 7).length

  return (
    <section>
      <Kepala judul="Tidur 14 malam" ke="/pola-tidur" />
      <div className="kaca rounded-3xl p-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-black leading-none tabular-nums nyala text-ink dark:text-white">{(Math.round(tengah * 10) / 10).toFixed(1)}</span>
          <span className="t-mikro font-bold text-neutral-400">jam — nilai tengah</span>
          <span className="t-mikro ml-auto shrink-0 tabular-nums text-neutral-400">{tercatat.length}/14 malam</span>
        </div>
        {/* Garis tujuh jam digambar sebagai acuan, bukan sebagai target yang
            gagal dicapai: kebutuhan tidur berbeda antar-orang, dan tujuh jam
            hanyalah batas bawah yang paling sering dipakai untuk orang dewasa. */}
        <span className="relative mt-2 flex h-14 items-end gap-[3px]" aria-hidden>
          <span className="absolute inset-x-0 border-t border-dashed border-neutral-400/60" style={{ bottom: `${(7 / maks) * 100}%` }} />
          {malam.map((m, i) => (
            <span
              key={i}
              className={`flex-1 rounded-sm ${m.jam === 0 ? 'bg-neutral-200 dark:bg-white/10' : m.jam >= 7 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ height: m.jam > 0 ? `${(m.jam / maks) * 100}%` : '3px' }}
            />
          ))}
        </span>
        <p className="t-mikro mt-1 leading-snug text-neutral-400">
          Garis putus-putus di 7 jam adalah acuan yang paling sering dipakai untuk orang dewasa, bukan target Anda —
          kebutuhan tidur berbeda antar-orang. {dibawah7} dari {tercatat.length} malam di bawahnya. Batang kosong berarti malam itu tidak tercatat.
        </p>
      </div>
    </section>
  )
}

// ── Menit latihan per pekan, delapan pekan ─────────────────────────────────
//
// Delapan pekan, bukan tujuh hari: yang ingin diketahui di sini bukan "pekan
// ini bagaimana" melainkan "apakah ini bertahan". Garis 150 menit adalah
// anjuran mingguan aktivitas sedang untuk orang dewasa (WHO) — disebut sebagai
// anjuran, bukan sebagai nilai ujian.
export function UbinMuatanPekan() {
  const pekan = useMemo(() => {
    const w = getWorkouts()
    const out: number[] = []
    for (let p = 7; p >= 0; p--) {
      const akhir = Date.now() - p * 7 * 864e5
      const mulai = akhir - 7 * 864e5
      let menit = 0
      for (const s of w) {
        const t = Date.parse(s.mulai)
        if (Number.isFinite(t) && t > mulai && t <= akhir) menit += (Number(s.durasi) || 0) / 60
      }
      out.push(Math.round(menit))
    }
    return out
  }, [])

  if (!pekan.some((x) => x > 0)) return null
  const maks = Math.max(...pekan, 150)
  const ini = pekan[pekan.length - 1]
  const lalu = pekan[pekan.length - 2] ?? 0

  return (
    <section>
      <Kepala judul="Menit latihan per pekan" ke="/latihan" />
      <div className="kaca rounded-3xl p-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-black leading-none tabular-nums nyala text-ink dark:text-white">{ini}</span>
          <span className="t-mikro font-bold text-neutral-400">menit pekan ini</span>
          <span className="t-mikro ml-auto shrink-0 tabular-nums text-neutral-400">
            {lalu > 0 ? `${ini >= lalu ? '+' : ''}${ini - lalu} vs pekan lalu` : '8 pekan'}
          </span>
        </div>
        <span className="relative mt-2 flex h-14 items-end gap-[3px]" aria-hidden>
          <span className="absolute inset-x-0 border-t border-dashed border-neutral-400/60" style={{ bottom: `${(150 / maks) * 100}%` }} />
          {pekan.map((m, i) => (
            <span
              key={i}
              className={`flex-1 rounded-sm ${i === pekan.length - 1 ? 'bg-brand' : 'bg-neutral-300 dark:bg-white/20'}`}
              style={{ height: m > 0 ? `${(m / maks) * 100}%` : '3px' }}
            />
          ))}
        </span>
        <p className="t-mikro mt-1 leading-snug text-neutral-400">
          Garis putus-putus 150 menit adalah anjuran mingguan aktivitas sedang untuk orang dewasa (WHO). Yang dihitung
          hanya sesi yang tercatat di aplikasi ini, jadi jalan kaki yang tidak dicatat tidak masuk.
        </p>
      </div>
    </section>
  )
}

// ── Kalori tercatat masuk vs kalori latihan ────────────────────────────────
//
// UBIN INI PALING MUDAH DISALAHPAHAMI, dan karena itu keterangannya paling
// panjang. Dua batang di sini BUKAN neraca energi: sisi masuk hanya sebesar
// yang sempat dicatat, sisi keluar tidak memuat metabolisme basal yang justru
// bagian terbesarnya, dan keduanya punya galat besar. Yang jujur dikatakan
// ubin ini hanya satu hal: seberapa banyak yang sudah Anda catat hari ini.
export function UbinKaloriBanding() {
  const { state } = useStore()
  const hariIni = new Date().toISOString().slice(0, 10)
  const masuk = useMemo(() => {
    let k = 0
    for (const f of state.foods ?? []) if (f?.date === hariIni) k += Number(f.kcal) || 0
    return Math.round(k)
  }, [state.foods, hariIni])
  const latihan = useMemo(() => {
    let k = 0
    for (const s of getWorkouts()) {
      const t = Date.parse(s.mulai)
      if (Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === hariIni) k += Number(s.kcal) || 0
    }
    return Math.round(k)
  }, [hariIni])

  if (masuk === 0 && latihan === 0) return null
  const maks = Math.max(masuk, latihan, 1)

  return (
    <section>
      <Kepala judul="Tercatat hari ini" ke="/nutrisi" />
      <div className="kaca rounded-3xl p-3">
        <div className="flex flex-col gap-2">
          {[
            { nama: 'Makanan tercatat', nilai: masuk, kelas: 'bg-brand' },
            { nama: 'Kalori latihan', nilai: latihan, kelas: 'bg-amber-500' },
          ].map((b) => (
            <div key={b.nama}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="t-mikro font-bold text-neutral-500">{b.nama}</span>
                <span className="t-kecil font-black tabular-nums text-ink dark:text-white">{b.nilai} kkal</span>
              </div>
              <span className="mt-1 block h-2 rounded-full bg-neutral-200 dark:bg-white/10" aria-hidden>
                <span className={`block h-full rounded-full ${b.kelas}`} style={{ width: `${(b.nilai / maks) * 100}%` }} />
              </span>
            </div>
          ))}
        </div>
        <p className="t-mikro mt-2 leading-snug text-neutral-400">
          Ini BUKAN neraca energi. Sisi makanan hanya sebesar yang sempat dicatat, sisi latihan tidak memuat metabolisme
          basal — yang justru bagian terbesar pemakaian energi harian — dan keduanya punya galat besar. Yang dapat
          dibaca dari sini hanya seberapa lengkap catatan hari ini.
        </p>
      </div>
    </section>
  )
}

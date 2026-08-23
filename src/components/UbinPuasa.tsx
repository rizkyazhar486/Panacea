import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { muatSetelan, jadwalHariIni, menitSekarang, fmtMenit, type JadwalHari } from '../lib/adzan'

// ─────────────────────────────────────────────────────────────────────────────
// Widget puasa — dua bentuk puasa yang benar-benar dijalani pemakai aplikasi
// ini, dan keduanya dihitung dari waktu yang sudah ada:
//
//   1. PUASA SYARIAT (Ramadan, Senin-Kamis, Ayyamul Bidh): dari Subuh sampai
//      Magrib, memakai jadwal salat kota yang sudah dipilih di halaman Adzan.
//      Tidak ada jadwal baru yang diminta ke pemakainya.
//   2. PUASA JENDELA MAKAN (16:8 dan sejenisnya): dari jam berhenti makan yang
//      ditekan sendiri.
//
// YANG TIDAK DILAKUKAN. Tidak ada klaim manfaat kesehatan yang ditempelkan ke
// hitungan jam ini — "autofagi mulai jam ke-16" dan sejenisnya beredar luas
// tetapi berasal dari penelitian hewan dan tidak dapat diukur pada orang lewat
// jam tangan. Yang ditampilkan hanya BERAPA LAMA, karena itulah satu-satunya
// yang benar-benar diketahui.
//
// Peringatan yang tetap ditulis: puasa panjang tidak sama amannya bagi semua
// orang — pengguna insulin atau sulfonilurea, ibu hamil, dan yang punya
// riwayat gangguan makan perlu bicara dengan dokternya lebih dahulu. Kalimat
// itu tidak dipindahkan ke halaman lain, karena yang membacanya di sini juga
// yang menekan tombolnya.
// ─────────────────────────────────────────────────────────────────────────────

const KUNCI = 'pmd_puasa_v1'

function baca(): number | null {
  try {
    const v = Number(JSON.parse(localStorage.getItem(KUNCI) || 'null'))
    return Number.isFinite(v) && v > 0 ? v : null
  } catch { return null }
}
function simpan(v: number | null) {
  try {
    if (v == null) localStorage.removeItem(KUNCI)
    else localStorage.setItem(KUNCI, JSON.stringify(v))
  } catch { /* kuota */ }
}

function jamMenit(ms: number): string {
  const menit = Math.max(0, Math.floor(ms / 60_000))
  return `${Math.floor(menit / 60)} j ${String(menit % 60).padStart(2, '0')} m`
}

export function UbinPuasa() {
  const setelan = useMemo(muatSetelan, [])
  const [jadwal, setJadwal] = useState<JadwalHari | null>(null)
  const [mulai, setMulai] = useState<number | null>(baca)
  const [, paksa] = useState(0)

  useEffect(() => {
    let hidup = true
    void jadwalHariIni(setelan.kota, setelan.negara, setelan.metode)
      .then((j) => { if (hidup) setJadwal(j) })
      .catch(() => { /* tanpa jadwal, bagian syariat tidak digambar */ })
    return () => { hidup = false }
  }, [setelan.kota, setelan.negara, setelan.metode])

  useEffect(() => {
    const id = window.setInterval(() => paksa((n) => n + 1), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const kini = menitSekarang()
  const subuh = jadwal?.waktu.find((w) => w.salat === 'Fajr')?.menit ?? null
  const magrib = jadwal?.waktu.find((w) => w.salat === 'Maghrib')?.menit ?? null

  // Bagian syariat: di antara Subuh dan Magrib berarti sedang waktu puasa;
  // sesudah Magrib yang ditampilkan hitungan menuju Subuh besok.
  let sedangSiang = false
  let sisaMenit: number | null = null
  let bagian = 0
  if (subuh != null && magrib != null) {
    sedangSiang = kini >= subuh && kini < magrib
    if (sedangSiang) {
      sisaMenit = magrib - kini
      bagian = (kini - subuh) / Math.max(1, magrib - subuh)
    } else {
      sisaMenit = kini < subuh ? subuh - kini : 1440 - kini + subuh
    }
  }

  const lamaJendela = mulai ? Date.now() - mulai : 0

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Puasa</h2>
        <Link to="/prayer-times" className="t-kecil flex min-h-[40px] items-center font-bold text-brand">
          Jadwal →
        </Link>
      </div>

      <div className="kaca rounded-3xl p-3">
        {subuh != null && magrib != null ? (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[26px] font-black leading-none tabular-nums nyala text-ink dark:text-white">
                {sisaMenit != null ? fmtMenit(sisaMenit) : '—'}
              </span>
              <span className="t-mikro font-bold text-neutral-400">
                {sedangSiang ? 'menuju Magrib' : 'menuju Subuh'}
              </span>
              <span className="t-mikro ml-auto shrink-0 truncate text-neutral-400">{jadwal?.kota}</span>
            </div>

            {sedangSiang && (
              <span className="mt-2 block h-2.5 w-full rounded-full bg-neutral-200 dark:bg-white/10" aria-hidden>
                <span className="block h-full rounded-full bg-brand cahaya-hijau" style={{ width: `${Math.max(2, bagian * 100)}%` }} />
              </span>
            )}

            <p className="t-mikro mt-1.5 tabular-nums text-neutral-400">
              Subuh {String(Math.floor(subuh / 60)).padStart(2, '0')}.{String(subuh % 60).padStart(2, '0')} · Magrib{' '}
              {String(Math.floor(magrib / 60)).padStart(2, '0')}.{String(magrib % 60).padStart(2, '0')} · sumber jadwal salat kota Anda
            </p>
          </>
        ) : (
          <p className="t-kecil text-neutral-500">Jadwal salat belum termuat — bagian puasa syariat menunggu jadwal kota Anda.</p>
        )}

        {/* Jendela makan, terpisah dan tidak dicampur dengan puasa syariat:
            keduanya diawali dan diakhiri oleh hal yang berbeda, dan
            menggabungkannya menjadi satu angka akan salah bagi keduanya. */}
        <div className="mt-3 border-t border-neutral-100 pt-2 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1">
              <span className="t-kecil block font-bold text-ink dark:text-white">Jendela makan</span>
              <span className="t-mikro block truncate text-neutral-400">
                {mulai
                  ? `Berhenti makan pukul ${new Date(mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} · ${jamMenit(lamaJendela)} berjalan`
                  : 'Tekan saat berhenti makan'}
              </span>
            </span>
            <button
              onClick={() => { const t = mulai ? null : Date.now(); simpan(t); setMulai(t) }}
              className={`t-kecil min-h-[40px] shrink-0 rounded-xl px-3 font-bold transition ${
                mulai ? 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-200' : 'bg-brand text-white'
              }`}
            >
              {mulai ? 'Buka' : 'Mulai'}
            </button>
          </div>
        </div>

        <p className="t-mikro mt-2 leading-snug text-neutral-400">
          Hanya lamanya yang ditampilkan — tidak ada klaim manfaat pada jam ke sekian. Pengguna insulin atau sulfonilurea, ibu hamil, dan yang punya riwayat gangguan makan sebaiknya berbicara dengan dokternya dahulu.
        </p>
      </div>
    </section>
  )
}

export default UbinPuasa

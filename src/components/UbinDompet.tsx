import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, backendEnabled } from '../lib/api'

// ─────────────────────────────────────────────────────────────────────────────
// Saldo PNC di beranda, bukan di bilah judul.
//
// MENGAPA PINDAH. Di bilah judul saldo menempati 70-90 px permanen pada layar
// 390 px — ruang yang diambil dari judul halaman, yang lalu terpotong menjadi
// "Ber…". Saldo bukan angka yang perlu terbaca dari setiap halaman; ia perlu
// terbaca saat seseorang memang sedang memikirkan saldonya, dan tempat untuk itu
// adalah beranda.
//
// SALDONYA DIAMBIL DARI SERVER, BUKAN DARI SIMPANAN DI PERANGKAT.
//
// Percobaan pertama membaca state.wallet.balance, dan itu SALAH — bukan sekadar
// kurang segar. Simpanan di perangkat hanya diperbarui ketika halaman Tagihan
// dibuka dan memanggil syncWalletBalance; siapa pun yang belum pernah membukanya
// pada perangkat itu akan melihat angka awal. Akibatnya beranda menuliskan
// "0 PNC" sementara halaman Tagihan pada layar yang sama menuliskan "25 PNC",
// dan pemiliknya berhak menyimpulkan salah satunya berbohong soal uangnya. Untuk
// angka uang, satu-satunya sumber yang sah adalah server.
//
// KETIGA KEADAAN DITULIS BERBEDA, dan tidak ada yang menyamar sebagai nol:
//   - sedang diambil        → "Memuat…", tanpa angka
//   - server tak terjangkau → sebab kegagalannya disebut, angka tidak ditebak
//   - berhasil, saldo nol   → "0" apa adanya; nol bukan kesalahan, tanpa warna
//                             peringatan dan tanpa diganti ajakan isi ulang yang
//                             menyamar sebagai angka
//
// TINDAKAN YANG DITAWARKAN HANYA YANG BENAR-BENAR ADA. Bentuk yang menjadi
// rujukan memuat empat tombol — Isi Ulang, Tarik Tunai, Transfer, Minta. Dua
// yang terakhir tidak ada di aplikasi ini: tidak ada jalur kirim PNC antar
// pengguna maupun permintaan uang. Menampilkannya sebagai tombol kelabu atau
// tombol yang membuka halaman yang tidak memuatnya sama-sama menjanjikan sesuatu
// yang tidak dapat ditepati, jadi yang dipasang hanya tiga yang berfungsi, dan
// ketiadaan dua sisanya disebutkan sebagai kalimat, bukan disembunyikan.
// ─────────────────────────────────────────────────────────────────────────────

type Keadaan =
  | { jenis: 'memuat' }
  | { jenis: 'ada'; saldo: number }
  | { jenis: 'gagal' }
  | { jenis: 'luring'; saldo: number }

const TINDAKAN = [
  { ke: '/billing', label: 'Top Up', emoji: '➕' },
  { ke: '/billing', label: 'Withdraw', emoji: '🏦' },
  { ke: '/keuangan', label: 'History', emoji: '🧾' },
]

export function UbinDompet({ saldoLokal }: { saldoLokal: number }) {
  const [keadaan, setKeadaan] = useState<Keadaan>(
    backendEnabled ? { jenis: 'memuat' } : { jenis: 'luring', saldo: saldoLokal },
  )

  useEffect(() => {
    if (!backendEnabled) return
    let hidup = true
    api
      .wallet()
      .then((w) => { if (hidup) setKeadaan({ jenis: 'ada', saldo: w.balance }) })
      .catch(() => { if (hidup) setKeadaan({ jenis: 'gagal' }) })
    return () => { hidup = false }
  }, [])

  const saldo = keadaan.jenis === 'ada' || keadaan.jenis === 'luring' ? keadaan.saldo : null

  return (
    <section>
      <h2 className="t-kecil mb-2 font-black uppercase tracking-wide text-neutral-500">Wallet</h2>
      <div className="kaca overflow-hidden rounded-3xl">
        <Link to="/billing" className="block px-4 py-3.5 transition-transform duration-200 active:scale-[0.985]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="t-kecil font-semibold text-neutral-500">PanaceaToken Balance</p>
              <p className="mt-0.5 flex items-baseline gap-1.5">
                {saldo === null ? (
                  <span className="t-sedang font-bold text-neutral-400">
                    {keadaan.jenis === 'memuat' ? 'Loading…' : 'Unavailable'}
                  </span>
                ) : (
                  <>
                    <span className="text-2xl font-black tabular-nums leading-none text-ink dark:text-white">
                      {saldo.toLocaleString('en-GB')}
                    </span>
                    <span className="t-mikro font-bold text-neutral-400">PNC</span>
                  </>
                )}
              </p>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-xl dark:bg-brand/15" aria-hidden>
              🪙
            </span>
          </div>
          <p className="t-mikro mt-2 leading-snug text-neutral-500 dark:text-neutral-400">
            {keadaan.jenis === 'gagal'
              ? "Balance can't be fetched from the server right now. The old number isn't shown so it isn't mistaken for the current balance — tap to try again on the Billing page."
              : keadaan.jenis === 'luring'
                ? 'Recorded on this device only; the server is not currently connected.'
                : saldo === 0
                  ? 'No balance yet. PNC is used for consultations and subscriptions.'
                  : 'According to the server. Tap for transaction details.'}
          </p>
        </Link>

        {/* Tindakan cepat, dipisah garis supaya tidak terbaca sebagai bagian
            dari angkanya. Tinggi 64 px: melampaui lantai 40 px, dan ketiganya
            sama lebar sehingga letaknya terhafal. */}
        <div className="grid grid-cols-3 border-t border-neutral-100 dark:border-white/10">
          {TINDAKAN.map((t, i) => (
            <Link
              key={t.label}
              to={t.ke}
              className={`flex min-h-[64px] flex-col items-center justify-center gap-1 transition-colors hover:bg-neutral-50 dark:hover:bg-white/5 ${
                i > 0 ? 'border-l border-neutral-100 dark:border-white/10' : ''
              }`}
            >
              <span className="text-lg leading-none" aria-hidden>{t.emoji}</span>
              <span className="t-mikro font-bold text-neutral-600 dark:text-neutral-300">{t.label}</span>
            </Link>
          ))}
        </div>
      </div>
      <p className="t-mikro mt-1 leading-snug text-neutral-400">
        Sending PNC between users and money requests don't exist in this app yet, so the button isn't shown.
      </p>
    </section>
  )
}

export default UbinDompet

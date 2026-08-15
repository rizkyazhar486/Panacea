import { Link } from 'react-router-dom'

// ─────────────────────────────────────────────────────────────────────────────
// Saldo PNC di beranda, bukan di bilah judul.
//
// MENGAPA PINDAH. Di bilah judul saldo menempati 70-90 px permanen pada layar
// 390 px — ruang yang diambil dari judul halaman, yang lalu terpotong menjadi
// "Ber…". Saldo bukan angka yang perlu terbaca dari setiap halaman; ia perlu
// terbaca saat seseorang memang sedang memikirkan saldonya, dan tempat untuk itu
// adalah beranda.
//
// SALDO NOL DITULIS NOL. Godaannya besar untuk menyembunyikan kartu ini ketika
// saldonya kosong, atau menggantinya dengan ajakan mengisi ulang yang menyamar
// sebagai angka. Keduanya berbohong dengan cara yang berbeda: yang pertama
// membuat orang mengira fiturnya tidak ada, yang kedua membuat kekosongan tampak
// seperti kekurangan yang mendesak. Yang ditulis adalah angkanya apa adanya,
// beserta satu kalimat yang menerangkan apa gunanya PNC — sebab pemilik saldo
// nol justru yang paling mungkin belum tahu.
//
// TIDAK ADA WARNA PERINGATAN pada saldo nol. Nol bukan kesalahan.
// ─────────────────────────────────────────────────────────────────────────────

export function UbinDompet({ saldo }: { saldo: number }) {
  const kosong = !(saldo > 0)
  return (
    <section>
      <h2 className="t-kecil mb-2 font-black uppercase tracking-wide text-neutral-500">Dompet</h2>
      <Link
        to="/billing"
        className="kaca block rounded-3xl px-4 py-3.5 transition-transform duration-200 active:scale-[0.985]"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="t-kecil font-semibold text-neutral-500">Saldo PanaceaToken</p>
            <p className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-black tabular-nums leading-none text-ink dark:text-white">
                {saldo.toLocaleString('id-ID')}
              </span>
              <span className="t-mikro font-bold text-neutral-400">PNC</span>
            </p>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-xl dark:bg-brand/15" aria-hidden>
            🪙
          </span>
        </div>
        <p className="t-mikro mt-2 leading-snug text-neutral-500 dark:text-neutral-400">
          {kosong
            ? 'Belum ada saldo. PNC dipakai untuk konsultasi dan langganan; isi ulangnya lewat halaman ini.'
            : 'Dipakai untuk konsultasi dan langganan. Ketuk untuk rincian transaksinya.'}
        </p>
      </Link>
    </section>
  )
}

export default UbinDompet

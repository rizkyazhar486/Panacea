import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { tr } from '../lib/i18n'
import { useBahasa } from '../lib/useBahasa'
import { Link } from 'react-router-dom'
import { WIDGETS } from '../lib/homeWidgets'
import { rupa, urutkanKategori } from '../lib/kategoriRupa'
import { Kilau } from './Rupa'

// ─────────────────────────────────────────────────────────────────────────────
// Kisi fitur bergaya super-app.
//
// BENTUK YANG DITIRU, DAN ALASAN TIAP BAGIANNYA. Aplikasi dompet dan belanja
// besar menyusun beranda dengan pola yang sama, dan pola itu bertahan bukan
// karena selera melainkan karena memecahkan satu masalah nyata: bagaimana
// menaruh seratus lebih fitur di satu layar tanpa membuat orang menyerah.
//
//   1. DIKELOMPOKKAN, BUKAN SATU DAFTAR PANJANG. Ingatan bekerja pada kelompok
//      berukuran kecil; seratus lambang berjajar tanpa sekat menjadi kabur dan
//      tidak satu pun terhafal letaknya.
//
//   2. EMPAT KOLOM, DUA BARIS PER BAGIAN. Delapan sudah cukup untuk mewakili
//      satu wilayah, dan sisanya diambil lewat "Lihat semua". Menampilkan
//      seluruh isi tiap kelompok membuat halaman kembali menjadi daftar
//      panjang yang tadi hendak dihindari.
//
//   3. KEPING PENYARING YANG DAPAT DIGESER. Ia bukan hiasan: pada sebelas
//      kelompok, keping inilah yang memungkinkan orang melompat ke wilayahnya
//      tanpa menggulir melewati wilayah yang tidak ia butuhkan.
//
//   4. LABEL DI BAWAH LAMBANG, BUKAN DI SAMPINGNYA. Susunan menurun memuat
//      empat kolom pada layar 390 px; susunan menyamping hanya memuat dua.
//
// YANG SENGAJA TIDAK DITIRU. Aplikasi yang menjadi contoh menaruh hitung mundur
// "berakhir dalam 11:10:26", lencana "baru", dan tawaran yang berkedip — semua
// itu bekerja karena menciptakan rasa takut tertinggal, dan itu tidak punya
// tempat pada aplikasi kesehatan. Yang diambil di sini adalah cara MENYUSUN
// fitur, bukan cara mendesak orang.
// ─────────────────────────────────────────────────────────────────────────────

/** Satu lambang fitur: gambar di atas, label pendek di bawahnya. */
function Lambang({ w }: { w: (typeof WIDGETS)[number] }) {
  return (
    <Link
      to={w.ke}
      className="flex min-h-[76px] flex-col items-center gap-1 rounded-2xl p-1 text-center transition active:scale-95"
    >
      {/* Latarnya mengambil warna KELOMPOKNYA. Dua ratus lambang berlatar
          abu-abu yang sama terbaca seperti daftar inventaris; warna per
          kelompok membuat mata menemukan bagiannya tanpa membaca judul, dan
          itu bukan hiasan melainkan navigasi. */}
      <span
        aria-hidden
        className={`flex h-11 w-11 items-center justify-center rounded-2xl text-[20px] ${rupa(w.kategori).bg}`}
      >
        {w.emoji}
      </span>
      {/* Dua baris, lalu dipotong. Label yang boleh memanjang membuat tinggi
          tiap ubin berbeda-beda dan barisnya tidak lagi sejajar. */}
      <span className="line-clamp-2 text-[10.5px] font-bold leading-tight text-ink dark:text-white">
        {tr(w.label)}
      </span>
    </Link>
  )
}

const PER_BAGIAN = 8

function Bagian({ kategori, daftar }: { kategori: string; daftar: typeof WIDGETS }) {
  const [semua, setSemua] = useState(false)
  const tampil = semua ? daftar : daftar.slice(0, PER_BAGIAN)
  const sisa = daftar.length - PER_BAGIAN

  // Kartu bagiannya ikut mengambil warna kelompoknya, sebagai gradien LEMBUT
  // di lapisan belakang — tulisannya tetap memakai tinta biasa, sehingga rasio
  // kontrasnya tidak berubah-ubah mengikuti gradien.
  return (
    <section id={`bagian-${kategori}`} className="relative isolate overflow-hidden rounded-3xl bg-white p-3 dark:bg-white/5">
      <Kilau dari={rupa(kategori).kilau[0]} ke={rupa(kategori).kilau[1]} kelas="dark:opacity-20" />
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-[13px] font-black">
          <span aria-hidden className={`h-4 w-1.5 shrink-0 rounded-full ${rupa(kategori).garis}`} />
          <span aria-hidden>{rupa(kategori).emoji}</span>
          <span className={rupa(kategori).teks}>{tr(rupa(kategori).label)}</span>
        </h3>
        {sisa > 0 && (
          <button
            onClick={() => setSemua((v) => !v)}
            className="flex h-10 shrink-0 items-center gap-1 text-[11px] font-bold text-brand"
          >
            {semua ? 'Show less' : `Show all (${daftar.length})`}
            <span aria-hidden>{semua ? '▲' : '›'}</span>
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 gap-1">
        {tampil.map((w) => <Lambang key={w.id} w={w} />)}
      </div>
    </section>
  )
}

/**
 * Kisi fitur beranda.
 *
 * Kelompoknya diturunkan DARI KATALOG, bukan ditulis ulang di sini. Dua daftar
 * yang berisi hal sama pasti berselisih setelah beberapa kali diubah, dan yang
 * ketinggalan biasanya yang ini — fitur baru akan muncul di pemilih widget
 * tetapi hilang dari kisi, tanpa ada yang menyadarinya.
 */
export function KisiFitur() {
  useBahasa() // menggambar ulang saat bahasanya berganti
  const [pilih, setPilih] = useState<string | null>(null)
  const [cari, setCari] = useState('')
  const [cariBuka, setCariBuka] = useState(false)
  const wadah = useRef<HTMLDivElement>(null)
  const kotak = useRef<HTMLInputElement>(null)

  // Pencarian mendahului penyaringan kelompok: begitu ada yang diketik,
  // kepingnya tidak lagi menentukan apa pun, dan membiarkannya tampak aktif
  // sementara hasilnya berasal dari seluruh katalog akan menyesatkan.
  const kunci = cari.trim().toLowerCase()
  const cocok = useMemo(
    () =>
      kunci
        ? WIDGETS.filter((w) =>
            `${w.label} ${w.ringkas} ${w.kategori} ${tr(w.label)} ${tr(w.ringkas)}`.toLowerCase().includes(kunci),
          )
        : [],
    [kunci],
  )

  const kelompok = useMemo(() => {
    const peta = new Map<string, typeof WIDGETS>()
    for (const w of WIDGETS) {
      if (!peta.has(w.kategori)) peta.set(w.kategori, [])
      peta.get(w.kategori)!.push(w)
    }
    // Diurutkan supaya olahraga berada paling depan — itu yang paling sering
    // benar-benar dibuka, dan yang paling ingin ditemukan cepat.
    const urut = urutkanKategori([...peta.keys()])
    return urut.map((k) => [k, peta.get(k)!] as [string, typeof WIDGETS])
  }, [])

  // Tanpa kelompok terpilih, kisi ini dulu membentangkan SELURUH kelompok
  // sekaligus — beranda menjadi 5.700 px, dan bagian yang paling berguna
  // (angka tubuh dan pintasan pilihan sendiri) terdorong jauh ke atas layar
  // oleh daftar yang tidak dicari siapa pun. Sekarang keping kelompoknya saja
  // yang tampak; kisinya terbuka setelah ada yang dipilih atau diketik.
  const terlihat = pilih ? kelompok.filter(([k]) => k === pilih) : []

  useEffect(() => { if (cariBuka) kotak.current?.focus() }, [cariBuka])

  // Letak penanda diukur dari keping yang sedang terpilih, bukan dihitung dari
  // lebar tetap: label kelompok panjangnya berbeda-beda dan angka jumlahnya pun
  // ikut melebarkan, jadi lebar yang ditebak akan selalu meleset pada sebagian.
  const keping = useRef<(HTMLButtonElement | null)[]>([])
  const [penanda, setPenanda] = useState({ kiri: 0, lebar: 0, tinggi: 40 })

  const nomorAktif = pilih === null ? 0 : kelompok.findIndex(([k]) => k === pilih) + 1

  useLayoutEffect(() => {
    if (kunci) return // keping tidak ditampilkan saat sedang mencari
    const el = keping.current[nomorAktif]
    if (!el) return
    setPenanda({ kiri: el.offsetLeft, lebar: el.offsetWidth, tinggi: el.offsetHeight })
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }, [nomorAktif, kunci])

  return (
    <section className="j-grup">
      <div className="flex items-center justify-between gap-2">
        <h2 className="t-kecil shrink-0 font-black uppercase tracking-wide text-neutral-500">All features</h2>

        {/* Kotak cari yang MEMANJANG saat diketuk, bukan kotak yang selalu
            terbentang. Dalam keadaan tertutup ia satu lambang 40 px, sehingga
            "Daftar lengkap" tetap muat di sebelahnya pada layar 390 px; saat
            dibuka ia mengambil seluruh baris, karena kotak ketik selebar 120 px
            hanya memperlihatkan tiga huruf dan membuat orang mengetik tanpa
            dapat memeriksa apa yang sudah diketiknya.

            MENGAPA ADA PENCARIAN DI SINI padahal bilah judul sudah punya. Kisi
            ini memuat 115 fitur dalam sepuluh kelompok; menemukan satu di
            antaranya lewat keping penyaring menuntut menebak kelompoknya dulu,
            dan tebakan itu sering meleset — "Gizi" ada di kelompok yang tidak
            selalu terduga. Mengetik tiga huruf melewati seluruh tebakan itu. */}
        <div className={`flex min-w-0 items-center gap-2 ${cariBuka ? 'flex-1' : ''}`}>
          {cariBuka ? (
            <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full border border-brand/30 bg-white px-3 dark:bg-white/10">
              <span aria-hidden className="text-neutral-400">⌕</span>
              <input
                ref={kotak}
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') { setCari(''); setCariBuka(false) } }}
                placeholder={`Cari di ${WIDGETS.length} fitur`}
                aria-label="Search features"
                className="t-kecil min-h-[40px] w-full min-w-0 bg-transparent font-semibold text-ink outline-none dark:text-white"
              />
              <button
                onClick={() => { setCari(''); setCariBuka(false) }}
                aria-label="Tutup pencarian"
                className="grid h-10 w-8 shrink-0 place-items-center text-lg leading-none text-neutral-400"
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setCariBuka(true)}
                aria-label="Search features"
                aria-expanded={false}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-600 transition-transform duration-200 hover:scale-105 dark:bg-white/10 dark:text-neutral-300"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" />
                </svg>
              </button>
              <Link to="/semua-fitur" className="t-kecil flex min-h-[40px] shrink-0 items-center font-bold text-brand">
                Full list →
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Hasil pencarian menggantikan keping dan kelompoknya sekaligus.
          Menampilkan hasil DI ATAS kelompok yang tetap terpampang membuat dua
          kisi berisi lambang serupa berdiri berdampingan, dan tidak ada cara
          bagi pembacanya menebak mana yang menjawab ketikannya. */}
      {kunci ? (
        cocok.length ? (
          <div className="rounded-3xl bg-white p-3 dark:bg-white/5">
            <p className="t-mikro mb-2 font-bold text-neutral-500">
              {cocok.length} fitur cocok dengan "{cari.trim()}"
            </p>
            <div className="grid grid-cols-4 gap-1">
              {cocok.map((w) => <Lambang key={w.id} w={w} />)}
            </div>
          </div>
        ) : (
          <p className="t-kecil rounded-3xl bg-white px-3 py-4 text-center leading-snug text-neutral-500 dark:bg-white/5">
            Tidak ada fitur yang cocok dengan "{cari.trim()}". Coba kata yang lebih pendek.
          </p>
        )
      ) : (
        <>

      {/* Keping penyaring dengan PENANDA YANG BERPINDAH.

          Sebelumnya tiap keping sekadar berganti warna sendiri-sendiri, dan
          perpindahan yang tidak dapat diikuti mata membuat deret sepanjang
          sebelas keping terasa berkedip: yang terlihat hanyalah "sesuatu di
          tempat lain kini hijau". Satu penanda tunggal yang meluncur dari
          keping lama ke keping baru menunjukkan hubungan keduanya, dan itulah
          seluruh gunanya.

          KEPING TERPILIH DIGULIRKAN KE DALAM PANDANGAN. Pada sebelas keping,
          keping kesembilan berada di luar layar setelah halaman digulirkan;
          tanpa ini, mengetuknya lalu menggulir turun membuat penyaring yang
          sedang aktif tidak terlihat sama sekali.

          Memakai .geser-aman supaya gerakan menyamping tidak bertabrakan
          dengan gerakan kembali milik sistem di tepi layar. */}
      <div className="geser-aman relative" ref={wadah}>
        {/* Penanda: satu-satunya bagian yang berwarna merek. Berada DI BELAKANG
            keping (z-0 terhadap keping z-10) supaya tulisannya tidak tertutup. */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-[2px] z-0 rounded-full bg-brand transition-[transform,width] duration-300 ease-out"
          style={{
            width: penanda.lebar,
            height: penanda.tinggi,
            transform: `translateX(${penanda.kiri}px)`,
            opacity: penanda.lebar ? 1 : 0,
          }}
        />
        <button
          ref={(el) => { keping.current[0] = el }}
          onClick={() => setPilih(null)}
          aria-pressed={pilih === null}
          className={`t-kecil relative z-10 flex min-h-[40px] items-center rounded-full px-4 font-bold transition-colors ${
            pilih === null ? 'text-ink' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
          }`}
          style={{ width: 'auto' }}
        >
          {tr('All')}
        </button>
        {kelompok.map(([k, d], i) => (
          <button
            key={k}
            ref={(el) => { keping.current[i + 1] = el }}
            onClick={() => setPilih(pilih === k ? null : k)}
            aria-pressed={pilih === k}
            className={`t-kecil relative z-10 flex min-h-[40px] items-center whitespace-nowrap rounded-full px-4 font-bold transition-colors ${
              pilih === k ? 'text-ink' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
            }`}
            style={{ width: 'auto' }}
          >
            <span aria-hidden className="mr-1">{rupa(k).emoji}</span>{tr(rupa(k).label)} <span className="ml-1 opacity-60">{d.length}</span>
          </button>
        ))}
      </div>

      {terlihat.length ? (
        <div className="j-grup">
          {terlihat.map(([k, d]) => <Bagian key={k} kategori={k} daftar={d} />)}
        </div>
      ) : (
        <p className="t-kecil px-1 leading-snug text-neutral-500">
          Pick a group above, or type to search {WIDGETS.length} features.
        </p>
      )}
        </>
      )}
    </section>
  )
}

export default KisiFitur

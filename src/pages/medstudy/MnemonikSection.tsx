import { useMemo, useState } from 'react'
import { Card, SectionTitle, Badge } from '../../components/ui'
import { LogoPenyakit } from '../../components/LogoFitur'
import { MNEMONIK, KELOMPOK_MNEMONIK, type Mnemonik } from '../../lib/mnemonik'

// ─────────────────────────────────────────────────────────────────────────────
// Halaman jembatan keledai untuk OSCE dan CBT.
//
// Bentuknya disusun mengikuti cara orang benar-benar memakainya saat ujian,
// bukan cara menyusun buku:
//
//   * AKRONIM DITAMPILKAN SEBAGAI DERET HURUF BESAR, bukan sebagai judul biasa.
//     Yang dipanggil dari ingatan saat gugup adalah bentuk kata itu, dan bentuk
//     hanya terbentuk bila hurufnya terlihat sebagai satuan yang terpisah.
//   * SATU HURUF SATU BARIS. Menggabungkan dua huruf dalam satu baris demi
//     menghemat tempat membuat urutannya kabur, padahal urutan itulah yang
//     dihafal.
//   * Kotak definisi diletakkan DI ATAS huruf-hurufnya. Akronim tanpa sandaran
//     arti akan terhafal namun tidak dapat dipakai.
//   * Bagian "jebakan" diberi warna merah dan diletakkan paling bawah, karena
//     yang dibaca terakhir sebelum masuk ruang ujian adalah yang paling melekat.
//
// Kartu tertutup secara baku dan dibuka satu per satu: seluruh mnemonik terbuka
// sekaligus menghasilkan halaman sepanjang belasan layar, dan halaman sepanjang
// itu tidak pernah dibaca ulang.
// ─────────────────────────────────────────────────────────────────────────────

function KartuMnemonik({ m }: { m: Mnemonik }) {
  const [buka, setBuka] = useState(false)

  return (
    <Card>
      {/* Kepala kartu — selalu terlihat, dan seluruhnya menjadi tombol supaya
          sasaran sentuhnya selebar kartu, bukan sebesar ikon panah. */}
      <button
        onClick={() => setBuka((x) => !x)}
        aria-expanded={buka}
        className="flex w-full items-start gap-3 text-left"
      >
        {/* max-w membatasi deret huruf menjadi empat per baris. Tanpa batas
            ini akronim sembilan huruf memakai seluruh lebar kartu dan mendesak
            kolom kanan sampai lencananya meluber 2 px keluar layar 390 px —
            terukur di peramban, bukan diduga. */}
        <span className="flex w-[111px] shrink-0 flex-col items-center gap-1">
          <span className="flex flex-wrap justify-center gap-[3px]">
            {m.akronim.split('').map((h, i) => (
              <span
                key={i}
                className="grid h-6 w-6 place-items-center rounded-md bg-brand text-[13px] font-black text-white"
              >
                {h}
              </span>
            ))}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-black leading-tight text-ink dark:text-white">{m.judul}</span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge>{m.kelompok}</Badge>
            <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">{m.untuk}</span>
            <span className="text-[10px] font-bold text-neutral-400">{m.huruf.length} huruf</span>
          </span>
        </span>
        <span className="shrink-0 text-[11px] font-bold text-brand">{buka ? 'tutup' : 'buka'}</span>
      </button>

      {buka && (
        <div className="mt-4 space-y-4">
          {/* Definisi — sandaran arti sebelum menghafal hurufnya. */}
          <div className="rounded-2xl border-l-4 border-brand bg-brand-50/60 p-3 dark:bg-brand/10">
            <div className="mb-1 text-[10px] font-black uppercase tracking-wide text-brand-dark dark:text-brand">
              Definisi
            </div>
            <p className="text-[12px] leading-relaxed text-ink dark:text-neutral-200">{m.definisi}</p>
          </div>

          {/* Huruf — satu baris satu huruf, supaya urutannya terbaca. */}
          <ol className="space-y-2">
            {m.huruf.map((h, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand text-[14px] font-black text-white">
                  {h.huruf}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-black text-ink dark:text-white">{h.arti}</span>
                  <span className="mt-0.5 block text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                    {h.isi}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          {/* Bagian bernomor. */}
          {m.bagian?.map((b, i) => (
            <div key={i} className="rounded-2xl bg-neutral-50 p-3 dark:bg-white/5">
              <div className="mb-2 flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-ink text-[10px] font-black text-white dark:bg-white dark:text-ink">
                  {i + 1}
                </span>
                <span className="text-[12px] font-black text-ink dark:text-white">{b.judul}</span>
              </div>
              <ul className="space-y-1.5 pl-1">
                {b.butir.map((x, j) => (
                  <li key={j} className="flex gap-2 text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-300">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-neutral-400" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Mengapa penting. */}
          {m.penting && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div className="mb-2 text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                Pentingnya {m.akronim}
              </div>
              <ul className="space-y-1.5">
                {m.penting.map((x, i) => (
                  <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-emerald-900 dark:text-emerald-200">
                    <span className="shrink-0 font-black">{i + 1}.</span>
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Jebakan — paling bawah, karena yang dibaca terakhir paling melekat. */}
          {m.jebakan && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-3 dark:border-rose-500/20 dark:bg-rose-500/10">
              <div className="mb-2 text-[10px] font-black uppercase tracking-wide text-rose-700 dark:text-rose-400">
                Sering menggugurkan
              </div>
              <ul className="space-y-1.5">
                {m.jebakan.map((x, i) => (
                  <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-rose-900 dark:text-rose-200">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-rose-500" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export default function MnemonikSection() {
  const [q, setQ] = useState('')
  const [kelompok, setKelompok] = useState<string | null>(null)

  const hasil = useMemo(() => {
    const kata = q.toLowerCase().trim().split(/\s+/).filter(Boolean)
    return MNEMONIK.filter((m) => {
      if (kelompok && m.kelompok !== kelompok) return false
      if (!kata.length) return true
      // Pencarian per kata, bukan per frasa utuh: "mnemonik stroke" tetap
      // menemukan FAST, sedangkan pencocokan frasa utuh tidak.
      const teks = `${m.akronim} ${m.judul} ${m.kelompok} ${m.definisi} ${m.huruf
        .map((h) => `${h.huruf} ${h.arti} ${h.isi}`)
        .join(' ')}`.toLowerCase()
      return kata.every((k) => teks.includes(k))
    })
  }, [q, kelompok])

  return (
    <div className="space-y-4">
      <SectionTitle
        icon={<LogoPenyakit size={20} />}
        title="Jembatan Keledai"
        subtitle="Akronim siap pakai untuk OSCE dan CBT — supaya tidak ada langkah yang terlewat saat gugup"
      />

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari akronim, penyakit, atau langkah…"
        className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-[13px] outline-none focus:border-brand dark:border-white/10 dark:bg-white/5"
      />

      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        <button
          onClick={() => setKelompok(null)}
          aria-pressed={kelompok === null}
          className={`flex h-10 shrink-0 items-center rounded-full px-3.5 text-[12px] font-bold transition ${
            kelompok === null ? 'bg-brand text-white' : 'bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          Semua
        </button>
        {KELOMPOK_MNEMONIK.map((k) => (
          <button
            key={k}
            onClick={() => setKelompok(k === kelompok ? null : k)}
            aria-pressed={k === kelompok}
            className={`flex h-10 shrink-0 items-center rounded-full px-3.5 text-[12px] font-bold transition ${
              k === kelompok ? 'bg-brand text-white' : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <p className="text-[11px] text-neutral-500">
        {hasil.length} dari {MNEMONIK.length} jembatan keledai
      </p>

      <div className="space-y-3">
        {hasil.map((m) => (
          <KartuMnemonik key={m.id} m={m} />
        ))}
      </div>

      {hasil.length === 0 && (
        <p className="text-center text-[13px] text-neutral-500">Tidak ada yang cocok — coba kata lain.</p>
      )}
    </div>
  )
}

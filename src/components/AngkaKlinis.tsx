import { useState } from 'react'
import { TINGKAT_INFO, type AngkaKlinis as Angka } from '../lib/angkaKlinis'

// ─────────────────────────────────────────────────────────────────────────────
// Tampilan angka yang dapat diperiksa.
//
// Keputusan bentuk yang membedakannya dari kartu angka aplikasi kebugaran:
//
//   * LENCANA TINGKAT KEYAKINAN SELALU TERLIHAT, tidak disembunyikan di balik
//     ketukan. Perbedaan antara angka yang diukur alat dan angka yang keluar
//     dari sebuah model adalah hal pertama yang perlu diketahui, bukan
//     keterangan tambahan.
//
//   * SATUAN DITULIS, dan bila memang tidak bersatuan hal itu DINYATAKAN
//     dengan kata-kata, bukan dibiarkan kosong. Angka tanpa satuan yang
//     dibiarkan kosong akan dibaca sebagai nilai dari seratus.
//
//   * "TIDAK DIPENGARUHI OLEH" diberi tempat sendiri dan diberi warna. Inilah
//     bagian yang paling sering dibutuhkan dan tidak pernah ada di aplikasi
//     mana pun — orang menduga tidur mempengaruhi setiap angka kesehatan yang
//     ditampilkan berdampingan, dan tanpa bagian ini mereka menyalahkan
//     tubuhnya sendiri atas sesuatu yang secara struktural tidak mungkin
//     berubah.
//
//   * BATASAN DILETAKKAN DI DALAM PANEL YANG SAMA, bukan di halaman syarat dan
//     ketentuan. Batasan yang harus dicari tidak akan pernah dibaca.
// ─────────────────────────────────────────────────────────────────────────────

function Bagian({ judul, warna, children }: { judul: string; warna?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl p-3 ${warna ?? 'bg-neutral-50 dark:bg-white/5'}`}>
      <div className="mb-1.5 text-[10px] font-black uppercase tracking-wide text-neutral-500">{judul}</div>
      {children}
    </div>
  )
}

function Butir({ isi }: { isi: string[] }) {
  return (
    <ul className="space-y-1.5">
      {isi.map((x, i) => (
        <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-300">
          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-neutral-400" />
          <span>{x}</span>
        </li>
      ))}
    </ul>
  )
}

export function KartuAngkaKlinis({ a }: { a: Angka }) {
  const [buka, setBuka] = useState(false)
  const t = TINGKAT_INFO[a.tingkat]

  return (
    <div className="kaca rounded-3xl p-4">
      <button
        onClick={() => setBuka((x) => !x)}
        aria-expanded={buka}
        className="flex w-full items-start gap-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wide text-neutral-500">{a.label}</span>
            {/* Lencana tingkat keyakinan selalu terlihat. */}
            {/* 10px, bukan 9px. Batas bawah yang dipegang di seluruh aplikasi
                ini adalah 10 px; lencana yang lebih kecil dari itu justru
                bagian yang paling perlu terbaca sekilas. */}
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-black leading-none text-white ${t.nada}`}>{t.label}</span>
          </span>
          <span className="mt-1 flex items-baseline gap-1.5">
            <span className="text-[28px] font-black leading-none tabular-nums text-ink dark:text-white">{a.nilai}</span>
            {/* Satuan ditulis; bila kosong dinyatakan dengan kata-kata. */}
            <span className="text-[11px] font-bold text-neutral-400">
              {a.satuan || 'tanpa satuan'}
            </span>
          </span>
          <span className="mt-1.5 block text-[12px] leading-snug text-neutral-600 dark:text-neutral-300">{a.arti}</span>
        </span>
        <span className="shrink-0 text-[11px] font-bold text-brand">{buka ? 'tutup' : 'periksa'}</span>
      </button>

      {buka && (
        <div className="mt-3 space-y-2.5">
          <Bagian judul={`Tingkat keyakinan — ${t.label}`}>
            <p className="text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-300">{t.arti}</p>
          </Bagian>

          {a.skala && (
            <Bagian judul="Skala — angka ini diukur terhadap apa">
              <p className="text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-300">{a.skala}</p>
            </Bagian>
          )}

          {a.rumus && (
            <Bagian judul="Rumus, dengan nilai Anda sendiri">
              <code className="block overflow-x-auto whitespace-pre-wrap break-words text-[11px] font-bold leading-relaxed text-ink dark:text-white">
                {a.rumus}
              </code>
            </Bagian>
          )}

          {a.masukan && a.masukan.length > 0 && (
            <Bagian judul="Masukan">
              <ul className="space-y-1.5">
                {a.masukan.map((m, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-3 text-[12px]">
                    <span className="min-w-0 flex-1 text-neutral-600 dark:text-neutral-400">
                      {m.nama}
                      <span className="ml-1 text-[10px] text-neutral-400">· {m.sumber}</span>
                    </span>
                    <span className="shrink-0 font-black tabular-nums text-ink dark:text-white">{m.nilai}</span>
                  </li>
                ))}
              </ul>
            </Bagian>
          )}

          {a.ketidakpastian && (
            <Bagian judul="Perubahan terkecil yang bermakna">
              <p className="text-[12px] font-bold leading-relaxed text-ink dark:text-white">{a.ketidakpastian.sdc}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{a.ketidakpastian.dasar}</p>
            </Bagian>
          )}

          {a.rujukan && (
            <Bagian judul="Rentang rujukan">
              <p className="text-[12px] font-bold text-ink dark:text-white">{a.rujukan.rentang}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                Populasi: {a.rujukan.populasi} · {a.rujukan.sumber}
              </p>
            </Bagian>
          )}

          {/* Bagian pembeda. Diberi warna supaya tidak terbaca sebagai
              keterangan tambahan — bagi banyak orang inilah satu-satunya
              bagian yang benar-benar mereka cari. */}
          {a.tidakDipengaruhi && a.tidakDipengaruhi.length > 0 && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-3 dark:border-rose-500/20 dark:bg-rose-500/10">
              <div className="mb-1.5 text-[10px] font-black uppercase tracking-wide text-rose-700 dark:text-rose-400">
                Tidak dipengaruhi oleh
              </div>
              <ul className="space-y-1.5">
                {a.tidakDipengaruhi.map((x, i) => (
                  <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-rose-900 dark:text-rose-200">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-rose-500" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {a.yangMenggerakkan && a.yangMenggerakkan.length > 0 && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div className="mb-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                Yang benar-benar menggerakkannya
              </div>
              <ul className="space-y-1.5">
                {a.yangMenggerakkan.map((x, i) => (
                  <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-emerald-900 dark:text-emerald-200">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {a.batasan && a.batasan.length > 0 && (
            <Bagian judul="Kapan angka ini tidak boleh dipercaya">
              <Butir isi={a.batasan} />
            </Bagian>
          )}
        </div>
      )}
    </div>
  )
}

export default KartuAngkaKlinis

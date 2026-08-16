// ─────────────────────────────────────────────────────────────────────────────
// Rantai langkah dengan panah — bentuk yang dipakai bersama oleh mekanisme obat
// dan patofisiologi penyakit.
//
// MENGAPA DIPISAH KE BERKAS SENDIRI. Bentuk ini semula hanya ada di dalam
// RantaiObat dan tidak dapat dipakai di tempat lain, sehingga patofisiologi
// penyakit tetap berupa paragraf panjang sementara mekanisme obat sudah berupa
// rantai. Dua bentuk berbeda untuk hal yang sama — sama-sama urutan sebab
// akibat yang harus dihafal — memaksa pembacanya belajar dua cara membaca.
//
// MENGAPA RANTAI, BUKAN PARAGRAF. Penjelasan yang sama dapat ditulis sebagai
// paragraf atau sebagai rantai, dan keduanya TIDAK sama nilainya bagi orang
// yang sedang menghafal. Paragraf harus dibaca ulang dari awal setiap kali satu
// mata rantai terlupa; rantai dapat diulang dalam hati, diucapkan keras-keras,
// dan diperiksa sendiri satu per satu — dan itu menentukan bagi yang lebih
// mudah mengingat lewat suara daripada lewat tulisan.
//
// ATURAN PENULISAN DATANYA:
//   - Satu ruas = satu langkah. Bukan satu kalimat.
//   - HURUF BESAR SELURUHNYA menandai ruas yang ditonjolkan (langkah kunci atau
//     akibat akhir); ia dirender lebih tebal.
//   - Baris kosong '' memisahkan dua rantai di dalam satu penyakit — misalnya
//     jalur yang menimbulkan gejala dan jalur yang menimbulkan komplikasi.
// ─────────────────────────────────────────────────────────────────────────────

function Ruas({ teks, akhir }: { teks: string; akhir: boolean }) {
  const tebal = teks === teks.toUpperCase() && /[A-Z]/.test(teks)
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`rounded-lg px-1.5 py-0.5 text-[11px] leading-snug ${
          tebal
            ? 'bg-brand/15 font-black text-brand-dark dark:text-brand'
            : 'bg-neutral-100 font-semibold text-neutral-700 dark:bg-white/10 dark:text-neutral-200'
        }`}
      >
        {teks}
      </span>
      {!akhir && <span aria-hidden className="text-[11px] font-black text-neutral-400">→</span>}
    </span>
  )
}

export function Rantai({ langkah }: { langkah: string[] }) {
  const bagian: string[][] = [[]]
  for (const l of langkah) {
    if (l === '') bagian.push([])
    else bagian[bagian.length - 1].push(l)
  }
  return (
    <div className="space-y-1.5">
      {bagian.filter((b) => b.length).map((b, i) => (
        <div key={i} className="flex flex-wrap items-center gap-x-1 gap-y-1">
          {b.map((teks, j) => <Ruas key={j} teks={teks} akhir={j === b.length - 1} />)}
        </div>
      ))}
    </div>
  )
}

export default Rantai

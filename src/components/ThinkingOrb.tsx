import './thinking-orb.css'

/**
 * Penanda tunggu untuk penalaran, BUKAN untuk tata letak.
 *
 * Perbedaannya menentukan dan mudah salah. Isi yang sedang dimuat punya bentuk
 * yang sudah diketahui, dan penanda yang benar untuknya adalah rangka setinggi
 * isi yang akan menggantikannya (lihat Rangka.tsx) — kalau tidak, halaman
 * melompat saat isinya datang dan jari yang sudah bergerak mendarat di tombol
 * yang salah. Orb tidak mencegah lompatan itu sama sekali, jadi ia tidak boleh
 * dipakai untuk memuat isi.
 *
 * Yang ditunggu di sini berbeda: jawaban yang panjangnya, bentuknya, bahkan
 * keberadaannya belum diketahui siapa pun sampai ia selesai. Tidak ada rangka
 * yang bisa menirunya.
 *
 * DAN KARENA ITU ORB INI TIDAK MENYATAKAN KEMAJUAN. Tidak ada batang yang
 * terisi, tidak ada persentase, tidak ada "hampir selesai". Batang kemajuan
 * yang terisi menurut tebakan waktu adalah kebohongan kecil yang dibayar mahal
 * di produk klinis: orang menunggu lebih lama karena percaya tinggal sedikit,
 * lalu berhenti percaya pada angka lain di layar yang sama. Orb ini hanya
 * mengatakan satu hal yang memang diketahui — masih bekerja.
 */
export function ThinkingOrb({
  label = 'Working on it', size = 22, className = '',
}: { label?: string; size?: number; className?: string }) {
  return (
    <span className={`pmd-thinking ${className}`} role="status" aria-live="polite">
      {/* Orb dan cincinnya murni hiasan bagi pembaca layar: yang diucapkan
          cukup satu kalimat di bawah, bukan tiga simpul tanpa nama. */}
      <span
        className="pmd-thinking-orb"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <span className="pmd-thinking-core" />
        <span className="pmd-thinking-ring" />
      </span>
      <span className="pmd-thinking-label">{label}</span>
    </span>
  )
}

export default ThinkingOrb

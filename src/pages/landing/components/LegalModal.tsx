export function LegalModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-ink dark:text-white">
          Persetujuan Klinis, Privasi &amp; Ketentuan Layanan
        </h3>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          <p>
            <b>Informed Consent.</b> Interaksi dengan asisten AI bersifat edukatif dan suportif untuk membantu analisis kesehatan, bukan diagnosis medis akhir. Diagnosis resmi dan keputusan terapi tetap memerlukan verifikasi langsung oleh dokter berizin.
          </p>
          <p>
            <b>Privasi (UU Perlindungan Data Pribadi No. 27/2022).</b> Data kesehatan Anda adalah data pribadi spesifik yang disimpan terenkripsi dengan audit log akses yang ketat. Anda memiliki hak penuh untuk mengakses, memperbarui, atau menghapus riwayat data Anda kapan saja.
          </p>
          <p>
            <b>Ketentuan Profesi.</b> Modul AI-EMR khusus diperuntukkan bagi klinisi terdaftar dengan STR/SIP aktif. Layanan kefarmasian tunduk pada regulasi BPOM dan pengawasan apoteker berlisensi. Dalam situasi darurat medis, gunakan fitur Darurat SOS atau segera hubungi IGD rumah sakit terdekat.
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Ketentuan lengkap dapat diakses kembali melalui menu "Privasi &amp; Legalitas" setelah Anda masuk.
          </p>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="mt-5 w-full rounded-full bg-brand hover:opacity-95 py-3 text-sm font-bold text-white shadow-md min-h-[44px]"
        >
          Saya Mengerti &amp; Setuju
        </button>
      </div>
    </div>
  )
}

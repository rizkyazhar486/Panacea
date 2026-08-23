import { Card, SectionTitle } from '../components/ui'
import { IconShield, IconLock, IconCheck } from '../components/icons'

// Public legal & compliance content — Privacy Policy, Terms, Informed Consent,
// and the data-residency / security statement (UU PDP 27/2022, Permenkes 24/2022).
export function Legal() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <SectionTitle icon={<IconShield size={20} />} title="Kebijakan Privasi & Pelindungan Data" subtitle="Sesuai Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)" />
        <div className="space-y-3 text-sm leading-relaxed text-neutral-600">
          <p>Panaceamed.id menghormati privasi Anda. Data kesehatan tergolong <b>data pribadi yang bersifat spesifik</b> dan memperoleh pelindungan yang lebih ketat.</p>
          <ul className="ml-4 list-disc space-y-1.5">
            <li><b>Data yang dikumpulkan:</b> identitas, data demografi, riwayat kesehatan, tanda vital, hasil pemeriksaan, dan aktivitas pemakaian.</li>
            <li><b>Tujuannya:</b> menyediakan layanan AI-EMR, edukasi, konsultasi, dan pemantauan masa sehat — selalu diperiksa oleh dokter berizin.</li>
            <li><b>Hak Anda:</b> mengakses, membetulkan, menarik persetujuan, dan <b>menghapus</b> data Anda kapan saja (Pengaturan → Privasi & Data).</li>
            <li><b>Tidak dibagikan</b> kepada pihak ketiga tanpa persetujuan Anda, kecuali bila diwajibkan undang-undang.</li>
            <li><b>Pejabat Pelindungan Data (DPO)</b> dapat dihubungi lewat saluran Dukungan.</li>
          </ul>
        </div>
      </Card>

      <Card>
        <SectionTitle icon={<IconLock size={20} />} title="Keamanan & Kedaulatan Data" subtitle="Permenkes No. 24/2022 tentang Rekam Medis Elektronik" />
        <div className="space-y-3 text-sm leading-relaxed text-neutral-600">
          <div className="flex items-start gap-2 rounded-xl bg-brand-50 p-3 text-brand-dark">
            <IconLock size={16} className="mt-0.5 shrink-0" />
            <span><b>Disimpan di Indonesia dan terenkripsi.</b> Rekam medis elektronik disimpan dalam keadaan terenkripsi — baik saat dikirim maupun saat tersimpan — pada infrastruktur yang berada di Indonesia, dengan pembatasan akses menurut peran dan <b>catatan audit</b> untuk setiap akses.</span>
          </div>
          <p>Sistem ini dirancang agar <b>dapat bertukar data dengan SATUSEHAT</b> — platform data kesehatan nasional Kementerian Kesehatan.</p>
        </div>
      </Card>

      <Card>
        <SectionTitle icon={<IconCheck size={20} />} title="Syarat & Ketentuan Layanan" />
        <ol className="ml-4 list-decimal space-y-1.5 text-sm leading-relaxed text-neutral-600">
          <li>Panaceamed.id adalah alat bantu klinis. <b>AI membantu, dan tidak menggantikan, dokter berizin.</b> Keputusan medis terakhir tetap berada pada dokter.</li>
          <li>Fitur AI-EMR hanya tersedia bagi tenaga medis bersertifikat yang memiliki <b>STR/SIP yang sudah diperiksa</b>.</li>
          <li>Layanan apotek &amp; resep tunduk pada pengawasan apoteker berizin dan ketentuan BPOM.</li>
          <li>Pengguna bertanggung jawab atas kebenaran data yang dimasukkannya.</li>
          <li>Penyalahgunaan, termasuk memberi nasihat medis tanpa kewenangan, dilarang.</li>
        </ol>
      </Card>

      <Card>
        <SectionTitle icon={<IconShield size={20} />} title="Persetujuan Setelah Penjelasan (Informed Consent)" />
        <div className="space-y-2 text-sm leading-relaxed text-neutral-600">
          <p>Dengan memakai Panaceamed.id, Anda memahami dan menyetujui bahwa:</p>
          <ul className="ml-4 list-disc space-y-1.5">
            <li>Interaksi dengan AI bersifat <b>edukatif &amp; membantu</b>, bukan diagnosis akhir.</li>
            <li>Diagnosis &amp; tatalaksana tetap memerlukan pemeriksaan ulang oleh dokter.</li>
            <li>Data kesehatan Anda diolah untuk keperluan layanan sebagaimana dijelaskan dalam Kebijakan Privasi.</li>
            <li>Dalam keadaan gawat darurat, segera hubungi fasilitas kesehatan terdekat (fitur SOS Darurat).</li>
          </ul>
        </div>
      </Card>

      <p className="px-1 text-center text-xs text-neutral-500">
        Dokumen ini bersifat informatif dan akan disempurnakan bersama penasihat hukum kesehatan. Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}.
      </p>
    </div>
  )
}

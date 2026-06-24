import { Card, SectionTitle } from '../components/ui'
import { IconShield, IconLock, IconCheck } from '../components/icons'

// Public legal & compliance content — Privacy Policy, Terms, Informed Consent,
// and the data-residency / security statement (UU PDP 27/2022, Permenkes 24/2022).
export function Legal() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <SectionTitle icon={<IconShield size={20} />} title="Kebijakan Privasi & Perlindungan Data" subtitle="Sesuai UU No. 27/2022 tentang Perlindungan Data Pribadi (UU PDP)" />
        <div className="space-y-3 text-sm leading-relaxed text-neutral-600">
          <p>Panaceamed.id menghormati privasi Anda. Data kesehatan dikategorikan sebagai <b>data pribadi yang bersifat spesifik</b> dan mendapat perlindungan ekstra.</p>
          <ul className="ml-4 list-disc space-y-1.5">
            <li><b>Data yang dikumpulkan:</b> identitas, data demografis, riwayat kesehatan, tanda vital, hasil penunjang, dan aktivitas penggunaan.</li>
            <li><b>Tujuan:</b> menyediakan layanan AI-EMR, edukasi, konsultasi, dan pemantauan healthspan — selalu diverifikasi klinisi berlisensi.</li>
            <li><b>Hak Anda:</b> mengakses, memperbaiki, menarik persetujuan, dan <b>menghapus</b> data Anda kapan saja (Pengaturan → Privasi & Data).</li>
            <li><b>Tidak dibagikan</b> ke pihak ketiga tanpa persetujuan, kecuali diwajibkan hukum.</li>
            <li><b>Petugas Pelindungan Data (DPO)</b> dapat dihubungi melalui kanal Layanan.</li>
          </ul>
        </div>
      </Card>

      <Card>
        <SectionTitle icon={<IconLock size={20} />} title="Keamanan & Kedaulatan Data" subtitle="Permenkes No. 24/2022 tentang Rekam Medis Elektronik" />
        <div className="space-y-3 text-sm leading-relaxed text-neutral-600">
          <div className="flex items-start gap-2 rounded-xl bg-brand-50 p-3 text-brand-dark">
            <IconLock size={16} className="mt-0.5 shrink-0" />
            <span><b>Penyimpanan di Indonesia & terenkripsi.</b> Rekam medis elektronik disimpan terenkripsi (in-transit &amp; at-rest) pada infrastruktur di wilayah Indonesia, dengan kontrol akses berbasis peran dan <b>audit log</b> setiap akses.</span>
          </div>
          <p>Sistem dirancang untuk <b>interoperabilitas dengan SATUSEHAT</b> (platform data kesehatan nasional Kementerian Kesehatan).</p>
        </div>
      </Card>

      <Card>
        <SectionTitle icon={<IconCheck size={20} />} title="Syarat & Ketentuan Layanan" />
        <ol className="ml-4 list-decimal space-y-1.5 text-sm leading-relaxed text-neutral-600">
          <li>Panaceamed.id adalah alat bantu klinis. <b>AI mendukung, bukan menggantikan, klinisi berlisensi.</b> Keputusan medis akhir ada pada dokter.</li>
          <li>Fitur AI-EMR hanya untuk klinisi bersertifikat dengan <b>STR/SIP terverifikasi</b>.</li>
          <li>Layanan apotek &amp; resep tunduk pada pengawasan apoteker berizin dan ketentuan BPOM.</li>
          <li>Pengguna bertanggung jawab atas keakuratan data yang dimasukkan.</li>
          <li>Penyalahgunaan, termasuk memberi nasihat medis tanpa kewenangan, dilarang.</li>
        </ol>
      </Card>

      <Card>
        <SectionTitle icon={<IconShield size={20} />} title="Persetujuan Tindakan (Informed Consent)" />
        <div className="space-y-2 text-sm leading-relaxed text-neutral-600">
          <p>Dengan menggunakan Panaceamed.id, Anda memahami dan menyetujui bahwa:</p>
          <ul className="ml-4 list-disc space-y-1.5">
            <li>Interaksi AI bersifat <b>edukatif &amp; pendukung</b>; bukan diagnosis final.</li>
            <li>Diagnosis &amp; terapi tetap memerlukan verifikasi dokter manusia.</li>
            <li>Data kesehatan Anda diproses untuk tujuan layanan sebagaimana Kebijakan Privasi.</li>
            <li>Dalam keadaan darurat, segera hubungi fasilitas kesehatan terdekat (fitur Darurat SOS).</li>
          </ul>
        </div>
      </Card>

      <p className="px-1 text-center text-xs text-neutral-400">
        Dokumen ini bersifat informatif dan akan disempurnakan bersama penasihat hukum kesehatan. Pembaruan terakhir: {new Date().toLocaleDateString('id-ID')}.
      </p>
    </div>
  )
}

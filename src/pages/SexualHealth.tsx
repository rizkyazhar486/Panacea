import { useMemo, useState } from 'react'
import { Card, SectionTitle, Button, Badge } from '../components/ui'
import { IconHeart, IconUsers, IconHospital, IconShield } from '../components/icons'
import { HOSPITALS, fetchNearbyFacilities, type NearbyFacility } from '../lib/hospitals'

type Coords = { lat: number; lng: number }

const DEMO: NearbyFacility[] = HOSPITALS.filter((h) => h.kind !== 'Apotek').map((h) => ({
  id: h.id, name: h.name, kind: h.kind, type: h.type, city: h.city, phone: h.phone,
  lat: h.lat, lng: h.lng, dist: h.distanceKm, services: h.services, rating: h.rating, emergency: h.emergency,
}))

interface KbMethod { name: string; efektivitas: string; durasi: string; cara: string; catatan: string }
const KB_METHODS: KbMethod[] = [
  { name: 'Pil KB Kombinasi', efektivitas: '91-99%', durasi: 'Harian', cara: 'Diminum 1 tablet/hari pada jam yang sama; menekan ovulasi via hormon estrogen-progestin.', catatan: 'Tidak disarankan pada perokok >35 tahun, riwayat tromboemboli, atau migrain dengan aura.' },
  { name: 'Suntik KB (1 & 3 bulan)', efektivitas: '94-99%', durasi: '1-3 bulan/suntik', cara: 'Injeksi IM/SC progestin (atau kombinasi) yang menekan ovulasi & menebalkan lendir serviks.', catatan: 'Suntik 3 bulan (DMPA) dapat menunda kembalinya kesuburan hingga beberapa bulan setelah berhenti.' },
  { name: 'IUD / Spiral (Hormonal & Non-hormonal)', efektivitas: '99%+', durasi: '3-10 tahun', cara: 'Dipasang oleh tenaga medis di rahim; non-hormonal (tembaga) bersifat spermisidal, hormonal melepas levonorgestrel lokal.', catatan: 'Reversibel cepat — kesuburan kembali begera setelah pelepasan; perlu kontrol pasca-pasang 1 bulan.' },
  { name: 'Implan (Susuk KB)', efektivitas: '99%+', durasi: '3-5 tahun', cara: 'Batang kecil berisi progestin ditanam di bawah kulit lengan atas, melepas hormon perlahan.', catatan: 'Dapat menyebabkan spotting tidak teratur di bulan-bulan awal — wajar, konsultasi bila berkepanjangan.' },
  { name: 'Kondom', efektivitas: '82-98%', durasi: 'Sekali pakai', cara: 'Barrier mekanik yang dipasang sebelum penetrasi; satu-satunya metode yang juga mencegah IMS/HIV.', catatan: 'Efektivitas tinggi bila digunakan tepat & konsisten setiap kali berhubungan.' },
  { name: 'Metode Kalender / Kesuburan Alami', efektivitas: '76-88%', durasi: 'Berkelanjutan', cara: 'Memantau siklus menstruasi, suhu basal tubuh, dan lendir serviks untuk mengenali masa subur dan menghindari hubungan tanpa pelindung saat itu.', catatan: 'Efektivitas lebih rendah dibanding metode hormonal/IUD; perlu siklus menstruasi yang teratur.' },
  { name: 'Sterilisasi (Tubektomi/Vasektomi)', efektivitas: '99%+', durasi: 'Permanen', cara: 'Prosedur bedah minor memotong/mengikat saluran tuba (wanita) atau vas deferens (pria).', catatan: 'Bersifat permanen — direkomendasikan untuk pasangan yang sudah memutuskan tidak ingin anak lagi.' },
]

interface AncVisit { trimester: string; minggu: string; fokus: string[] }
const ANC_SCHEDULE: AncVisit[] = [
  { trimester: 'Trimester 1', minggu: '0-12 minggu', fokus: ['Konfirmasi kehamilan (USG dini) & penentuan usia gestasi', 'Skrining riwayat penyakit, tekanan darah, golongan darah & Rhesus', 'Asam folat 400-800 mcg/hari untuk cegah neural tube defect', 'Edukasi nutrisi, hindari rokok/alkohol, skrining IMS bila perlu'] },
  { trimester: 'Trimester 2', minggu: '13-27 minggu', fokus: ['USG morfologi (deteksi kelainan struktural, ~18-22 minggu)', 'Skrining diabetes gestasional (OGTT 24-28 minggu)', 'Pemantauan tekanan darah untuk deteksi dini preeklampsia', 'Suplemen zat besi & kalsium sesuai kebutuhan'] },
  { trimester: 'Trimester 3', minggu: '28-40 minggu', fokus: ['Pemantauan presentasi janin & taksiran berat badan', 'Skrining Streptococcus grup B (35-37 minggu)', 'Edukasi tanda persalinan & kapan ke faskes', 'Kontrol lebih sering (tiap 2 minggu, lalu mingguan mendekati HPL)'] },
]

const SEX_ED_TOPICS = [
  { title: 'Anatomi & Fisiologi Reproduksi', text: 'Memahami siklus hormonal (FSH, LH, estrogen, progesteron), fase folikuler-ovulasi-luteal, dan anatomi organ reproduksi membantu mengenali fungsi tubuh yang sehat maupun tanda kelainan.' },
  { title: 'Konsentrasi & Komunikasi (Consent)', text: 'Hubungan seksual yang sehat dibangun atas persetujuan eksplisit, sukarela, dan dapat ditarik kapan saja oleh kedua pihak — komunikasi terbuka tentang batasan & preferensi mengurangi risiko trauma psikologis.' },
  { title: 'Variasi Gaya & Pola Seksual yang Sehat', text: 'Frekuensi dan gaya hubungan seksual bervariasi antar pasangan dan tidak ada standar tunggal yang "normal" — yang penting adalah kenyamanan, keamanan (proteksi IMS), dan kesepakatan bersama tanpa paksaan.' },
  { title: 'Disfungsi Seksual & Kapan Konsultasi', text: 'Nyeri saat berhubungan (dispareunia), vaginismus, disfungsi ereksi, atau penurunan libido bisa bersifat fisiologis (hormonal, vaskular, neurologis) atau psikologis — keduanya dapat ditangani secara klinis, jangan ragu konsultasi.' },
  { title: 'Pencegahan Infeksi Menular Seksual (IMS)', text: 'Penggunaan kondom konsisten, tes IMS rutin bila berganti pasangan, dan vaksinasi HPV adalah pilar pencegahan; banyak IMS (klamidia, gonore) asimtomatik namun dapat menyebabkan infertilitas bila tak diobati.' },
  { title: 'Kesehatan Seksual Pasca-Persalinan', text: 'Aktivitas seksual umumnya dapat dilanjutkan setelah 4-6 minggu pasca-persalinan (setelah involusi uterus & penyembuhan luka perineum/insisi), dengan perhatian pada lubrikasi (efek hormonal laktasi) dan kesiapan psikologis.' },
]

export function SexualHealth() {
  const [coords, setCoords] = useState<Coords | null>(null)
  const [geoState, setGeoState] = useState<'idle' | 'asking' | 'granted' | 'denied'>('idle')
  const [live, setLive] = useState<NearbyFacility[] | null>(null)
  const [loading, setLoading] = useState(false)

  function useMyLocation() {
    if (!('geolocation' in navigator)) { setGeoState('denied'); return }
    setGeoState('asking')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCoords(c); setGeoState('granted')
        setLoading(true)
        try { const f = await fetchNearbyFacilities(c.lat, c.lng); setLive(f.filter((x) => x.kind !== 'Apotek')) }
        catch { setLive(null) }
        finally { setLoading(false) }
      },
      () => setGeoState('denied'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const source = useMemo(() => (live ?? DEMO).slice().sort((a, b) => a.dist - b.dist), [live])

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Edukasi Kesehatan Seksual & Reproduksi" subtitle="Kesuburan, KB, ANC, dan kesehatan seksual — berbasis ilmu obstetri & ginekologi" />
        <div className="mt-3 space-y-2.5">
          {SEX_ED_TOPICS.map((t) => (
            <div key={t.title} className="rounded-xl border border-neutral-100 p-3">
              <div className="text-sm font-bold text-ink">{t.title}</div>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">{t.text}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <SectionTitle icon={<IconUsers size={20} />} title="Kontrol Kesuburan & Pilihan KB" subtitle="Bandingkan metode kontrasepsi sesuai kebutuhan" />
        <div className="mt-3 space-y-2.5">
          {KB_METHODS.map((m) => (
            <div key={m.name} className="rounded-xl border border-neutral-100 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-ink">{m.name}</div>
                <Badge tone="brand">{m.efektivitas}</Badge>
              </div>
              <div className="mt-0.5 text-[11px] font-semibold text-neutral-400">Durasi: {m.durasi}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{m.cara}</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-700">⚠️ {m.catatan}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <SectionTitle
          icon={<IconHospital size={20} />}
          title="Faskes KB / Obgyn Terdekat (GPS)"
          subtitle="Klinik & rumah sakit dengan layanan KB, ANC, dan kandungan"
          right={<Button variant="outline" onClick={useMyLocation} disabled={geoState === 'asking' || loading}>📍 {geoState === 'asking' || loading ? 'Mencari…' : 'Gunakan Lokasi Saya'}</Button>}
        />
        <div className={`mt-2 rounded-xl px-3 py-2 text-xs ${geoState === 'granted' ? 'bg-brand-50 text-brand-dark' : geoState === 'denied' ? 'bg-red-50 text-accent' : 'bg-neutral-50 text-neutral-500'}`}>
          {geoState === 'granted' && coords && live
            ? `📍 ${live.length} faskes nyata di sekitar Anda (data OpenStreetMap) — periksa layanan KB/Obgyn via telepon.`
            : geoState === 'asking' ? 'Meminta izin lokasi…'
            : geoState === 'denied' ? 'Izin lokasi ditolak / tidak tersedia — menampilkan contoh faskes.'
            : 'Aktifkan GPS untuk menemukan klinik KB/Obgyn nyata terdekat dengan nomor telepon.'}
        </div>
        <div className="mt-3 space-y-2">
          {source.slice(0, 6).map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-xl border border-neutral-100 p-3">
              <div>
                <div className="text-sm font-bold">{f.name}</div>
                <div className="text-[11px] text-neutral-400">{f.type} · {f.city} · {f.dist.toFixed(1)} km</div>
              </div>
              <a href={`tel:${f.phone}`} className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-dark">📞 {f.phone}</a>
            </div>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <SectionTitle icon={<IconShield size={20} />} title="Jadwal Antenatal Care (ANC)" subtitle="Pemeriksaan kehamilan terstruktur per trimester" />
        <div className="mt-3 space-y-2.5">
          {ANC_SCHEDULE.map((a) => (
            <div key={a.trimester} className="rounded-xl border border-neutral-100 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-ink">{a.trimester}</div>
                <span className="text-[11px] font-semibold text-neutral-400">{a.minggu}</span>
              </div>
              <ul className="mt-1.5 space-y-1 text-sm text-neutral-600">
                {a.fokus.map((f, i) => <li key={i}>• {f}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-neutral-400">Rujukan WHO/Kemenkes RI minimal 6 kali kontak ANC selama kehamilan. Segera ke faskes bila ada perdarahan, nyeri kepala hebat, pandangan kabur, atau gerakan janin berkurang.</p>
      </Card>
    </div>
  )
}

export default SexualHealth

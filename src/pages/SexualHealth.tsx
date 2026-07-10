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

/* ══════════════════ PERIOD & CYCLE TRACKER ══════════════════ */
const CYCLE_KEY = 'pmd_cycle_tracker_v1'
const LUTEAL_DAYS = 14 // standard assumption: ovulation ≈ 14 days before next period

interface CycleData { periodStarts: string[]; avgCycleLen: number; avgPeriodLen: number; pregnant: boolean; lmp: string }
const DEF_CYCLE: CycleData = { periodStarts: [], avgCycleLen: 28, avgPeriodLen: 5, pregnant: false, lmp: '' }

function loadCycle(): CycleData {
  try { return { ...DEF_CYCLE, ...JSON.parse(localStorage.getItem(CYCLE_KEY) || '{}') } } catch { return DEF_CYCLE }
}
function saveCycle(d: CycleData) {
  try { localStorage.setItem(CYCLE_KEY, JSON.stringify(d)) } catch { /* ignore */ }
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso); d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
function fmtIdDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

const HORMONAL_PHASES = [
  { phase: 'Menstruasi', hari: 'Hari 1-5', hormon: 'Estrogen & progesteron rendah', tanda: 'Kram perut, kelelahan, mood rendah — lapisan rahim luruh.' },
  { phase: 'Folikuler', hari: 'Hari 1-13', hormon: 'FSH merangsang folikel; estrogen naik bertahap', tanda: 'Energi meningkat, kulit lebih cerah, mood membaik menjelang ovulasi.' },
  { phase: 'Ovulasi', hari: '~Hari 14 (siklus 28 hari)', hormon: 'Lonjakan LH memicu pelepasan sel telur', tanda: 'Lendir serviks bening & elastis (mirip putih telur), sedikit nyeri perut sebelah (mittelschmerz), libido meningkat.' },
  { phase: 'Luteal', hari: 'Hari 15-28', hormon: 'Progesteron dominan dari korpus luteum', tanda: 'PMS (payudara nyeri, kembung, mood swing) menjelang menstruasi berikutnya bila tidak terjadi pembuahan.' },
]

// Simplified fetal size-comparison table by gestational week (educational).
const FETAL_GROWTH: { week: number; size: string; length: string }[] = [
  { week: 6, size: 'sebiji kacang polong', length: '~0.5 cm' },
  { week: 8, size: 'sebutir raspberry', length: '~1.6 cm' },
  { week: 10, size: 'sebuah stroberi', length: '~3.1 cm' },
  { week: 12, size: 'sebuah jeruk limau', length: '~5.4 cm' },
  { week: 16, size: 'sebuah alpukat', length: '~11.6 cm' },
  { week: 20, size: 'sebuah pisang', length: '~25.6 cm' },
  { week: 24, size: 'sebuah jagung', length: '~30 cm' },
  { week: 28, size: 'sebuah terong', length: '~37.6 cm' },
  { week: 32, size: 'sebuah kelapa muda', length: '~42.4 cm' },
  { week: 36, size: 'semangka kecil', length: '~47.4 cm' },
  { week: 40, size: 'semangka besar (siap lahir)', length: '~51 cm' },
]

function PeriodTracker() {
  const [data, setData] = useState<CycleData>(loadCycle)
  const [newDate, setNewDate] = useState('')

  function update(patch: Partial<CycleData>) {
    setData((d) => { const next = { ...d, ...patch }; saveCycle(next); return next })
  }
  function addPeriodStart() {
    if (!newDate) return
    const dates = [...data.periodStarts, newDate].sort()
    update({ periodStarts: dates })
    setNewDate('')
  }
  function removeDate(iso: string) {
    update({ periodStarts: data.periodStarts.filter((d) => d !== iso) })
  }

  const sorted = [...data.periodStarts].sort()
  const computedAvgCycle = sorted.length >= 2
    ? Math.round(sorted.slice(1).reduce((sum, d, i) => sum + (new Date(d).getTime() - new Date(sorted[i]).getTime()) / 86400000, 0) / (sorted.length - 1))
    : data.avgCycleLen
  const cycleLen = sorted.length >= 2 ? computedAvgCycle : data.avgCycleLen
  const lastStart = sorted[sorted.length - 1]

  const nextPeriod = lastStart ? addDays(lastStart, cycleLen) : null
  const ovulationDay = nextPeriod ? addDays(nextPeriod, -LUTEAL_DAYS) : null
  const fertileStart = ovulationDay ? addDays(ovulationDay, -5) : null
  const fertileEnd = ovulationDay ? addDays(ovulationDay, 1) : null

  // Pregnancy mode
  let edd: string | null = null, gaWeeks = 0, gaDays = 0
  if (data.pregnant && data.lmp) {
    edd = addDays(data.lmp, 280)
    const diffDays = Math.floor((Date.now() - new Date(data.lmp).getTime()) / 86400000)
    gaWeeks = Math.floor(diffDays / 7); gaDays = diffDays % 7
  }
  const currentFetal = data.pregnant ? [...FETAL_GROWTH].reverse().find((f) => f.week <= gaWeeks) : null

  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconHeart size={20} />} title="Pelacak Siklus & Menstruasi" subtitle="Prediksi ovulasi, kalender kesuburan & pertumbuhan janin" />

      <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
        <input type="checkbox" checked={data.pregnant} onChange={(e) => update({ pregnant: e.target.checked })} className="h-5 w-5 accent-brand" />
        <div className="text-sm font-bold text-ink">Sedang hamil</div>
      </label>

      {!data.pregnant && (
        <>
          <div className="mt-3 flex gap-2">
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="flex-1 min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
            <Button onClick={addPeriodStart} className="h-11 rounded-xl px-4 text-xs">+ Catat Haid</Button>
          </div>

          {sorted.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {sorted.slice(-6).map((d) => (
                <span key={d} className="flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
                  {fmtIdDate(d)}
                  <button onClick={() => removeDate(d)} className="ml-1 text-neutral-400 hover:text-red-500">✕</button>
                </span>
              ))}
            </div>
          )}

          {nextPeriod && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-red-50 p-3 text-center">
                <div className="text-sm font-black text-red-700">{fmtIdDate(nextPeriod)}</div>
                <div className="mt-0.5 text-[10px] font-bold uppercase text-red-400">Perkiraan Haid Berikutnya</div>
              </div>
              <div className="rounded-xl bg-brand-50 p-3 text-center">
                <div className="text-sm font-black text-brand-dark">{ovulationDay ? fmtIdDate(ovulationDay) : '—'}</div>
                <div className="mt-0.5 text-[10px] font-bold uppercase text-brand-dark/60">Perkiraan Ovulasi</div>
              </div>
              {fertileStart && fertileEnd && (
                <div className="col-span-2 rounded-xl bg-amber-50 p-3 text-center">
                  <div className="text-sm font-black text-amber-700">{fmtIdDate(fertileStart)} — {fmtIdDate(fertileEnd)}</div>
                  <div className="mt-0.5 text-[10px] font-bold uppercase text-amber-600">Masa Subur (Fertile Window)</div>
                </div>
              )}
            </div>
          )}
          <p className="mt-2 text-[10px] text-neutral-400">Rata-rata siklus: {cycleLen} hari ({sorted.length >= 2 ? 'dihitung dari riwayat Anda' : 'default, catat ≥2 siklus untuk perhitungan personal'}). Prediksi berasumsi fase luteal standar 14 hari — variasi individual nyata terjadi, terutama pada siklus tidak teratur (PCOS, dll).</p>
        </>
      )}

      {data.pregnant && (
        <div className="mt-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">HPHT (Hari Pertama Haid Terakhir)</span>
            <input type="date" value={data.lmp} onChange={(e) => update({ lmp: e.target.value })} className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
          </label>
          {edd && (
            <>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-brand-50 p-3 text-center">
                  <div className="text-sm font-black text-brand-dark">{gaWeeks}mgu {gaDays}hr</div>
                  <div className="mt-0.5 text-[10px] font-bold uppercase text-brand-dark/60">Usia Gestasi Saat Ini</div>
                </div>
                <div className="rounded-xl bg-neutral-50 p-3 text-center">
                  <div className="text-sm font-black text-ink">{fmtIdDate(edd)}</div>
                  <div className="mt-0.5 text-[10px] font-bold uppercase text-neutral-400">Taksiran Persalinan (EDD)</div>
                </div>
              </div>
              {currentFetal && (
                <div className="mt-2 rounded-xl bg-amber-50 p-3 text-center">
                  <div className="text-sm font-black text-amber-800">Kira-kira sebesar {currentFetal.size}</div>
                  <div className="mt-0.5 text-[10px] font-bold uppercase text-amber-600">Panjang janin ≈ {currentFetal.length} (usia {currentFetal.week} minggu)</div>
                </div>
              )}
            </>
          )}
          <p className="mt-2 text-[10px] text-neutral-400">Naegele's Rule: EDD = HPHT + 280 hari. Perbandingan ukuran janin bersifat edukatif/ilustratif — pertumbuhan aktual dipantau lewat USG & pemeriksaan ANC rutin, bukan estimasi kalender semata.</p>
        </div>
      )}

      <h4 className="mt-5 text-xs font-black uppercase tracking-wide text-neutral-500">Tanda Hormonal per Fase Siklus</h4>
      <div className="mt-2 space-y-2">
        {HORMONAL_PHASES.map((p) => (
          <div key={p.phase} className="rounded-xl border border-neutral-100 p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-ink">{p.phase}</div>
              <span className="text-[11px] font-semibold text-neutral-400">{p.hari}</span>
            </div>
            <p className="mt-1 text-[12px] leading-relaxed text-brand-dark">{p.hormon}</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-600">{p.tanda}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">Data siklus tersimpan di perangkat ini. Alat bantu edukasi & perencanaan — bukan metode kontrasepsi diandalkan tunggal (lihat "Metode Kalender" di atas) maupun pengganti evaluasi medis pada siklus tidak teratur/nyeri berat/kecurigaan PCOS-endometriosis.</p>
    </Card>
  )
}

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
      <PeriodTracker />

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

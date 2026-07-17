import { useMemo, useState } from 'react'
import { Card, SectionTitle, Button, Badge, SkeletonRows } from '../components/ui'
import { IconHeart, IconUsers, IconHospital, IconShield } from '../components/icons'
import { HOSPITALS, fetchNearbyFacilities, type NearbyFacility } from '../lib/hospitals'

type Coords = { lat: number; lng: number }

const DEMO: NearbyFacility[] = HOSPITALS.filter((h) => h.kind !== 'Apotek').map((h) => ({
  id: h.id, name: h.name, kind: h.kind, type: h.type, city: h.city, phone: h.phone,
  lat: h.lat, lng: h.lng, dist: h.distanceKm, services: h.services, rating: h.rating, emergency: h.emergency,
}))

interface KbMethod { name: string; efektivitas: string; durasi: string; cara: string; catatan: string }
const KB_METHODS: KbMethod[] = [
  { name: 'Combined Birth Control Pill', efektivitas: '91-99%', durasi: 'Daily', cara: 'Take 1 tablet/day at the same time; suppresses ovulation via estrogen-progestin hormones.', catatan: 'Not recommended for smokers over 35, those with a history of thromboembolism, or migraine with aura.' },
  { name: 'Birth Control Injection (1 & 3 month)', efektivitas: '94-99%', durasi: '1-3 months/injection', cara: 'IM/SC injection of progestin (or combined hormones) that suppresses ovulation & thickens cervical mucus.', catatan: 'The 3-month injection (DMPA) can delay the return of fertility for several months after stopping.' },
  { name: 'IUD / Coil (Hormonal & Non-hormonal)', efektivitas: '99%+', durasi: '3-10 years', cara: 'Inserted into the uterus by a healthcare provider; non-hormonal (copper) is spermicidal, hormonal releases levonorgestrel locally.', catatan: 'Quickly reversible — fertility returns soon after removal; a follow-up check 1 month after insertion is needed.' },
  { name: 'Implant', efektivitas: '99%+', durasi: '3-5 years', cara: 'A small progestin-containing rod is placed under the skin of the upper arm, releasing hormones slowly.', catatan: 'May cause irregular spotting in the first few months — this is normal; consult a doctor if it persists.' },
  { name: 'Condom', efektivitas: '82-98%', durasi: 'Single use', cara: 'A mechanical barrier placed before penetration; the only method that also prevents STIs/HIV.', catatan: 'Highly effective when used correctly and consistently every time.' },
  { name: 'Calendar Method / Natural Fertility Awareness', efektivitas: '76-88%', durasi: 'Ongoing', cara: 'Tracking the menstrual cycle, basal body temperature, and cervical mucus to identify the fertile window and avoid unprotected intercourse during that time.', catatan: 'Lower effectiveness compared to hormonal/IUD methods; requires a regular menstrual cycle.' },
  { name: 'Sterilization (Tubal Ligation/Vasectomy)', efektivitas: '99%+', durasi: 'Permanent', cara: 'A minor surgical procedure that cuts/ties the fallopian tubes (women) or vas deferens (men).', catatan: 'Permanent — recommended for couples who have decided they do not want more children.' },
]

interface AncVisit { trimester: string; minggu: string; fokus: string[] }
const ANC_SCHEDULE: AncVisit[] = [
  { trimester: 'Trimester 1', minggu: '0-12 weeks', fokus: ['Confirm pregnancy (early ultrasound) & determine gestational age', 'Screen medical history, blood pressure, blood type & Rhesus', 'Folic acid 400-800 mcg/day to prevent neural tube defects', 'Nutrition education, avoid smoking/alcohol, STI screening if needed'] },
  { trimester: 'Trimester 2', minggu: '13-27 weeks', fokus: ['Morphology ultrasound (detect structural abnormalities, ~18-22 weeks)', 'Gestational diabetes screening (OGTT 24-28 weeks)', 'Blood pressure monitoring for early preeclampsia detection', 'Iron & calcium supplements as needed'] },
  { trimester: 'Trimester 3', minggu: '28-40 weeks', fokus: ['Monitor fetal presentation & estimated weight', 'Group B Streptococcus screening (35-37 weeks)', 'Education on labor signs & when to go to a facility', 'More frequent check-ups (every 2 weeks, then weekly near the due date)'] },
]

const SEX_ED_TOPICS = [
  { title: 'Reproductive Anatomy & Physiology', text: 'Understanding the hormonal cycle (FSH, LH, estrogen, progesterone), the follicular-ovulation-luteal phases, and reproductive organ anatomy helps recognize healthy body function as well as signs of abnormality.' },
  { title: 'Communication & Consent', text: 'A healthy sexual relationship is built on explicit, voluntary consent that can be withdrawn at any time by either party — open communication about boundaries & preferences reduces the risk of psychological trauma.' },
  { title: 'Variation in Healthy Sexual Patterns', text: 'The frequency and style of sexual activity varies between couples and there is no single "normal" standard — what matters is comfort, safety (STI protection), and mutual agreement without coercion.' },
  { title: 'Sexual Dysfunction & When to Seek Care', text: 'Pain during intercourse (dyspareunia), vaginismus, erectile dysfunction, or reduced libido can be physiological (hormonal, vascular, neurological) or psychological — both can be treated clinically, so don\'t hesitate to consult a doctor.' },
  { title: 'Preventing Sexually Transmitted Infections (STIs)', text: 'Consistent condom use, routine STI testing when changing partners, and HPV vaccination are pillars of prevention; many STIs (chlamydia, gonorrhea) are asymptomatic yet can cause infertility if untreated.' },
  { title: 'Postpartum Sexual Health', text: 'Sexual activity can generally resume 4-6 weeks after delivery (after uterine involution & healing of the perineum/incision), with attention to lubrication (a hormonal effect of lactation) and psychological readiness.' },
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
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}

const HORMONAL_PHASES = [
  { phase: 'Menstruation', hari: 'Day 1-5', hormon: 'Low estrogen & progesterone', tanda: 'Abdominal cramps, fatigue, low mood — the uterine lining sheds.' },
  { phase: 'Follicular', hari: 'Day 1-13', hormon: 'FSH stimulates the follicles; estrogen rises gradually', tanda: 'Energy increases, skin appears brighter, mood improves approaching ovulation.' },
  { phase: 'Ovulation', hari: '~Day 14 (28-day cycle)', hormon: 'An LH surge triggers egg release', tanda: 'Clear, stretchy cervical mucus (egg-white-like), mild one-sided abdominal pain (mittelschmerz), increased libido.' },
  { phase: 'Luteal', hari: 'Day 15-28', hormon: 'Progesterone dominant from the corpus luteum', tanda: 'PMS (breast tenderness, bloating, mood swings) approaching the next period if fertilization does not occur.' },
]

// Simplified fetal size-comparison table by gestational week (educational).
const FETAL_GROWTH: { week: number; size: string; length: string }[] = [
  { week: 6, size: 'a pea', length: '~0.5 cm' },
  { week: 8, size: 'a raspberry', length: '~1.6 cm' },
  { week: 10, size: 'a strawberry', length: '~3.1 cm' },
  { week: 12, size: 'a lime', length: '~5.4 cm' },
  { week: 16, size: 'an avocado', length: '~11.6 cm' },
  { week: 20, size: 'a banana', length: '~25.6 cm' },
  { week: 24, size: 'an ear of corn', length: '~30 cm' },
  { week: 28, size: 'an eggplant', length: '~37.6 cm' },
  { week: 32, size: 'a young coconut', length: '~42.4 cm' },
  { week: 36, size: 'a small watermelon', length: '~47.4 cm' },
  { week: 40, size: 'a large watermelon (ready to be born)', length: '~51 cm' },
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
      <SectionTitle icon={<IconHeart size={20} />} title="Cycle & Period Tracker" subtitle="Ovulation prediction, fertility calendar & fetal growth" />

      <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
        <input type="checkbox" checked={data.pregnant} onChange={(e) => update({ pregnant: e.target.checked })} className="h-5 w-5 accent-brand" />
        <div className="text-sm font-bold text-ink">Currently pregnant</div>
      </label>

      {!data.pregnant && (
        <>
          <div className="mt-3 flex gap-2">
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="flex-1 min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
            <Button onClick={addPeriodStart} className="h-11 rounded-xl px-4 text-xs">+ Log Period</Button>
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
                <div className="mt-0.5 text-[10px] font-bold uppercase text-red-400">Next Period Estimate</div>
              </div>
              <div className="rounded-xl bg-brand-50 p-3 text-center">
                <div className="text-sm font-black text-brand-dark">{ovulationDay ? fmtIdDate(ovulationDay) : '—'}</div>
                <div className="mt-0.5 text-[10px] font-bold uppercase text-brand-dark/60">Ovulation Estimate</div>
              </div>
              {fertileStart && fertileEnd && (
                <div className="col-span-2 rounded-xl bg-amber-50 p-3 text-center">
                  <div className="text-sm font-black text-amber-700">{fmtIdDate(fertileStart)} — {fmtIdDate(fertileEnd)}</div>
                  <div className="mt-0.5 text-[10px] font-bold uppercase text-amber-600">Fertile Window</div>
                </div>
              )}
            </div>
          )}
          <p className="mt-2 text-[10px] text-neutral-400">Average cycle: {cycleLen} days ({sorted.length >= 2 ? 'calculated from your history' : 'default value, log ≥2 cycles for a personalized calculation'}). The prediction assumes a standard 14-day luteal phase — real individual variation occurs, especially with irregular cycles (PCOS, etc.).</p>
        </>
      )}

      {data.pregnant && (
        <div className="mt-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">LMP (Last Menstrual Period)</span>
            <input type="date" value={data.lmp} onChange={(e) => update({ lmp: e.target.value })} className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
          </label>
          {edd && (
            <>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-brand-50 p-3 text-center">
                  <div className="text-sm font-black text-brand-dark">{gaWeeks}w {gaDays}d</div>
                  <div className="mt-0.5 text-[10px] font-bold uppercase text-brand-dark/60">Current Gestational Age</div>
                </div>
                <div className="rounded-xl bg-neutral-50 p-3 text-center">
                  <div className="text-sm font-black text-ink">{fmtIdDate(edd)}</div>
                  <div className="mt-0.5 text-[10px] font-bold uppercase text-neutral-400">Estimated Due Date (EDD)</div>
                </div>
              </div>
              {currentFetal && (
                <div className="mt-2 rounded-xl bg-amber-50 p-3 text-center">
                  <div className="text-sm font-black text-amber-800">Approximately the size of {currentFetal.size}</div>
                  <div className="mt-0.5 text-[10px] font-bold uppercase text-amber-600">Fetal length ≈ {currentFetal.length} (at {currentFetal.week} weeks)</div>
                </div>
              )}
            </>
          )}
          <p className="mt-2 text-[10px] text-neutral-400">Naegele's Rule: EDD = LMP + 280 days. The fetal size comparison is educational/illustrative — actual growth is monitored via ultrasound & routine ANC checkups, not calendar estimates alone.</p>
        </div>
      )}

      <h4 className="mt-5 text-xs font-black uppercase tracking-wide text-neutral-500">Hormonal Signs by Cycle Phase</h4>
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
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">Cycle data is stored on this device. This is an education & planning tool — not a sole reliable contraceptive method (see "Calendar Method" above) nor a replacement for medical evaluation of irregular cycles, severe pain, or suspected PCOS/endometriosis.</p>
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
        <SectionTitle icon={<IconHeart size={20} />} title="Sexual & Reproductive Health Education" subtitle="Fertility, contraception, ANC, and sexual health — based on obstetric & gynecological science" />
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
        <SectionTitle icon={<IconUsers size={20} />} title="Fertility Control & Contraceptive Options" subtitle="Compare contraceptive methods to suit your needs" />
        <div className="mt-3 space-y-2.5">
          {KB_METHODS.map((m) => (
            <div key={m.name} className="rounded-xl border border-neutral-100 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-ink">{m.name}</div>
                <Badge tone="brand">{m.efektivitas}</Badge>
              </div>
              <div className="mt-0.5 text-[11px] font-semibold text-neutral-400">Duration: {m.durasi}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{m.cara}</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-700">⚠️ {m.catatan}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <SectionTitle
          icon={<IconHospital size={20} />}
          title="Nearby Family Planning / OB-GYN Facilities (GPS)"
          subtitle="Clinics and hospitals offering family planning, ANC, and obstetric services"
          right={<Button variant="outline" onClick={useMyLocation} disabled={geoState === 'asking' || loading}>📍 {geoState === 'asking' || loading ? 'Searching…' : 'Use My Location'}</Button>}
        />
        <div className={`mt-2 rounded-xl px-3 py-2 text-xs ${geoState === 'granted' ? 'bg-brand-50 text-brand-dark' : geoState === 'denied' ? 'bg-red-50 text-accent' : 'bg-neutral-50 text-neutral-500'}`}>
          {geoState === 'granted' && coords && live
            ? `📍 ${live.length} real facilities near you (OpenStreetMap data) — check for family planning/OB-GYN services by phone.`
            : geoState === 'asking' ? 'Requesting location permission…'
            : geoState === 'denied' ? 'Location permission denied / unavailable — showing sample facilities.'
            : 'Enable GPS to find real nearby family planning/OB-GYN clinics with phone numbers.'}
        </div>
        {loading ? (
          <div className="mt-3"><SkeletonRows rows={3} /></div>
        ) : (
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
        )}
      </Card>

      <Card className="!p-5">
        <SectionTitle icon={<IconShield size={20} />} title="Antenatal Care (ANC) Schedule" subtitle="Structured pregnancy checkups by trimester" />
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
        <p className="mt-3 text-[11px] text-neutral-400">WHO/Indonesian Ministry of Health guidance recommends at least 6 ANC contacts during pregnancy. Seek care immediately if there is bleeding, severe headache, blurred vision, or reduced fetal movement.</p>
      </Card>
    </div>
  )
}

export default SexualHealth

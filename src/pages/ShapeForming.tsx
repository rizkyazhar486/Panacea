import { useRef, useState } from 'react'
import { Card, SectionTitle, Button, Badge } from '../components/ui'
import { IconSparkle, IconUpload, IconActivity, IconLeaf, IconHeart } from '../components/icons'
import { compressImage, readAsDataUrl } from '../lib/upload'
import { api } from '../lib/api'

// Level-based workout plans (Beginner → Pro) for shaping the body.
type Level = 'beginner' | 'intermediate' | 'advanced' | 'pro'
const LEVELS: { id: Level; name: string; emoji: string; sub: string; days: number; plan: { day: string; focus: string }[] }[] = [
  {
    id: 'beginner', name: 'Beginner', emoji: '🌱', sub: '3 hari/mgg · fondasi gerak & kebiasaan', days: 3,
    plan: [
      { day: 'Hari 1', focus: 'Full-body dasar: squat 3×10, push-up lutut 3×8, plank 3×20 dtk' },
      { day: 'Hari 2', focus: 'Kardio ringan 20–30 mnt (jalan cepat) + mobilitas' },
      { day: 'Hari 3', focus: 'Full-body: glute bridge 3×12, row band 3×12, dead bug 3×8' },
    ],
  },
  {
    id: 'intermediate', name: 'Intermediate', emoji: '💪', sub: '4 hari/mgg · upper/lower split', days: 4,
    plan: [
      { day: 'Hari 1', focus: 'Upper: bench/push-up 4×8, row 4×10, shoulder press 3×10' },
      { day: 'Hari 2', focus: 'Lower: goblet squat 4×10, RDL 3×10, calf raise 3×15' },
      { day: 'Hari 3', focus: 'Kardio interval 25 mnt + core' },
      { day: 'Hari 4', focus: 'Full-body hipertrofi + lengan (curl/triceps 3×12)' },
    ],
  },
  {
    id: 'advanced', name: 'Advanced', emoji: '🔥', sub: '5 hari/mgg · push/pull/legs', days: 5,
    plan: [
      { day: 'Hari 1', focus: 'Push: bench 5×5, OHP 4×6, dips 3×AMRAP' },
      { day: 'Hari 2', focus: 'Pull: pull-up 5×5, barbell row 4×8, face pull 3×15' },
      { day: 'Hari 3', focus: 'Legs: squat 5×5, lunge 4×10, leg curl 3×12' },
      { day: 'Hari 4', focus: 'Hipertrofi upper + HIIT 15 mnt' },
      { day: 'Hari 5', focus: 'Hipertrofi lower + core berbeban' },
    ],
  },
  {
    id: 'pro', name: 'Pro / Atlet', emoji: '🏆', sub: '6 hari/mgg · periodisasi + performa', days: 6,
    plan: [
      { day: 'Hari 1', focus: 'Strength: squat berat 6×3 @85% + accessory' },
      { day: 'Hari 2', focus: 'Power: clean/jump + bench 6×3' },
      { day: 'Hari 3', focus: 'Hipertrofi pull + grip' },
      { day: 'Hari 4', focus: 'Deadlift 5×3 + posterior chain' },
      { day: 'Hari 5', focus: 'Conditioning/Hyrox: sled, erg, wall ball' },
      { day: 'Hari 6', focus: 'Hipertrofi/weak-point + mobilitas mendalam' },
    ],
  },
]

interface ShapeAnalysis {
  bodyAssessment: string
  bodyType: string
  workoutFocus: string[]
  weeklyPlan: { day: string; focus: string }[]
  nutritionSummary: string
  foodsRecommended: string[]
  foodsAvoid: string[]
  skinAssessment: string
  skinAdvice: string[]
}

function extractJson(raw: string): ShapeAnalysis | null {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return null
  try { return JSON.parse(match[0]) } catch { return null }
}

function demoAnalysis(): ShapeAnalysis {
  return {
    bodyAssessment: '⚠️ Mode Demo. Postur tampak proporsional dengan distribusi otot rata; ada potensi pembentukan lebih definitif pada area core dan bahu untuk simetri visual yang lebih baik.',
    bodyType: 'Mesomorf-Ektomorf (campuran)',
    workoutFocus: ['Core & Postur', 'Bahu & Punggung Atas', 'Kondisi Kardiovaskular', 'Mobilitas Pinggul'],
    weeklyPlan: [
      { day: 'Senin', focus: 'Strength — Push (dada, bahu, trisep)' },
      { day: 'Selasa', focus: 'Cardio sedang 30-40 menit + mobility flow' },
      { day: 'Rabu', focus: 'Strength — Pull (punggung, bisep) + core' },
      { day: 'Kamis', focus: 'HIIT/battling ropes 20 menit (low impact)' },
      { day: 'Jumat', focus: 'Strength — Kaki & glute' },
      { day: 'Sabtu', focus: 'Aktif ringan — jalan/yoga/peregangan' },
      { day: 'Minggu', focus: 'Istirahat penuh / pemulihan' },
    ],
    nutritionSummary: 'Fokus pada defisit kalori ringan-moderat dengan protein tinggi untuk shape forming, serta antioksidan & omega-3 untuk longevity dan kualitas kulit.',
    foodsRecommended: ['Dada ayam/ikan', 'Telur', 'Sayur hijau gelap', 'Buah beri (antioksidan)', 'Alpukat', 'Kacang almond/walnut', 'Yogurt Greek', 'Minyak zaitun', 'Air putih 2.5-3L/hari'],
    foodsAvoid: ['Gula tambahan berlebih', 'Gorengan/minyak trans', 'Minuman beralkohol', 'Makanan ultra-proses tinggi natrium'],
    skinAssessment: '⚠️ Mode Demo. Tekstur kulit tampak cukup baik namun perlu perhatian pada hidrasi dan perlindungan dari paparan sinar UV untuk mencegah penuaan dini (photoaging).',
    skinAdvice: [
      'Gunakan sunscreen SPF 30+ setiap hari, reapply tiap 2-3 jam bila terpapar matahari langsung',
      'Hidrasi cukup (air putih + pelembap ber-hyaluronic acid) untuk elastisitas kulit',
      'Asupan vitamin C & E dari buah-sayur membantu produksi kolagen & melawan radikal bebas',
      'Tidur 7-8 jam mendukung regenerasi sel kulit (proses repair terjadi optimal saat tidur dalam)',
      'Hindari merokok — mempercepat degradasi kolagen & elastin',
      'Olahraga teratur meningkatkan sirkulasi darah ke kulit, mendukung warna kulit lebih sehat',
    ],
  }
}

export function ShapeForming() {
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ShapeAnalysis | null>(null)
  const [level, setLevel] = useState<Level>('beginner')
  const fileRef = useRef<HTMLInputElement>(null)
  const lvl = LEVELS.find((l) => l.id === level)!

  async function onUpload(file?: File) {
    if (!file) return
    setBusy(true); setError(''); setResult(null)
    try {
      const dataUrl = await readAsDataUrl(await compressImage(file, 1280, 0.85))
      setPreview(dataUrl)
      const prompt = `Analisis foto tubuh/postur ini untuk tujuan SHAPE FORMING & LONGEVITY (bukan diagnosis medis formal, edukasi gaya hidup). Nilai proporsi tubuh, postur, dan kualitas kulit yang terlihat (tekstur, tanda penuaan, hidrasi). Berikan rekomendasi program olahraga mingguan (7 hari) dan rekomendasi nutrisi yang sesuai untuk pembentukan tubuh & kesehatan jangka panjang, serta edukasi kualitas kulit & saran perawatannya.\n\nKeluarkan HANYA JSON minified dengan struktur:\n{"bodyAssessment":string,"bodyType":string,"workoutFocus":string[4],"weeklyPlan":[{"day":string,"focus":string}×7],"nutritionSummary":string,"foodsRecommended":string[],"foodsAvoid":string[],"skinAssessment":string,"skinAdvice":string[]}`
      const r = await api.aiVision(dataUrl, prompt)
      const parsed = extractJson(r.text)
      setResult(parsed ?? demoAnalysis())
    } catch {
      setError('Gagal menganalisis foto. Menampilkan contoh rekomendasi.')
      setResult(demoAnalysis())
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconSparkle size={20} />} title="Shape Forming & Longevity dari Foto" subtitle="Unggah foto untuk rekomendasi olahraga, nutrisi & kualitas kulit yang dipersonalisasi" />
        <div className="mt-3 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-brand/30 bg-brand-50/30 p-6 text-center">
          {preview ? (
            <img src={preview} alt="Preview" className="h-40 w-40 rounded-2xl object-cover shadow-sm" />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white text-2xl shadow-sm"><IconUpload size={24} /></span>
          )}
          <p className="text-xs text-neutral-500">Foto tubuh (depan/samping, pencahayaan baik) — diproses sekali untuk analisis, tidak disimpan permanen di server kami.</p>
          <Button onClick={() => fileRef.current?.click()} disabled={busy}>
            <IconUpload size={14} /> {busy ? 'Menganalisis…' : preview ? 'Ganti Foto' : 'Unggah Foto'}
          </Button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />
          {error && <p className="text-xs text-accent">{error}</p>}
        </div>
      </Card>

      {/* Program latihan berdasarkan level */}
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={18} />} title="Program Latihan per Level" subtitle="Pilih level Anda — pemula hingga atlet pro" />
        <div className="mt-3 grid grid-cols-4 gap-2">
          {LEVELS.map((l) => (
            <button key={l.id} onClick={() => setLevel(l.id)}
              className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-bold transition ${level === l.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>
              <span className="text-lg">{l.emoji}</span>{l.name}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs font-semibold text-brand-dark">{lvl.emoji} {lvl.name} — {lvl.sub}</p>
        <div className="mt-2 space-y-1.5">
          {lvl.plan.map((d) => (
            <div key={d.day} className="flex gap-2 rounded-xl bg-neutral-50 px-3 py-2 text-[11px]">
              <span className="w-12 shrink-0 font-bold text-neutral-500">{d.day}</span>
              <span className="text-neutral-600">{d.focus}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-neutral-400">Tingkatkan beban/volume bertahap (progressive overload). Cek form gerakan di menu Tes Fisik & Form.</p>
      </Card>

      {result && (
        <>
          <Card className="!p-5">
            <SectionTitle icon={<IconActivity size={18} />} title="Penilaian Tubuh" subtitle={result.bodyType} />
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">{result.bodyAssessment}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {result.workoutFocus.map((f) => <Badge key={f} tone="brand">{f}</Badge>)}
            </div>
          </Card>

          <Card className="!p-5">
            <SectionTitle icon={<IconActivity size={18} />} title="Program Olahraga Mingguan" subtitle="Disesuaikan untuk shape forming & longevity" />
            <div className="mt-2 space-y-1.5">
              {result.weeklyPlan.map((d) => (
                <div key={d.day} className="flex items-center justify-between rounded-xl border border-neutral-100 px-3 py-2 text-sm">
                  <span className="font-bold">{d.day}</span>
                  <span className="text-right text-xs text-neutral-500">{d.focus}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-neutral-400">Lihat detail gerakan & cara melakukan di halaman <b>AI Program Workout</b>.</p>
          </Card>

          <Card className="!p-5">
            <SectionTitle icon={<IconLeaf size={18} />} title="Rekomendasi Nutrisi" subtitle="Untuk pembentukan tubuh & kesehatan jangka panjang" />
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">{result.nutritionSummary}</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-brand-50/60 p-3">
                <div className="text-[11px] font-bold uppercase tracking-wide text-brand-dark">Disarankan</div>
                <ul className="mt-1 space-y-1 text-sm text-neutral-700">{result.foodsRecommended.map((f, i) => <li key={i}>• {f}</li>)}</ul>
              </div>
              <div className="rounded-xl bg-red-50/60 p-3">
                <div className="text-[11px] font-bold uppercase tracking-wide text-accent">Dihindari</div>
                <ul className="mt-1 space-y-1 text-sm text-neutral-700">{result.foodsAvoid.map((f, i) => <li key={i}>• {f}</li>)}</ul>
              </div>
            </div>
          </Card>

          <Card className="!p-5">
            <SectionTitle icon={<IconHeart size={18} />} title="Edukasi Kualitas Kulit" subtitle="Penilaian & saran perawatan kulit" />
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">{result.skinAssessment}</p>
            <ul className="mt-3 space-y-1.5 text-sm text-neutral-600">
              {result.skinAdvice.map((s, i) => <li key={i}>• {s}</li>)}
            </ul>
          </Card>
        </>
      )}
    </div>
  )
}

export default ShapeForming

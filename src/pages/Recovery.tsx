import { useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconMoon, IconLeaf, IconActivity } from '../components/icons'

type RecoveryType = 'surgery' | 'injury' | 'illness' | 'overtraining'

interface RecoveryProfile { type: RecoveryType; startDate: string }

const KEY = 'pm_recovery_profile'
const def: RecoveryProfile = { type: 'injury', startDate: new Date().toISOString().slice(0, 10) }
function load(): RecoveryProfile {
  try { const d = JSON.parse(localStorage.getItem(KEY) || ''); return d.startDate ? d : def } catch { return def }
}
function save(p: RecoveryProfile) { try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* ignore */ } }

const TYPE_LABEL: Record<RecoveryType, string> = {
  surgery: 'Pasca Operasi',
  injury: 'Cedera (Otot/Sendi/Tulang)',
  illness: 'Pasca Sakit (Infeksi/Demam)',
  overtraining: 'Overtraining / Kelelahan Berlebih',
}

interface Phase { label: string; days: [number, number]; guidance: string[] }

const PHASES: Record<RecoveryType, Phase[]> = {
  surgery: [
    { label: 'Akut (0-3 hari)', days: [0, 3], guidance: ['Istirahat total, elevasi area operasi', 'Ikuti instruksi analgesik dari dokter', 'Hindari aktivitas fisik & angkat beban', 'Cukupi protein 1.2-1.5g/kgBB untuk penyembuhan jaringan'] },
    { label: 'Subakut (4-14 hari)', days: [4, 14], guidance: ['Mobilisasi ringan bertahap sesuai anjuran', 'Perawatan luka rutin, pantau tanda infeksi', 'Mulai latihan pernapasan & ROM pasif', 'Tidur 8-9 jam/malam untuk regenerasi'] },
    { label: 'Pemulihan (15-42 hari)', days: [15, 42], guidance: ['Fisioterapi terstruktur', 'Latihan kekuatan ringan, hindari beban berat', 'Evaluasi ulang dengan dokter bedah', 'Tingkatkan aktivitas harian secara gradual'] },
    { label: 'Lanjutan (>42 hari)', days: [43, 9999], guidance: ['Kembali ke aktivitas normal bertahap', 'Latihan kekuatan & daya tahan penuh sesuai toleransi', 'Pantau gejala residual', 'Konsultasi rutin bila ada keluhan'] },
  ],
  injury: [
    { label: 'Inflamasi (0-3 hari)', days: [0, 3], guidance: ['RICE: Rest, Ice, Compression, Elevation', 'Hindari panas & pijatan pada area cedera', 'Hindari aktivitas yang memperparah nyeri', 'Anti-inflamasi sesuai anjuran dokter'] },
    { label: 'Proliferasi (4-21 hari)', days: [4, 21], guidance: ['Mobilisasi lembut & stretching ringan', 'Mulai latihan isometrik tanpa nyeri', 'Kompres hangat dapat dimulai', 'Protein cukup untuk perbaikan jaringan'] },
    { label: 'Remodeling (22-90 hari)', days: [22, 90], guidance: ['Latihan penguatan progresif', 'Latihan proprioseptif & keseimbangan', 'Kembali ke olahraga bertahap (return-to-play protocol)', 'Pantau nyeri saat eskalasi intensitas'] },
    { label: 'Maintenance (>90 hari)', days: [91, 9999], guidance: ['Latihan pencegahan cedera berulang', 'Pertahankan fleksibilitas & kekuatan otot penyokong', 'Evaluasi biomekanik/teknik olahraga', 'Lanjutkan program penguatan rutin'] },
  ],
  illness: [
    { label: 'Akut (0-3 hari)', days: [0, 3], guidance: ['Istirahat total, hidrasi 2.5-3L/hari', 'Hindari olahraga sama sekali (kondisi demam/akut)', 'Tidur cukup 8+ jam', 'Makanan mudah cerna & bergizi'] },
    { label: 'Pemulihan Awal (4-7 hari)', days: [4, 7], guidance: ['Aktivitas ringan jika sudah tanpa demam 24 jam', 'Jalan kaki santai 10-15 menit', 'Pantau detak jantung saat istirahat', 'Hindari intensitas tinggi'] },
    { label: 'Graded Return (8-14 hari)', days: [8, 14], guidance: ['Tingkatkan durasi & intensitas 10% per hari', 'Perhatikan gejala kambuh (myocarditis risk pasca virus)', 'Aerobik ringan-moderat', 'Konsultasi dokter bila ada sesak/nyeri dada'] },
    { label: 'Normal (>14 hari)', days: [15, 9999], guidance: ['Kembali ke rutinitas olahraga penuh', 'Pantau daya tahan & energi harian', 'Jaga imunitas dengan tidur & nutrisi seimbang'] },
  ],
  overtraining: [
    { label: 'Deload (0-7 hari)', days: [0, 7], guidance: ['Stop latihan intensitas tinggi total', 'Tidur 9+ jam/malam', 'Pijat/relaksasi otot, hindari stres tambahan', 'Asupan kalori & protein cukup, jangan defisit'] },
    { label: 'Aktif Ringan (8-14 hari)', days: [8, 14], guidance: ['Aktivitas Z1 (recovery) saja', 'Mobility & stretching harian', 'Pantau HRV/nadi istirahat pagi', 'Evaluasi pemicu overtraining (volume/stres/tidur)'] },
    { label: 'Re-build (15-28 hari)', days: [15, 28], guidance: ['Latihan bertahap 50-70% volume sebelumnya', 'Prioritaskan kualitas tidur & pemulihan', 'Tambah volume maksimal 10%/minggu', 'Hindari kembali ke volume penuh terlalu cepat'] },
    { label: 'Normal (>28 hari)', days: [29, 9999], guidance: ['Kembali ke program latihan penuh', 'Terapkan deload rutin tiap 4-6 minggu', 'Pantau tanda dini overtraining berikutnya'] },
  ],
}

function daysSince(dateStr: string) {
  const d = new Date(dateStr); const now = new Date()
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / 86400000))
}

export function Recovery() {
  const [p, setP] = useState<RecoveryProfile>(load)
  const elapsed = daysSince(p.startDate)
  const phases = PHASES[p.type]
  const idx = phases.findIndex((ph) => elapsed >= ph.days[0] && elapsed <= ph.days[1])
  const current = phases[idx === -1 ? phases.length - 1 : idx]

  function upd(next: Partial<RecoveryProfile>) {
    const merged = { ...p, ...next }
    setP(merged)
    save(merged)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconMoon size={20} />} title="Recovery Tracker" subtitle="Pelacak fase pemulihan & panduan bertahap" />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Jenis Pemulihan">
            <select className={inputClass} value={p.type} onChange={(e) => upd({ type: e.target.value as RecoveryType })}>
              {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Tanggal Mulai">
            <input className={inputClass} type="date" value={p.startDate} onChange={(e) => upd({ startDate: e.target.value })} />
          </Field>
        </div>

        <div className="mt-4 rounded-2xl bg-ink p-4 text-white">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/50">Hari ke-{elapsed} &middot; Fase Saat Ini</div>
          <div className="mt-1 text-2xl font-extrabold text-brand">{current.label}</div>
          <Badge tone="brand">{TYPE_LABEL[p.type]}</Badge>
        </div>
      </Card>

      <Card className="!p-5">
        <SectionTitle icon={<IconLeaf size={20} />} title="Panduan Fase Ini" subtitle="Rekomendasi berdasarkan hari sejak mulai" />
        <ul className="mt-2 space-y-1.5 text-sm text-neutral-600">
          {current.guidance.map((g, i) => <li key={i}>• {g}</li>)}
        </ul>
      </Card>

      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Garis Waktu Pemulihan" subtitle="Seluruh fase untuk jenis ini" />
        <div className="mt-3 space-y-2">
          {phases.map((ph, i) => (
            <div key={ph.label} className={'flex items-center justify-between rounded-xl border p-3 ' + (i === (idx === -1 ? phases.length - 1 : idx) ? 'border-brand/40 bg-brand-50/40' : 'border-neutral-100')}>
              <div className="text-sm font-bold">{ph.label}</div>
              <div className="text-right text-xs font-semibold text-neutral-400">
                {ph.days[1] >= 9999 ? `>${ph.days[0]} hari` : `${ph.days[0]}-${ph.days[1]} hari`}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default Recovery

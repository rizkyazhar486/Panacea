import { useEffect, useState } from 'react'

const KEY = 'panacea_onboarded_v1'

// First-run tutorial — icon-first so it's understandable even with limited
// reading ability. Shown once per device; dismissible.
export function OnboardingTour() {
  const [show, setShow] = useState(() => {
    try { return localStorage.getItem(KEY) !== '1' } catch { return false }
  })
  if (!show) return null
  const close = () => {
    try { localStorage.setItem(KEY, '1') } catch { /* ignore */ }
    setShow(false)
    window.dispatchEvent(new Event('panacea:onboarded'))
  }

  const steps = [
    { icon: '🏠', title: 'Beranda', desc: 'Lihat & bagikan postingan, foto, video.' },
    { icon: '🫂', title: 'Community', desc: 'Saling dukung, tantangan & teman sehat.' },
    { icon: '➕', title: 'Tombol Tambah', desc: 'Buat postingan atau story baru.' },
    { icon: '💓', title: 'VitaPulse', desc: 'Cek kesehatan: tensi, kalori, tidur, dll.' },
    { icon: '🩺', title: 'Konsultasi', desc: 'Chat & panggilan video dengan dokter.' },
    { icon: '🧪', title: 'Lab Performa & Penilaian Awal', desc: 'Kekuatan, daya tahan, kecepatan & skrining risiko cedera — di menu Kebugaran.' },
  ]

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" role="dialog" aria-label="Panduan pengguna baru">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <div className="mb-1 text-center text-2xl font-black text-ink">Selamat datang 👋</div>
        <p className="mb-5 text-center text-sm text-neutral-500">Kenali tombol-tombol utama:</p>

        <div className="space-y-3">
          {steps.map((s) => (
            <div key={s.title} className="flex items-center gap-3 rounded-2xl bg-neutral-50 p-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-2xl shadow-sm">{s.icon}</span>
              <div>
                <div className="text-sm font-bold text-ink">{s.title}</div>
                <div className="text-xs text-neutral-500">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={close} className="mt-6 w-full rounded-2xl py-3.5 text-base font-bold text-white transition active:scale-95"
          style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>
          Mulai ✓
        </button>
      </div>
    </div>
  )
}

const PROMPT_KEY = 'panacea_assessment_prompt_v1'
const ASSESSMENT_KEY = 'pm_assessment_v1'

// Shown once, right after the onboarding tour is dismissed, if the user
// hasn't completed the Initial Assessment (movement/pain/asymmetry screen).
// Skippable — this is a nudge, not a hard gate.
function shouldPrompt(): boolean {
  try {
    const onboarded = localStorage.getItem('panacea_onboarded_v1') === '1'
    const prompted = localStorage.getItem(PROMPT_KEY) === '1'
    const done = JSON.parse(localStorage.getItem(ASSESSMENT_KEY) || '{}').done === true
    return onboarded && !prompted && !done
  } catch { return false }
}

export function AssessmentPrompt() {
  const [show, setShow] = useState(shouldPrompt)
  useEffect(() => {
    const onOnboarded = () => setShow(shouldPrompt())
    window.addEventListener('panacea:onboarded', onOnboarded)
    return () => window.removeEventListener('panacea:onboarded', onOnboarded)
  }, [])
  if (!show) return null
  function dismiss() { try { localStorage.setItem(PROMPT_KEY, '1') } catch { /* ignore */ }; setShow(false) }
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" role="dialog" aria-label="Ajakan penilaian awal">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 text-center shadow-2xl sm:rounded-3xl">
        <div className="text-4xl">🧪</div>
        <div className="mt-2 text-xl font-black text-ink">Sebelum mulai berlatih…</div>
        <p className="mt-2 text-sm text-neutral-500">
          Isi <b>Penilaian Awal</b> (2-3 menit): pola gerak, nyeri, kekuatan dasar & asimetri kanan-kiri.
          Ini membantu program latihan Anda lebih aman dan efektif sejak hari pertama.
        </p>
        <a href="#/assessment" onClick={dismiss} className="mt-5 block w-full rounded-2xl py-3.5 text-center text-base font-bold text-white transition active:scale-95"
          style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>
          Isi Sekarang →
        </a>
        <button onClick={dismiss} className="mt-2 w-full rounded-2xl py-3 text-sm font-bold text-neutral-400">Nanti saja</button>
      </div>
    </div>
  )
}

import { useState } from 'react'

const KEY = 'panacea_onboarded_v1'

// First-run tutorial — icon-first so it's understandable even with limited
// reading ability. Shown once per device; dismissible.
export function OnboardingTour() {
  const [show, setShow] = useState(() => {
    try { return localStorage.getItem(KEY) !== '1' } catch { return false }
  })
  if (!show) return null
  const close = () => { try { localStorage.setItem(KEY, '1') } catch { /* ignore */ }; setShow(false) }

  const steps = [
    { icon: '🏠', title: 'Beranda', desc: 'Lihat & bagikan postingan, foto, video.' },
    { icon: '🫂', title: 'Community', desc: 'Saling dukung, tantangan & teman sehat.' },
    { icon: '➕', title: 'Tombol Tambah', desc: 'Buat postingan atau story baru.' },
    { icon: '💓', title: 'VitaPulse', desc: 'Cek kesehatan: tensi, kalori, tidur, dll.' },
    { icon: '🩺', title: 'Konsultasi', desc: 'Chat & panggilan video dengan dokter.' },
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

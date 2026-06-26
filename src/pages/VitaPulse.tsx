import { useStore } from '../lib/store'
import { PusatKesehatanRealtime } from './Feed'

// VitaPulse — pusat pemantauan kesehatan realtime: kalkulator (BMI, kalori,
// cairan, tensi, VO2Max/Cooper), monitor vital, tidur, pengingat obat, berita,
// edukasi, kuis, asisten AI & deteksi anomali, target, dan ringkasan.
export function VitaPulse() {
  const { account } = useStore()
  if (!account) return null
  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-2xl">💓</span>
        <div>
          <h1 className="text-lg font-black text-ink">VitaPulse</h1>
          <p className="text-xs text-neutral-400">Pantau & hitung kesehatan Anda secara realtime</p>
        </div>
      </div>
      <PusatKesehatanRealtime viewerEmail={account.email} />
    </div>
  )
}

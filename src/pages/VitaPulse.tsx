import { useStore } from '../lib/store'
import { PusatKesehatanRealtime } from './Feed'
import { VideoGallery } from '../components/VideoGallery'

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
      <div className="mb-4">
        <VideoGallery
          icon={<span className="text-lg">🩺</span>}
          title="Video Edukasi"
          subtitle="Cara mengukur tanda vital dengan benar"
          videos={[
            { label: 'Mengukur Tekanan Darah', cue: 'Duduk tenang 5 mnt · lengan di atas meja setinggi jantung · kaki menapak · jangan bicara', url: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_073025_ac2d37c3-a20e-45c4-ae71-ce92a0be4bc8.mp4' },
          ]}
        />
      </div>
      <PusatKesehatanRealtime viewerEmail={account.email} />
    </div>
  )
}

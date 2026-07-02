import { Card, SectionTitle } from './ui'

export interface GalleryVideo { label: string; cue: string; url: string }

// Reusable looping-video gallery (Higgsfield-generated demonstration clips).
// Muted + autoplay + playsInline so it behaves like an animated illustration,
// not a media player.
export function VideoGallery({ title, subtitle, icon, videos }: {
  title: string
  subtitle: string
  icon?: React.ReactNode
  videos: GalleryVideo[]
}) {
  if (videos.length === 0) return null
  return (
    <Card className="!p-5">
      <SectionTitle icon={icon} title={title} subtitle={subtitle} />
      <div className={'mt-3 grid grid-cols-1 gap-3 ' + (videos.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
        {videos.map((v) => (
          <div key={v.label} className="overflow-hidden rounded-2xl border border-neutral-100">
            <video src={v.url} autoPlay muted loop playsInline preload="metadata" className="aspect-square w-full object-cover" />
            <div className="p-2.5">
              <div className="text-xs font-extrabold">{v.label}</div>
              <div className="mt-0.5 text-[10px] leading-relaxed text-neutral-500">{v.cue}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

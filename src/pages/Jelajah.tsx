import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Card, SectionTitle } from '../components/ui'
import { IconUsers } from '../components/icons'
import { api, backendEnabled } from '../lib/api'

// ─────────────────────────────────────────────────────────────────────────────
// Jelajah — tempat mendaratnya hasil pencarian orang dan tagar.
//
// Dibuat sebagai halaman tersendiri, bukan sebagai penyaring di dalam feed
// komunitas, karena feed itu komponen besar dengan cerita, tantangan, dan
// kompetisi GPS di dalamnya. Menyelipkan penyaring ke sana berarti mengubah
// perilaku halaman yang sudah dipakai orang demi kebutuhan yang berbeda.
// Halaman ini hanya menjawab satu pertanyaan: "tunjukkan kiriman yang cocok".
// ─────────────────────────────────────────────────────────────────────────────

interface Kiriman {
  id: string
  authorName?: string
  caption?: string
  activity?: string
  at?: string
  imageUrl?: string
  videoUrl?: string
}

function tagarDari(teks: string): string[] {
  return [...teks.matchAll(/#([\p{L}\p{N}_]{2,30})/gu)].map((m) => m[1].toLowerCase())
}

export function Jelajah() {
  const [sp] = useSearchParams()
  const tag = (sp.get('tag') ?? '').toLowerCase().replace(/^#/, '')
  const orang = sp.get('orang') ?? ''
  const [posts, setPosts] = useState<Kiriman[] | null>(null)
  const [galat, setGalat] = useState(false)

  useEffect(() => {
    if (!backendEnabled) { setPosts([]); return }
    let batal = false
    void api.posts()
      .then((p) => { if (!batal) setPosts(p as unknown as Kiriman[]) })
      .catch(() => { if (!batal) { setGalat(true); setPosts([]) } })
    return () => { batal = true }
  }, [])

  const hasil = useMemo(() => {
    if (!posts) return []
    return posts.filter((p) => {
      const teks = `${p.caption ?? ''} ${p.activity ?? ''}`
      if (tag) return tagarDari(teks).includes(tag)
      if (orang) return (p.authorName ?? '').toLowerCase() === orang.toLowerCase()
      return false
    })
  }, [posts, tag, orang])

  const judul = tag ? `#${tag}` : orang || 'Jelajah'
  const sub = tag ? 'Kiriman dengan tagar ini' : orang ? 'Kiriman dari orang ini' : 'Cari lewat tombol 🔍 di atas'

  return (
    <div className="mx-auto max-w-xl space-y-4 pb-24">
      <SectionTitle icon={<IconUsers />} title={judul} subtitle={sub} />

      {!tag && !orang && (
        <Card>
          <p className="text-[13px] leading-relaxed text-slate-300">
            Halaman ini menampilkan hasil pencarian orang dan tagar. Ketuk tombol pencarian di
            bilah atas, lalu pilih salah satu hasilnya.
          </p>
        </Card>
      )}

      {posts === null && (
        <Card><p className="text-[13px] text-slate-400">Memuat…</p></Card>
      )}

      {galat && (
        <Card><p className="text-[13px] text-slate-400">Gagal memuat kiriman. Coba lagi nanti.</p></Card>
      )}

      {posts !== null && (tag || orang) && hasil.length === 0 && !galat && (
        <Card>
          <p className="text-[13px] leading-relaxed text-slate-300">
            Belum ada kiriman {tag ? <>dengan tagar <b>#{tag}</b></> : <>dari <b>{orang}</b></>}.
          </p>
          <Link to="/community" className="mt-2 inline-block text-[12px] font-bold text-brand underline">
            Buka Community
          </Link>
        </Card>
      )}

      {hasil.map((p) => (
        <Card key={p.id}>
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-[13px] font-black text-white">{p.authorName ?? 'Tanpa nama'}</div>
            {p.at && <div className="text-[10px] text-slate-500">{p.at.slice(0, 10)}</div>}
          </div>
          {p.activity && <div className="mt-0.5 text-[11px] font-bold text-brand">{p.activity}</div>}
          {p.caption && <p className="mt-1 text-[13px] leading-relaxed text-slate-200">{p.caption}</p>}
          {p.imageUrl && (
            <img src={p.imageUrl} alt="" loading="lazy" className="mt-2 w-full rounded-xl object-cover" />
          )}
        </Card>
      ))}

      {hasil.length > 0 && (
        <p className="text-center text-[11px] text-slate-500">{hasil.length} kiriman</p>
      )}
    </div>
  )
}

export default Jelajah

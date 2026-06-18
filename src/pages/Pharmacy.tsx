import { useMemo, useState } from 'react'
import { useStore, uid } from '../lib/store'
import { Card, SectionTitle, Button, Badge } from '../components/ui'
import { IconPill, IconUpload, IconCheck, IconShield, IconSearch } from '../components/icons'

type Cat = 'Demam & Nyeri' | 'Batuk & Pilek' | 'Lambung' | 'Vitamin' | 'Topikal'
interface Product { id: string; name: string; desc: string; category: Cat; priceIdr: number; rx: boolean; emoji: string; color: string }

const PRODUCTS: Product[] = [
  { id: 'm1', name: 'Paracetamol 500 mg', desc: 'Pereda demam & nyeri ringan (strip 10)', category: 'Demam & Nyeri', priceIdr: 8000, rx: false, emoji: '💊', color: '#ef4444' },
  { id: 'm2', name: 'Ibuprofen 200 mg', desc: 'Anti-nyeri & anti-radang ringan (strip 10)', category: 'Demam & Nyeri', priceIdr: 12000, rx: false, emoji: '💊', color: '#f97316' },
  { id: 'm3', name: 'OBH Sirup', desc: 'Pereda batuk berdahak (100 ml)', category: 'Batuk & Pilek', priceIdr: 18500, rx: false, emoji: '🧴', color: '#a16207' },
  { id: 'm4', name: 'Cetirizine 10 mg', desc: 'Antihistamin alergi/pilek (strip 10)', category: 'Batuk & Pilek', priceIdr: 15000, rx: false, emoji: '💊', color: '#0ea5e9' },
  { id: 'm5', name: 'Antasida Doen', desc: 'Penetral asam lambung (strip 10)', category: 'Lambung', priceIdr: 9000, rx: false, emoji: '💊', color: '#10b981' },
  { id: 'm6', name: 'Omeprazole 20 mg', desc: 'Penurun asam lambung — perlu resep', category: 'Lambung', priceIdr: 26000, rx: true, emoji: '💊', color: '#8b5cf6' },
  { id: 'm7', name: 'Vitamin C 500 mg', desc: 'Suplemen harian (tabung 30)', category: 'Vitamin', priceIdr: 22000, rx: false, emoji: '🍊', color: '#f59e0b' },
  { id: 'm8', name: 'Vitamin D3 1000 IU', desc: 'Dukungan imun & tulang (botol 60)', category: 'Vitamin', priceIdr: 45000, rx: false, emoji: '☀️', color: '#eab308' },
  { id: 'm9', name: 'Salep Hidrokortison 1%', desc: 'Anti-gatal & radang kulit ringan', category: 'Topikal', priceIdr: 17500, rx: false, emoji: '🧴', color: '#14b8a6' },
  { id: 'm10', name: 'Amoxicillin 500 mg', desc: 'Antibiotik — wajib resep dokter', category: 'Topikal', priceIdr: 32000, rx: true, emoji: '💊', color: '#ec4899' },
]
const CATS: (Cat | 'Semua')[] = ['Semua', 'Demam & Nyeri', 'Batuk & Pilek', 'Lambung', 'Vitamin', 'Topikal']
const rupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`

export function Pharmacy() {
  const { addOrder } = useStore()
  const [cart, setCart] = useState<Record<string, number>>({})
  const [showRx, setShowRx] = useState(false)
  const [rxFile, setRxFile] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<(typeof CATS)[number]>('Semua')

  const products = useMemo(() => {
    const query = q.trim().toLowerCase()
    return PRODUCTS.filter((p) => (cat === 'Semua' || p.category === cat) && (!query || p.name.toLowerCase().includes(query) || p.desc.toLowerCase().includes(query)))
  }, [q, cat])

  const total = useMemo(() => Object.entries(cart).reduce((s, [id, qty]) => s + (PRODUCTS.find((p) => p.id === id)?.priceIdr ?? 0) * qty, 0), [cart])
  const count = Object.values(cart).reduce((a, b) => a + b, 0)

  function add(p: Product) {
    if (p.rx && !rxFile) { setShowRx(true); return }
    setCart((c) => ({ ...c, [p.id]: (c[p.id] ?? 0) + 1 }))
  }
  function remove(id: string) {
    setCart((c) => { const n = { ...c }; if (n[id] > 1) n[id] -= 1; else delete n[id]; return n })
  }
  function checkout() {
    if (count === 0) return
    const names = Object.entries(cart).map(([id, qty]) => `${PRODUCTS.find((p) => p.id === id)?.name} ×${qty}`)
    addOrder({ id: uid(), category: 'Obat', title: `${names[0]}${names.length > 1 ? ` + ${names.length - 1} lainnya` : ''}`, detail: names.join(', '), amountIdr: total, status: 'Diproses', at: new Date().toISOString() })
    setDone(true); setCart({})
    setTimeout(() => setDone(false), 3500)
  }

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle icon={<IconPill size={20} />} title="Apotek Panaceamed" subtitle="Beli obat bebas (OTC) atau tebus resep dari konsultasi dokter"
          right={<Button variant="outline" onClick={() => setShowRx(true)}><IconUpload size={16} /> Tebus / Scan Resep</Button>} />
        <div className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2">
          <IconSearch size={16} className="text-neutral-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari obat… (mis. Paracetamol)" className="w-full bg-transparent text-sm outline-none" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATS.map((c) => <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${cat === c ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500'}`}>{c}</button>)}
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-brand-50 p-3 text-xs text-brand-dark">
          <IconShield size={15} className="mt-0.5 shrink-0" />
          <span>Obat berlabel <b>Resep</b> hanya bisa dibeli setelah mengunggah resep dokter yang sah. Obat bebas dosis ringan bisa langsung dibeli.</span>
        </div>
      </Card>

      {done && <Card className="flex items-center gap-2 bg-brand-50 text-sm font-semibold text-brand-dark"><IconCheck size={18} /> Pesanan diterima — tercatat di Riwayat Transaksi. Bukti dikirim ke email.</Card>}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {products.map((p) => (
              <Card key={p.id} pad={false} className="overflow-hidden">
                {/* photo tile */}
                <div className="relative flex aspect-square items-center justify-center text-5xl" style={{ background: `linear-gradient(150deg, ${p.color}22, ${p.color}55)` }}>
                  <span>{p.emoji}</span>
                  <span className="absolute left-2 top-2">{p.rx ? <Badge tone="high">Resep</Badge> : <Badge tone="normal">Bebas</Badge>}</span>
                </div>
                <div className="p-3">
                  <div className="text-sm font-bold leading-tight">{p.name}</div>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-neutral-500">{p.desc}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-extrabold text-ink">{rupiah(p.priceIdr)}</span>
                    {cart[p.id] ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => remove(p.id)} className="grid h-6 w-6 place-items-center rounded-lg bg-neutral-100 font-bold">−</button>
                        <span className="w-4 text-center text-sm font-bold">{cart[p.id]}</span>
                        <button onClick={() => add(p)} className="grid h-6 w-6 place-items-center rounded-lg bg-brand-50 font-bold text-brand-dark">+</button>
                      </div>
                    ) : (
                      <button onClick={() => add(p)} className="rounded-lg border border-brand px-2.5 py-1 text-xs font-bold text-brand-dark hover:bg-brand-50">
                        {p.rx ? 'Resep' : '+ Tambah'}
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            {products.length === 0 && <Card className="col-span-full text-center text-sm text-neutral-400">Obat tidak ditemukan.</Card>}
          </div>
        </div>

        <div>
          <Card className="sticky top-20">
            <SectionTitle title="Keranjang" subtitle={`${count} item`} />
            {count === 0 ? <p className="text-sm text-neutral-400">Keranjang masih kosong.</p> : (
              <div className="space-y-2">
                {Object.entries(cart).map(([id, qty]) => {
                  const p = PRODUCTS.find((x) => x.id === id)!
                  return <div key={id} className="flex items-center justify-between text-sm"><span className="truncate">{p.name} ×{qty}</span><span className="font-semibold">{rupiah(p.priceIdr * qty)}</span></div>
                })}
              </div>
            )}
            <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3"><span className="text-sm text-neutral-500">Total</span><span className="text-lg font-extrabold">{rupiah(total)}</span></div>
            <Button className="mt-3 w-full" disabled={count === 0} onClick={checkout}>Bayar Sekarang</Button>
            {rxFile && <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-brand-dark"><IconCheck size={13} /> Resep terlampir: {rxFile}</p>}
          </Card>
        </div>
      </div>

      {showRx && <RxModal onClose={() => setShowRx(false)} onUpload={(name) => { setRxFile(name); setShowRx(false) }} />}
    </div>
  )
}

function RxModal({ onClose, onUpload }: { onClose: () => void; onUpload: (name: string) => void }) {
  const [name, setName] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 text-brand-dark"><IconUpload size={20} /><h3 className="text-lg font-bold">Scan / Unggah Resep Dokter</h3></div>
        <p className="mt-1 text-sm text-neutral-500">Foto atau pindai resep dokter (JPG/PNG/PDF). Apoteker memverifikasi sebelum obat keras disiapkan.</p>
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 py-8 text-neutral-500 hover:border-brand">
          <IconUpload size={28} /><span className="text-sm font-semibold">Ketuk untuk pilih berkas resep</span><span className="text-[11px]">atau ambil foto dari kamera</span>
          <input type="file" accept="image/*,application/pdf" capture="environment" className="hidden" onChange={(e) => setName(e.target.files?.[0]?.name ?? 'resep.jpg')} />
        </label>
        {name && <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-brand-dark"><IconCheck size={14} /> {name}</p>}
        <div className="mt-5 flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Batal</Button>
          <Button className="flex-1" disabled={!name} onClick={() => onUpload(name || 'resep.jpg')}>Lampirkan Resep</Button>
        </div>
      </div>
    </div>
  )
}

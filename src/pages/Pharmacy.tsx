import { useMemo, useState } from 'react'
import { useStore, uid } from '../lib/store'
import { Card, SectionTitle, Button, Badge, Field, inputClass } from '../components/ui'
import { IconPill, IconUpload, IconCheck, IconShield, IconSearch, IconPlus } from '../components/icons'
import type { PharmacyProduct, PharmacyCategory } from '../lib/types'

type Cat = PharmacyCategory
type Product = PharmacyProduct
const CAT_LIST: Cat[] = ['Demam & Nyeri', 'Batuk & Pilek', 'Lambung', 'Vitamin', 'Topikal']
const CATS: (Cat | 'Semua')[] = ['Semua', ...CAT_LIST]
const rupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`

export function Pharmacy() {
  const { state, account, addOrder, addProduct, removeProduct } = useStore()
  const PRODUCTS = state.products
  const canManage = account?.role === 'admin' || account?.role === 'owner'
  const [cart, setCart] = useState<Record<string, number>>({})
  const [showRx, setShowRx] = useState(false)
  const [rxFile, setRxFile] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<(typeof CATS)[number]>('Semua')
  const [manage, setManage] = useState(false)

  const products = useMemo(() => {
    const query = q.trim().toLowerCase()
    return PRODUCTS.filter((p) => (cat === 'Semua' || p.category === cat) && (!query || p.name.toLowerCase().includes(query) || p.desc.toLowerCase().includes(query)))
  }, [PRODUCTS, q, cat])

  const total = useMemo(() => Object.entries(cart).reduce((s, [id, qty]) => s + (PRODUCTS.find((p) => p.id === id)?.priceIdr ?? 0) * qty, 0), [PRODUCTS, cart])
  const count = Object.values(cart).reduce((a, b) => a + b, 0)

  function add(p: Product) {
    if (p.rx && !rxFile) { setShowRx(true); return }
    setCart((c) => ({ ...c, [p.id]: (c[p.id] ?? 0) + 1 }))
  }
  function remove(id: string) {
    setCart((c) => { const n = { ...c }; if (n[id] > 1) n[id] -= 1; else delete n[id]; return n })
  }
  // Halodoc-style fees: a platform service fee + flat delivery (ongkir).
  const SERVICE_FEE = 3000
  const DELIVERY_FEE = count > 0 ? 10000 : 0
  const grandTotal = total + (count > 0 ? SERVICE_FEE : 0) + DELIVERY_FEE

  function checkout() {
    if (count === 0) return
    const names = Object.entries(cart).map(([id, qty]) => `${PRODUCTS.find((p) => p.id === id)?.name} ×${qty}`)
    addOrder({ id: uid(), category: 'Obat', title: `${names[0]}${names.length > 1 ? ` + ${names.length - 1} lainnya` : ''}`, detail: `${names.join(', ')} · layanan Rp${SERVICE_FEE.toLocaleString('id-ID')} · ongkir Rp${DELIVERY_FEE.toLocaleString('id-ID')}`, amountIdr: grandTotal, status: 'Diproses', at: new Date().toISOString() })
    setDone(true); setCart({})
    setTimeout(() => setDone(false), 3500)
  }

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle icon={<IconPill size={20} />} title="Apotek Panaceamed" subtitle="Beli obat bebas (OTC) atau tebus resep dari konsultasi dokter"
          right={
            <div className="flex gap-2">
              {canManage && <Button variant="outline" onClick={() => setManage((m) => !m)}><IconPlus size={16} /> Kelola Obat</Button>}
              <Button variant="outline" onClick={() => setShowRx(true)}><IconUpload size={16} /> Tebus / Scan Resep</Button>
            </div>
          } />
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

      {canManage && manage && (
        <Card>
          <SectionTitle icon={<IconPlus size={18} />} title="Kelola Daftar Obat" subtitle="Admin / apotek terdaftar dapat menambah & menghapus produk" />
          <AddProductForm onAdd={addProduct} />
          <div className="mt-3 max-h-48 space-y-1.5 overflow-y-auto">
            {PRODUCTS.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-1.5 text-sm">
                <span>{p.emoji} {p.name} · <span className="text-neutral-400">{rupiah(p.priceIdr)}</span></span>
                <button onClick={() => removeProduct(p.id)} className="text-xs font-semibold text-accent hover:underline">Hapus</button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {products.map((p) => (
              <Card key={p.id} pad={false} hover className="overflow-hidden">
                {/* photo tile */}
                <div className="relative flex aspect-square items-center justify-center text-5xl" style={{ background: p.image ? undefined : `linear-gradient(150deg, ${p.color}22, ${p.color}55)` }}>
                  {p.image ? <img src={p.image} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" alt={p.name} /> : <span>{p.emoji}</span>}
                  <span className="absolute left-2 top-2">{p.rx ? <Badge tone="high">Resep</Badge> : <Badge tone="normal">Bebas</Badge>}</span>
                  {canManage && <button onClick={() => removeProduct(p.id)} className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/40 text-xs text-white">✕</button>}
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
            {count > 0 && (
              <div className="mt-3 space-y-1 border-t border-neutral-100 pt-3 text-sm">
                <div className="flex justify-between text-neutral-500"><span>Subtotal obat</span><span>{rupiah(total)}</span></div>
                <div className="flex justify-between text-neutral-500"><span>Biaya layanan</span><span>{rupiah(SERVICE_FEE)}</span></div>
                <div className="flex justify-between text-neutral-500"><span>Ongkir</span><span>{rupiah(DELIVERY_FEE)}</span></div>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between border-t border-neutral-100 pt-2"><span className="text-sm font-semibold">Total bayar</span><span className="text-lg font-extrabold">{rupiah(count > 0 ? grandTotal : 0)}</span></div>
            <Button className="mt-3 w-full" disabled={count === 0} onClick={checkout}>Bayar Sekarang</Button>
            {rxFile && <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-brand-dark"><IconCheck size={13} /> Resep terlampir: {rxFile}</p>}
          </Card>
        </div>
      </div>

      {showRx && <RxModal onClose={() => setShowRx(false)} onUpload={(name) => { setRxFile(name); setShowRx(false) }} />}
    </div>
  )
}

function AddProductForm({ onAdd }: { onAdd: (p: Product) => void }) {
  const [f, setF] = useState({ name: '', category: CAT_LIST[0] as Cat, priceIdr: '', rx: false, emoji: '💊', desc: '', image: '' })
  function pickImg(file?: File) {
    if (!file) return
    const r = new FileReader(); r.onload = () => setF((s) => ({ ...s, image: String(r.result) })); r.readAsDataURL(file)
  }
  function submit() {
    if (!f.name.trim() || !f.priceIdr) return
    onAdd({ id: uid(), name: f.name.trim(), desc: f.desc.trim() || '—', category: f.category, priceIdr: Number(f.priceIdr), rx: f.rx, emoji: f.emoji || '💊', color: '#10b981', image: f.image || undefined })
    setF({ name: '', category: CAT_LIST[0], priceIdr: '', rx: false, emoji: '💊', desc: '', image: '' })
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Nama obat"><input className={inputClass} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="mis. Paracetamol" /></Field>
      <Field label="Kategori"><select className={inputClass} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as Cat })}>{CAT_LIST.map((c) => <option key={c}>{c}</option>)}</select></Field>
      <Field label="Harga (Rp)"><input className={inputClass} type="number" value={f.priceIdr} onChange={(e) => setF({ ...f, priceIdr: e.target.value })} /></Field>
      <Field label="Foto produk"><input className={inputClass} type="file" accept="image/*" onChange={(e) => pickImg(e.target.files?.[0])} /></Field>
      <Field label="Deskripsi"><input className={inputClass} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder="kemasan / kegunaan" /></Field>
      <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={f.rx} onChange={(e) => setF({ ...f, rx: e.target.checked })} className="h-4 w-4 accent-[#00BF63]" /> Wajib resep</label>
      <div className="flex items-end lg:col-span-2"><Button onClick={submit} disabled={!f.name.trim() || !f.priceIdr}><IconPlus size={16} /> Tambah Obat</Button></div>
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

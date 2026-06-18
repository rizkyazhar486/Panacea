import { useState } from 'react'
import { useStore } from '../lib/store'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconWallet, IconPill, IconStethoscope, IconShield, IconHeart } from '../components/icons'
import type { Order, OrderCategory } from '../lib/types'

const CATS: (OrderCategory | 'Semua')[] = ['Semua', 'Obat', 'Konsultasi', 'Langganan', 'Lab']

const catIcon: Record<OrderCategory, React.ReactNode> = {
  Obat: <IconPill size={18} />,
  Konsultasi: <IconStethoscope size={18} />,
  Langganan: <IconShield size={18} />,
  Lab: <IconHeart size={18} />,
  Lainnya: <IconWallet size={18} />,
}
const statusTone = { Diproses: 'low', Diterima: 'brand', Selesai: 'normal' } as const

export function Orders() {
  const { state } = useStore()
  const [cat, setCat] = useState<(typeof CATS)[number]>('Semua')

  const filtered = state.orders.filter((o) => cat === 'Semua' || o.category === cat)
  // group by date (yyyy-mm-dd)
  const groups = new Map<string, Order[]>()
  for (const o of filtered) {
    const d = new Date(o.at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    groups.set(d, [...(groups.get(d) ?? []), o])
  }
  const totalByCat = (c: OrderCategory) => state.orders.filter((o) => o.category === c).reduce((a, o) => a + o.amountIdr, 0)

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle icon={<IconWallet size={20} />} title="Riwayat Transaksi" subtitle="Semua transaksi digabung — saring per jenis pembelian" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(['Obat', 'Konsultasi', 'Langganan', 'Lab'] as OrderCategory[]).map((c) => (
            <div key={c} className="rounded-xl bg-neutral-50 p-3">
              <div className="flex items-center gap-1.5 text-neutral-400">{catIcon[c]}<span className="text-[11px] font-semibold uppercase tracking-wide">{c}</span></div>
              <div className="mt-1 text-lg font-extrabold">Rp{totalByCat(c).toLocaleString('id-ID')}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${cat === c ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500'}`}>{c}</button>
          ))}
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="text-center text-sm text-neutral-400">Belum ada transaksi pada kategori ini.</Card>
      ) : (
        [...groups.entries()].map(([date, items]) => (
          <div key={date} className="space-y-2">
            <div className="px-1 text-xs font-bold uppercase tracking-wide text-neutral-400">{date}</div>
            {items.map((o) => (
              <Card key={o.id} className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-dark">{catIcon[o.category]}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-bold">{o.title}</span>
                    <Badge tone={statusTone[o.status]}>{o.status}</Badge>
                  </div>
                  {o.detail && <p className="truncate text-xs text-neutral-500">{o.detail}</p>}
                  <p className="text-[11px] text-neutral-400">{new Date(o.at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' })} · {o.category}</p>
                </div>
                <span className="shrink-0 font-extrabold">Rp{o.amountIdr.toLocaleString('id-ID')}</span>
              </Card>
            ))}
          </div>
        ))
      )}
    </div>
  )
}

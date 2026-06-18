import { useState } from 'react'
import { useStore, uid } from '../lib/store'
import { Card, SectionTitle, Button, Badge } from '../components/ui'
import { IconHospital, IconPhone, IconCheck } from '../components/icons'
import { HOSPITALS } from '../lib/hospitals'

export function Hospitals() {
  const { account, sendEmail } = useStore()
  const [scheduled, setScheduled] = useState<string>('')
  const sorted = [...HOSPITALS].sort((a, b) => a.distanceKm - b.distanceKm)

  function schedule(name: string) {
    const at = new Date().toISOString()
    sendEmail({
      id: uid(),
      to: account?.email ?? '',
      subject: `Permintaan penjadwalan tindakan — ${name}`,
      body: `Permintaan rujukan & penjadwalan tindakan/operasi ke ${name} diterima. Admin akan menghubungi Anda untuk konfirmasi jadwal.`,
      at,
    })
    setScheduled(name)
    setTimeout(() => setScheduled(''), 3000)
  }

  return (
    <div className="space-y-6">
      {scheduled && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl bg-ink px-4 py-2 text-sm text-white shadow-lg">
          ✓ Permintaan jadwal ke {scheduled} dikirim ke admin · cek email
        </div>
      )}
      <Card>
        <SectionTitle
          icon={<IconHospital size={20} />}
          title="Cari Rumah Sakit Terdekat"
          subtitle="Rujukan untuk tindakan atau operasi · penjadwalan dibantu admin"
        />
        <div className="rounded-xl bg-brand-50/60 px-3 py-2 text-xs text-brand-dark">
          📍 Lokasi: Jakarta (simulasi). Daftar diurutkan berdasarkan jarak terdekat.
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {sorted.map((h) => (
          <Card key={h.id} className="flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold leading-tight">{h.name}</h3>
                <p className="text-sm text-neutral-500">{h.city} · {h.type}</p>
              </div>
              <Badge tone="brand">{h.distanceKm} km</Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {h.services.map((s) => (
                <span key={s} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">{s}</span>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs text-neutral-500">
              <span>★ {h.rating} · {h.phone}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" className="flex-1"><IconPhone size={14} /> Hubungi</Button>
              <Button className="flex-1" onClick={() => schedule(h.name)}><IconCheck size={14} /> Jadwalkan via Admin</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

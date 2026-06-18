import type { ReactNode } from 'react'
import { useStore } from '../lib/store'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconStethoscope, IconPhone, IconSparkle, IconCheck } from '../components/icons'

const TICKETS = [
  { id: '#4821', user: 'Bpk. Hartono', topic: 'Penjadwalan operasi katarak', status: 'Diproses AI', tone: 'high' as const },
  { id: '#4815', user: 'Ibu Siti', topic: 'Tidak bisa unduh materi', status: 'Selesai', tone: 'brand' as const },
  { id: '#4809', user: 'dr. Maya', topic: 'Status verifikasi tertunda', status: 'Eskalasi manusia', tone: 'high' as const },
]

export function Admin() {
  const { state } = useStore()
  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle
          icon={<IconStethoscope size={20} />}
          title="Layanan & Admin"
          subtitle="Admin manusia + AI Chatbot otomatis (lambang telfon di tiap halaman)"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <Mini icon={<IconPhone size={18} />} label="Tiket aktif" value="2" />
          <Mini icon={<IconSparkle size={18} />} label="Ditangani AI" value="83%" />
          <Mini icon={<IconCheck size={18} />} label="Selesai hari ini" value="14" />
        </div>
      </Card>

      <Card>
        <SectionTitle title="Tiket Keluhan & Kendala" subtitle="Untuk memperbaiki sistem & membantu pelayanan" />
        <div className="space-y-2">
          {TICKETS.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-100 px-3 py-2">
              <div>
                <span className="font-bold">{t.id}</span> <span className="text-sm text-neutral-500">— {t.topic}</span>
                <div className="text-xs text-neutral-400">{t.user}</div>
              </div>
              <Badge tone={t.tone}>{t.status}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle title="Email Keluar (Sistem)" subtitle="Notifikasi otomatis ke pengguna" />
        {state.emails.length === 0 ? (
          <p className="text-sm text-neutral-400">Belum ada email terkirim.</p>
        ) : (
          <div className="space-y-2">
            {state.emails.slice(0, 8).map((e) => (
              <div key={e.id} className="rounded-xl border border-neutral-100 px-3 py-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold">{e.subject}</span>
                  <span className="text-xs text-neutral-400">{new Date(e.at).toLocaleString('id-ID')}</span>
                </div>
                <div className="text-xs text-neutral-500">ke {e.to}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

function Mini({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-neutral-50 p-3">
      <div className="flex items-center gap-2 text-neutral-400">{icon}<span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span></div>
      <div className="text-2xl font-extrabold">{value}</div>
    </div>
  )
}

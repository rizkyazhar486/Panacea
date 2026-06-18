import type { ReactNode } from 'react'
import { useStore } from '../lib/store'
import { Card, SectionTitle } from '../components/ui'
import { IconStethoscope, IconPhone, IconSparkle, IconCheck } from '../components/icons'

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
          <Mini icon={<IconPhone size={18} />} label="Tiket aktif" value="0" />
          <Mini icon={<IconSparkle size={18} />} label="Ditangani AI" value="—" />
          <Mini icon={<IconCheck size={18} />} label="Selesai hari ini" value="0" />
        </div>
      </Card>

      <Card>
        <SectionTitle title="Tiket Keluhan & Kendala" subtitle="Untuk memperbaiki sistem & membantu pelayanan" />
        <p className="text-sm text-neutral-400">Belum ada tiket masuk.</p>
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

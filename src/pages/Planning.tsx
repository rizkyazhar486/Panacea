import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore, uid } from '../lib/store'
import { Card, SectionTitle, Badge, Button, Field, inputClass } from '../components/ui'
import { IconPlan, IconCheck, IconPlus, IconSparkle } from '../components/icons'
import type { PlanItem } from '../lib/types'

const CATEGORIES: PlanItem['category'][] = [
  'Suportif',
  'Definitif',
  'Edukasi',
  'Follow-up',
  'Monitoring',
]

export function Planning() {
  const { state, activePatient, saveRecord } = useStore()
  const record = state.records[activePatient.id]
  const [newCat, setNewCat] = useState<PlanItem['category']>('Definitif')
  const [newText, setNewText] = useState('')

  if (!record) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <IconPlan size={40} className="mx-auto text-brand" />
        <h3 className="mt-3 text-lg font-bold">Belum ada rencana</h3>
        <p className="mt-1 text-sm text-neutral-500">
          Susun draft di <b>AI Chatbot</b> terlebih dahulu untuk memunculkan usulan rencana AI.
        </p>
        <Link to="/chatbot" className="mt-4 inline-block">
          <Button>Buka AI Chatbot</Button>
        </Link>
      </Card>
    )
  }

  function update(plan: PlanItem[]) {
    saveRecord({ ...record!, plan, updatedAt: new Date().toISOString() })
  }
  function setStatus(id: string, status: PlanItem['status']) {
    update(record!.plan.map((p) => (p.id === id ? { ...p, status } : p)))
  }
  function add() {
    if (!newText.trim()) return
    update([
      ...record!.plan,
      { id: uid(), category: newCat, text: newText.trim(), source: 'Dokter', status: 'diverifikasi' },
    ])
    setNewText('')
  }
  function remove(id: string) {
    update(record!.plan.filter((p) => p.id !== id))
  }

  const verified = record.plan.filter((p) => p.status === 'diverifikasi').length
  const pending = record.plan.filter((p) => p.status === 'usulan').length

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle
          icon={<IconPlan size={20} />}
          title="Planning — Rekomendasi AI, Verifikasi Dokter"
          subtitle="AI mengusulkan tatalaksana; dokter memverifikasi, menolak, atau menambah"
          right={
            <div className="flex gap-2">
              <Badge tone="brand">{verified} diverifikasi</Badge>
              {pending > 0 && <Badge tone="high">{pending} menunggu</Badge>}
            </div>
          }
        />

        <div className="space-y-3">
          {record.plan.map((pi) => (
            <div
              key={pi.id}
              className={`flex flex-wrap items-start justify-between gap-3 rounded-xl border p-3 ${
                pi.status === 'diverifikasi'
                  ? 'border-brand/30 bg-brand-50/40'
                  : pi.status === 'ditolak'
                    ? 'border-neutral-200 bg-neutral-50'
                    : 'border-amber-200 bg-amber-50/40'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <Badge tone="neutral">{pi.category}</Badge>
                  <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                    {pi.source === 'AI' ? <IconSparkle size={12} /> : <IconCheck size={12} />}
                    {pi.source}
                  </span>
                  {pi.status === 'usulan' && <Badge tone="high">Usulan</Badge>}
                  {pi.status === 'ditolak' && <Badge tone="neutral">Ditolak</Badge>}
                </div>
                <p className={`text-sm ${pi.status === 'ditolak' ? 'text-neutral-400 line-through' : ''}`}>
                  {pi.text}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                {pi.status !== 'diverifikasi' && (
                  <Button variant="outline" onClick={() => setStatus(pi.id, 'diverifikasi')}>
                    <IconCheck size={14} /> Verifikasi
                  </Button>
                )}
                {pi.status !== 'ditolak' ? (
                  <Button variant="ghost" onClick={() => setStatus(pi.id, 'ditolak')}>
                    Tolak
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => remove(pi.id)}>
                    Hapus
                  </Button>
                )}
              </div>
            </div>
          ))}
          {record.plan.length === 0 && (
            <p className="text-sm text-neutral-400">Belum ada item rencana.</p>
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle icon={<IconPlus size={18} />} title="Tambah Rencana oleh Dokter" />
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-40">
            <Field label="Kategori">
              <select
                className={inputClass}
                value={newCat}
                onChange={(e) => setNewCat(e.target.value as PlanItem['category'])}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="min-w-[240px] flex-1">
            <Field label="Instruksi / Tatalaksana">
              <input
                className={inputClass}
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add()}
                placeholder="mis. Furosemide 40 mg IV — verifikasi dosis pada formularium"
              />
            </Field>
          </div>
          <Button onClick={add} disabled={!newText.trim()}>
            <IconPlus size={16} /> Tambah
          </Button>
        </div>
        <p className="mt-3 text-xs text-neutral-400">
          ⚕️ Untuk obat high-alert (antikoagulan, insulin, opioid, vasopresor), AI hanya memberi
          rentang & rujukan — dosis final dihitung dan diverifikasi dokter.
        </p>
      </Card>
    </div>
  )
}

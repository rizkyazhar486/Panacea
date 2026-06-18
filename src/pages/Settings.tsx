import { useState } from 'react'
import { useStore } from '../lib/store'
import { Card, SectionTitle, Button, Field, inputClass, Badge } from '../components/ui'
import { IconSettings, IconShield } from '../components/icons'
import { hasKey } from '../lib/ai'

const MODELS = [
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (cepat & hemat)' },
  { id: 'claude-opus-4-8', label: 'Claude Opus 4.8 (penalaran terdalam)' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (ringan)' },
]

export function Settings() {
  const { state, updateSettings, resetDemo } = useStore()
  const [key, setKey] = useState(state.settings.apiKey)
  const [doctor, setDoctor] = useState(state.settings.doctorName)
  const [saved, setSaved] = useState(false)

  function save() {
    updateSettings({ apiKey: key.trim(), doctorName: doctor.trim() || 'dr. Pemeriksa' })
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <SectionTitle
          icon={<IconSettings size={20} />}
          title="Pengaturan AI Co-Physician"
          subtitle="Konfigurasi model & identitas dokter pemeriksa"
          right={<Badge tone={hasKey(state.settings) ? 'brand' : 'high'}>{hasKey(state.settings) ? 'AI Live' : 'Mode Demo'}</Badge>}
        />
        <div className="space-y-4">
          <Field label="Anthropic API Key">
            <input
              className={inputClass}
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-ant-..."
            />
          </Field>
          <div className="flex items-start gap-2 rounded-xl bg-neutral-50 p-3 text-xs text-neutral-500">
            <IconShield size={16} className="mt-0.5 shrink-0 text-brand" />
            Kunci disimpan <b className="mx-1">hanya di browser Anda</b> (localStorage) dan dipakai
            untuk memanggil Claude API langsung. Tanpa kunci, aplikasi berjalan dalam Mode Demo
            tersimulasi.
          </div>

          <Field label="Model">
            <select
              className={inputClass}
              value={state.settings.model}
              onChange={(e) => updateSettings({ model: e.target.value })}
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Nama Dokter Pemeriksa">
            <input
              className={inputClass}
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
              placeholder="dr. Nama, Sp.PD"
            />
          </Field>

          <div className="flex items-center gap-3">
            <Button onClick={save}>{saved ? 'Tersimpan ✓' : 'Simpan'}</Button>
            <Button variant="ghost" onClick={resetDemo}>
              Reset Data Demo
            </Button>
          </div>
        </div>
      </Card>
      <p className="px-1 text-center text-xs text-neutral-400">
        Info selengkapnya tentang Panaceamed.id ada di halaman <b>Beranda → Tentang Kami</b>.
      </p>
    </div>
  )
}

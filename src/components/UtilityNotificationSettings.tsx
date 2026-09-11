import { useState } from 'react'
import {
  loadUtilityNotificationPreferences,
  saveUtilityNotificationPreferences,
  type UtilityNotificationPreferences,
} from '../lib/notificationUtilities'
import { useStore } from '../lib/store'
import { Card } from './ui'

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  description: string
}) {
  return (
    <label className="flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 bg-white/80 p-3.5 dark:border-white/10 dark:bg-white/[.025]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-brand"
      />
      <span className="min-w-0">
        <span className="block text-sm font-black text-ink dark:text-white">{label}</span>
        <span className="mt-0.5 block text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{description}</span>
      </span>
    </label>
  )
}

export function UtilityNotificationSettings() {
  const { account } = useStore()
  const [preferences, setPreferences] = useState<UtilityNotificationPreferences>(loadUtilityNotificationPreferences)

  function update(patch: Partial<UtilityNotificationPreferences>) {
    const next = { ...preferences, ...patch }
    setPreferences(next)
    saveUtilityNotificationPreferences(next)
  }

  return (
    <Card>
      <div className="mb-3">
        <h3 className="text-sm font-black text-ink dark:text-white">Daily & owner utilities</h3>
        <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          These are product utilities, not medical predictions. They follow the master smart-notification quiet hours and daily limit and never request browser permission by themselves.
        </p>
      </div>
      <div className="grid gap-2.5 lg:grid-cols-2">
        <Toggle
          checked={preferences.faithDaily}
          onChange={(faithDaily) => update({ faithDaily })}
          label="Ayat hari ini & arah kiblat"
          description="Opt in to one morning reminder. The alert links to Faith; it does not invent a verse, prayer time or qibla bearing outside the actual Faith tools."
        />
        {account?.isOwner && (
          <Toggle
            checked={preferences.ownerMilestones}
            onChange={(ownerMilestones) => update({ ownerMilestones })}
            label="Owner user milestones"
            description="Alert at 100, 250, 500 and 1,000 registered users using the real backend user count. A registration milestone is kept separate from revenue and retention."
          />
        )}
      </div>
    </Card>
  )
}

export default UtilityNotificationSettings

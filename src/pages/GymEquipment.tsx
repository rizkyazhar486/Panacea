import { useMemo, useState } from 'react'
import { Prosa } from '../components/Prosa'
import { Card, SectionTitle, Badge, inputClass } from '../components/ui'
import { IconRun } from '../components/icons'
import { EQUIPMENT, GROUP_LABEL, equipmentByGroup, type Group } from '../lib/gymEquipment'

// Equipment education. The comparison against calisthenics is stated in both
// directions for every item — where the machine genuinely wins, where the
// bodyweight version genuinely wins, and where the difference is small enough
// not to matter. "Machines are useless" and "machines are safer and better" are
// both marketing, and a user is better served by knowing the actual trade-off.

const GROUPS: Group[] = ['kardio', 'kekuatan', 'hyrox', 'fungsional']

export function GymEquipment() {
  const [group, setGroup] = useState<Group | null>(null)
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const list = useMemo(() => equipmentByGroup(group, query), [group, query])

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-2xl">🏋️</span>
        <div>
          <h1 className="text-lg font-black text-ink dark:text-ink">Gym Equipment & Hyrox</h1>
          <p className="text-xs text-neutral-500">How to use each one, which muscles work, and an honest comparison with calisthenics</p>
        </div>
      </div>

      <Card className="!p-4">
        <SectionTitle icon={<IconRun size={18} />} title={`${EQUIPMENT.length} machines & stations`}
          subtitle="Termasuk seluruh stasiun resmi Hyrox" />
        <Prosa kelas="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">Tiap mesin di sini dibandingkan dengan padanan tanpa alatnya ke dua arah: di mana mesinnya benar-benar unggul, di mana gerakan berat badan yang unggul, dan kapan selisihnya terlalu kecil untuk diperdebatkan. "Mesin selalu lebih rendah" dan "mesin selalu lebih aman" sama-sama tidak tepat — yang benar-benar berbeda, dan dapat diukur, adalah seberapa banyak kerja otot penstabil yang dituntut gerakan itu, semudah apa bebannya ditambah, seberapa besar keterampilan yang diperlukan, dan sebaik apa ia terbawa ke kehidupan nyata.</Prosa>
        <input
          className={inputClass + ' mt-3'}
          placeholder="Search equipment (e.g. treadmill, sled, rower, glutes)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => setGroup(null)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${!group ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
            Semua
          </button>
          {GROUPS.map((g) => (
            <button key={g} onClick={() => setGroup(group === g ? null : g)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${group === g ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
              {GROUP_LABEL[g]}
            </button>
          ))}
        </div>
      </Card>

      {list.length === 0 && (
        <p className="text-center text-[13px] text-neutral-500">Nothing matched — try a different term.</p>
      )}

      {list.map((e) => {
        const open = openId === e.id
        return (
          <Card key={e.id} className="!p-4">
            <button className="flex w-full items-start justify-between gap-2 text-left"
              onClick={() => setOpenId(open ? null : e.id)}>
              <div className="min-w-0">
                <div className="text-[14px] font-black text-ink dark:text-ink">{e.name}</div>
                <div className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">{e.purpose}</div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge tone={e.group === 'hyrox' ? 'brand' : 'low'}>{GROUP_LABEL[e.group]}</Badge>
                <span className="text-[11px] font-bold text-neutral-500">{open ? 'Tutup ▲' : 'Buka ▼'}</span>
              </div>
            </button>

            {open && (
              <div className="mt-3 space-y-3 border-t border-neutral-200 pt-3 dark:border-white/10">
                {e.hyroxNote && (
                  <div className="rounded-xl bg-brand-50 p-3 dark:bg-brand/10">
                    <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Hyrox note</div>
                    <p className="mt-1 text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-200">{e.hyroxNote}</p>
                  </div>
                )}

                <div>
                  <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">How to use it</div>
                  <ol className="mt-1 space-y-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                    {e.howTo.map((h, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="shrink-0 font-bold text-neutral-500">{i + 1}.</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <div className="text-[11px] font-black uppercase tracking-wide text-rose-600 dark:text-rose-600">Common mistakes</div>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                    {e.mistakes.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                    <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Primary muscles</div>
                    <ul className="mt-1 space-y-0.5 text-[12px] text-neutral-700 dark:text-neutral-200">
                      {e.primaryMuscles.map((m) => <li key={m}>• {m}</li>)}
                    </ul>
                  </div>
                  <div className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                    <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Secondary muscles</div>
                    <ul className="mt-1 space-y-0.5 text-[12px] text-neutral-700 dark:text-neutral-200">
                      {e.secondaryMuscles.map((m) => <li key={m}>• {m}</li>)}
                    </ul>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Machine vs calisthenics</div>
                  <div className="mt-1.5 space-y-2">
                    <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-500/10">
                      <div className="text-[11px] font-black text-emerald-800 dark:text-emerald-300">Where the machine wins</div>
                      <p className="mt-1 text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-200">{e.machineWins}</p>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-500/10">
                      <div className="text-[11px] font-black text-amber-800 dark:text-amber-300">Where bodyweight wins</div>
                      <p className="mt-1 text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-200">{e.calisthenicWins}</p>
                    </div>
                    <div className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                      <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Bodyweight substitute</div>
                      <p className="mt-1 text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-200">{e.calisthenicAlternative}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-brand/30 bg-white p-3 dark:bg-white/5">
                  <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Bottom line</div>
                  <p className="mt-1 text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-200">{e.verdict}</p>
                </div>
              </div>
            )}
          </Card>
        )
      })}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        General guidance for healthy adults. If you have an injury, heart disease, a back problem,
        or are pregnant, check with a clinician before using loaded equipment. Ask an instructor for
        help the first time you try a machine you do not know.
      </div>
    </div>
  )
}

export default GymEquipment

import { useMemo, useState } from 'react'
import { Card, SectionTitle, Badge, Field, inputClass } from '../components/ui'
import { IconRun, IconActivity, IconHeart, IconTimer } from '../components/icons'
import {
  RUN_ZONES, PACE_TABLE, LADDERS, POSTURE_PROGRAM, RULES,
  fmtPace, parsePace, trainingPaces, paceFromRun, weeklyTemplate,
  type RunType, type Ladder,
} from '../lib/baseTraining'
import {
  MUSCLE_GROUPS, STRETCH_RULES, ROUTINES, RED_FLAGS, WEEKLY_TARGET_SEC,
  stretchDose, fmtDur, type Wilayah,
} from '../lib/stretching'

// ─────────────────────────────────────────────────────────────────────────────
// Foundation Training — lari, push-up, pull-up, sit-up, dan koreksi postur.
//
// Dua hal yang tidak ada di halaman fitness lain: kalkulator pace latihan
// (supaya orang berhenti menjalankan semua sesi lari sekencang mungkin) dan
// tangga progresi kalistenik (supaya "3×10" punya arti pada level mana pun).
// Seluruh perhitungan berjalan offline.
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'lari' | 'kalistenik' | 'postur' | 'peregangan' | 'jadwal'

const ZONE_COLOR: Record<RunType, string> = {
  easy: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
  long: 'bg-sky-500/10 border-sky-500/30 text-sky-300',
  tempo: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
  interval: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
}

export function BaseTraining() {
  const [tab, setTab] = useState<Tab>('lari')

  return (
    <div className="space-y-4">
      <SectionTitle icon={<IconRun />} title="Foundation Training" subtitle="Running, push-ups, pull-ups, sit-ups, and posture correction" />

      <Card>
        <p className="text-sm text-neutral-600 leading-relaxed">
          Halaman ini menjawab dua pertanyaan yang paling sering salah dijawab orang yang berlatih tanpa pelatih:
          <strong className="text-ink"> secepat apa seharusnya berlari</strong>, dan
          <strong className="text-ink"> mulai dari mana kalau satu pull-up pun belum bisa</strong>.
          Semua hitungan berjalan di perangkat ini, tanpa mengirim data ke mana pun.
        </p>
      </Card>

      <div className="flex flex-wrap gap-2">
        {([
          ['lari', '🏃 Pace Lari'],
          ['kalistenik', '💪 Push/Pull/Sit-Up'],
          ['postur', '🧍 Koreksi Postur'],
          ['peregangan', '🧘 Peregangan'],
          ['jadwal', '🗓️ Susunan Seminggu'],
        ] as [Tab, string][]).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition ${
              tab === k ? 'bg-white/10 border-white/30 text-white' : 'border-white/10 text-neutral-500 hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'lari' && <RunTab />}
      {tab === 'kalistenik' && <CalisthenicsTab />}
      {tab === 'postur' && <PostureTab />}
      {tab === 'peregangan' && <StretchTab />}
      {tab === 'jadwal' && <ScheduleTab />}

      <Card>
        <SectionTitle icon={<IconHeart />} title="The rule broken most often" />
        <div className="space-y-3 mt-2">
          {RULES.map((r) => (
            <div key={r.judul} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-sm font-semibold text-ink">{r.judul}</div>
              <p className="text-sm text-neutral-500 mt-1 leading-relaxed">{r.isi}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function RunTab() {
  const [mode, setMode] = useState<'pace' | 'waktu'>('pace')
  const [racePace, setRacePace] = useState('5:30')
  const [dist, setDist] = useState('5')
  const [mins, setMins] = useState('27')

  const derived = useMemo(() => {
    if (mode === 'pace') return parsePace(racePace)
    const d = Number(dist)
    const m = Number(mins)
    return paceFromRun(d, m)
  }, [mode, racePace, dist, mins])

  const result = useMemo(() => (derived == null ? null : trainingPaces(derived)), [derived])

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle icon={<IconTimer />} title="Training pace calculator" subtitle="From your race pace, work out the pace for each kind of run" />

        <div className="flex gap-2 mt-3 mb-3">
          {([['pace', 'Saya tahu pace lomba'], ['waktu', 'Saya tahu waktu lari terakhir']] as ['pace' | 'waktu', string][]).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setMode(k)}
              className={`px-3 py-1 rounded-lg text-xs border ${mode === k ? 'bg-white/10 border-white/30 text-white' : 'border-white/10 text-neutral-500'}`}
            >
              {l}
            </button>
          ))}
        </div>

        {mode === 'pace' ? (
          <Field label="Pace lomba (menit:detik per km)">
            <input className={inputClass} value={racePace} onChange={(e) => setRacePace(e.target.value)} placeholder="5:30" inputMode="numeric" />
          </Field>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Jarak (km)">
              <input className={inputClass} value={dist} onChange={(e) => setDist(e.target.value)} inputMode="decimal" />
            </Field>
            <Field label="Waktu (menit)">
              <input className={inputClass} value={mins} onChange={(e) => setMins(e.target.value)} inputMode="decimal" />
            </Field>
          </div>
        )}

        {derived == null && (
          <p className="text-sm text-amber-300 mt-3">Masukkan pace dalam format menit:detik, misalnya 5:30.</p>
        )}

        {result && (
          <>
            <div className="mt-4 text-sm text-neutral-500">
              Pace acuan: <span className="text-ink font-semibold">{fmtPace(result.race)}</span> /km
              {result.clamped && (
                <span className="ml-2 text-amber-300">
                  (di luar rentang tabel 3:00-6:00 — angka diambil dari baris terdekat)
                </span>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 mt-3">
              {RUN_ZONES.map((z) => {
                const [a, b] = result.zones[z.key]
                return (
                  <div key={z.key} className={`rounded-xl border p-3 ${ZONE_COLOR[z.key]}`}>
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="font-semibold">{z.name}</div>
                      <div className="text-lg font-bold tabular-nums">{fmtPace(a)}–{fmtPace(b)}</div>
                    </div>
                    <div className="text-xs opacity-80 mt-0.5">{z.tujuan} · {z.porsi}</div>
                  </div>
                )
              })}
            </div>

            <p className="text-xs text-slate-500 mt-3">
              Estimasi mengikuti kerangka VDOT (Jack Daniels' Running Formula), diinterpolasi di antara baris tabel.
              Angka ini titik awal, bukan aturan mati — sesuaikan dengan rasa dan cuaca.
            </p>
          </>
        )}
      </Card>

      <Card>
        <SectionTitle icon={<IconRun />} title="Empat jenis lari, empat tujuan berbeda" subtitle="Do not run every session as hard as you can" />
        <div className="space-y-3 mt-2">
          {RUN_ZONES.map((z) => (
            <div key={z.key} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-ink">{z.name}</span>
                <Badge>{z.tujuan}</Badge>
                <span className="text-xs text-slate-500">{z.durasi}</span>
              </div>
              <p className="text-sm text-neutral-500 mt-2 leading-relaxed">{z.kenapa}</p>
              <div className="mt-2 grid gap-1 text-xs">
                <div className="text-neutral-500"><span className="text-slate-500">Rasanya:</span> {z.rasa}</div>
                <div className="text-neutral-500"><span className="text-slate-500">Porsi:</span> {z.porsi}</div>
                <div className="text-amber-300/90"><span className="text-amber-500/80">Kesalahan umum:</span> {z.salahnya}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle title="Tabel pace lengkap" subtitle="For race paces of 3:00–6:00 per km" />
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="text-neutral-500 border-b border-white/10">
                <th className="text-left py-2 pr-3 font-medium">Pace lomba</th>
                <th className="text-left py-2 pr-3 font-medium">Easy</th>
                <th className="text-left py-2 pr-3 font-medium">Long</th>
                <th className="text-left py-2 pr-3 font-medium">Tempo</th>
                <th className="text-left py-2 font-medium">Interval</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {PACE_TABLE.map((r) => (
                <tr key={r.race} className="border-b border-white/5">
                  <td className="py-2 pr-3 text-ink font-semibold">{fmtPace(r.race)}/km</td>
                  <td className="py-2 pr-3 text-emerald-300">{fmtPace(r.easy[0])}–{fmtPace(r.easy[1])}</td>
                  <td className="py-2 pr-3 text-sky-300">{fmtPace(r.long[0])}–{fmtPace(r.long[1])}</td>
                  <td className="py-2 pr-3 text-amber-300">{fmtPace(r.tempo[0])}–{fmtPace(r.tempo[1])}</td>
                  <td className="py-2 text-rose-300">{fmtPace(r.interval[0])}–{fmtPace(r.interval[1])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function CalisthenicsTab() {
  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm text-neutral-600 leading-relaxed">
          Tangga di bawah menggantikan resep "3×10" yang tidak berarti apa-apa bila satu repetisi penuh pun belum bisa,
          dan tidak menantang bila sudah bisa tiga puluh. <strong className="text-ink">Mulai dari tingkat yang bisa
          Anda kerjakan hari ini</strong>, dan naik hanya setelah syaratnya terpenuhi.
        </p>
      </Card>
      {LADDERS.map((l) => <LadderCard key={l.key} ladder={l} />)}
    </div>
  )
}

function LadderCard({ ladder }: { ladder: Ladder }) {
  const [level, setLevel] = useState(1)
  const cur = ladder.steps.find((s) => s.level === level) ?? ladder.steps[0]

  return (
    <Card>
      <SectionTitle icon={<IconActivity />} title={ladder.title} subtitle={ladder.otot} />

      <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3 mt-2">
        <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wide">Kaitannya dengan postur</div>
        <p className="text-sm text-neutral-600 mt-1 leading-relaxed">{ladder.postur}</p>
      </div>

      <div className="text-xs text-slate-500 mt-3">{ladder.frekuensi}</div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {ladder.steps.map((s) => (
          <button
            key={s.level}
            onClick={() => setLevel(s.level)}
            className={`px-2.5 py-1 rounded-md text-xs border transition ${
              s.level === level ? 'bg-white/10 border-white/30 text-white' : 'border-white/10 text-neutral-500 hover:text-ink'
            }`}
          >
            {s.level}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 mt-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Tingkat {cur.level}</Badge>
          <span className="font-semibold text-ink">{cur.name}</span>
          <span className="text-sm text-neutral-500">— {cur.target}</span>
        </div>
        <div className="mt-2 text-sm text-neutral-500"><span className="text-slate-500">Teknik:</span> {cur.cue}</div>
        <div className="mt-1 text-sm text-emerald-300/90"><span className="text-emerald-500/80">Naik tingkat bila:</span> {cur.naik}</div>
      </div>
    </Card>
  )
}

function PostureTab() {
  const grup = {
    regangkan: POSTURE_PROGRAM.filter((p) => p.jenis === 'regangkan'),
    kuatkan: POSTURE_PROGRAM.filter((p) => p.jenis === 'kuatkan'),
    sadari: POSTURE_PROGRAM.filter((p) => p.jenis === 'sadari'),
  }

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle icon={<IconActivity />} title="Why posture breaks down, and what actually needs fixing" />
        <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
          Berdiri membungkuk maupun duduk berjam-jam menghasilkan pola yang dapat diprediksi:
          <strong className="text-ink"> otot depan memendek dan otot belakang melemah</strong> — dada dan otot leher
          depan menarik bahu ke depan, sementara rhomboid serta trapezius bawah yang seharusnya menahan belikat justru
          kehilangan kekuatan. Karena itu programnya berpasangan: regangkan yang memendek, kuatkan yang melemah.
          Mengerjakan salah satunya saja jarang mengubah apa pun.
        </p>
        <p className="text-sm text-neutral-500 mt-3 leading-relaxed">
          Yang perlu diluruskan: postur bukan soal menemukan satu posisi sempurna lalu mempertahankannya. Kerusakan
          datang dari <strong className="text-ink">lamanya menetap dalam satu posisi</strong>, bukan dari posisi itu
          sendiri — sehingga sering berpindah posisi lebih menentukan daripada duduk "benar" selama enam jam.
        </p>
      </Card>

      {([
        ['kuatkan', '💪 Kuatkan yang melemah', 'Ini bagian yang paling menentukan dan paling sering dilewati'],
        ['regangkan', '🧘 Regangkan yang memendek', 'Tanpa ini, otot yang dikuatkan terus ditarik kembali ke depan'],
        ['sadari', '🧠 Ubah yang bisa diubah', 'Perubahan lingkungan bertahan lebih lama daripada niat'],
      ] as ['kuatkan' | 'regangkan' | 'sadari', string, string][]).map(([k, title, sub]) => (
        <Card key={k}>
          <SectionTitle title={title} subtitle={sub} />
          <div className="space-y-2 mt-2">
            {grup[k].map((p) => (
              <div key={p.nama} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold text-ink text-sm">{p.nama}</span>
                  <span className="text-xs text-neutral-500">{p.dosis}</span>
                </div>
                <p className="text-sm text-neutral-500 mt-1 leading-relaxed">{p.cue}</p>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}

function ScheduleTab() {
  const [hari, setHari] = useState<3 | 4 | 5>(3)
  const plan = useMemo(() => weeklyTemplate(hari), [hari])

  const warna: Record<string, string> = {
    lari: 'border-sky-500/30 bg-sky-500/10',
    kekuatan: 'border-violet-500/30 bg-violet-500/10',
    pulih: 'border-slate-500/30 bg-slate-500/10',
  }

  return (
    <Card>
      <SectionTitle icon={<IconTimer />} title="Susunan seminggu" subtitle="Combining running, calisthenics, and recovery" />

      <div className="flex gap-2 mt-3">
        {([3, 4, 5] as const).map((n) => (
          <button
            key={n}
            onClick={() => setHari(n)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${hari === n ? 'bg-white/10 border-white/30 text-white' : 'border-white/10 text-neutral-500'}`}
          >
            {n} hari lari
          </button>
        ))}
      </div>

      <div className="space-y-2 mt-4">
        {plan.map((d) => (
          <div key={d.hari} className={`rounded-lg border p-3 ${warna[d.jenis]}`}>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-semibold text-ink w-16">{d.hari}</span>
              <span className="text-sm text-neutral-600">{d.isi}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-neutral-500 mt-4 leading-relaxed">
        Susunan ini menyisakan minimal dua hari pemulihan. Bila jam tidur sedang kacau karena jaga malam,
        <strong className="text-ink"> kurangi jumlah sesi alih-alih memaksakan semuanya</strong> — berlatih dengan
        kurang tidur memberi hasil yang lebih buruk daripada berlatih lebih sedikit dengan tidur cukup.
      </p>
    </Card>
  )
}

// ─── Peregangan ─────────────────────────────────────────────────────────────
// Disusun sebagai: aturan dulu, baru gerakan. Urutan ini disengaja — kesalahan
// tersering bukan pada pemilihan gerakan melainkan pada waktu, dosis, dan rasa
// yang dituju, sehingga daftar gerakan tanpa aturannya justru menyesatkan.

const WILAYAH_LABEL: Record<Wilayah, string> = {
  atas: 'Tubuh atas',
  inti: 'Panggul & batang tubuh',
  bawah: 'Tungkai',
}

function StretchTab() {
  const [wilayah, setWilayah] = useState<Wilayah | 'semua'>('semua')
  const [buka, setBuka] = useState<string | null>(MUSCLE_GROUPS[0].key)

  const groups = useMemo(
    () => (wilayah === 'semua' ? MUSCLE_GROUPS : MUSCLE_GROUPS.filter((g) => g.wilayah === wilayah)),
    [wilayah],
  )

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle icon={<IconActivity />} title="Four things that decide whether stretching works or is wasted" />
        <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
          Kesalahan tersering bukan pada memilih gerakan, melainkan pada
          <strong className="text-ink"> kapan</strong>,
          <strong className="text-ink"> seberapa lama</strong>, dan
          <strong className="text-ink"> seberapa kuat</strong> — ditambah satu hal yang hampir tidak pernah
          disampaikan: <strong className="text-ink">otot yang terasa kencang belum tentu otot yang memendek</strong>.
          Otot yang lemah dan tertarik memanjang menimbulkan rasa kencang yang sama persis, dan meregangkannya lebih
          jauh justru memperburuk keadaan.
        </p>
        <div className="space-y-3 mt-3">
          {STRETCH_RULES.map((r) => (
            <div key={r.judul} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-sm font-semibold text-ink">{r.judul}</div>
              <p className="text-sm text-neutral-500 mt-1 leading-relaxed">{r.isi}</p>
            </div>
          ))}
        </div>
      </Card>

      <DoseCalculator />

      <Card>
        <SectionTitle icon={<IconTimer />} title="Rutin siap pakai" subtitle="Four different moments call for different kinds of stretching" />
        <div className="space-y-3 mt-2">
          {ROUTINES.map((r) => (
            <div key={r.key} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold text-ink text-sm">{r.nama}</span>
                <Badge>{r.durasi}</Badge>
              </div>
              <div className="text-xs text-slate-500 mt-1">{r.kapan}</div>
              <p className="text-sm text-neutral-500 mt-1 leading-relaxed">{r.untuk}</p>
              <ol className="mt-2 space-y-1">
                {r.langkah.map((l, i) => (
                  <li key={i} className="text-sm text-neutral-600 flex gap-2">
                    <span className="text-slate-600 tabular-nums">{i + 1}.</span>
                    <span>{l}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle icon={<IconRun />} title="By muscle group" subtitle="Position, where it should be felt, and the most common mistake" />

        <div className="flex flex-wrap gap-2 mt-3">
          {([['semua', 'Semua'], ['atas', 'Tubuh atas'], ['inti', 'Panggul & batang tubuh'], ['bawah', 'Tungkai']] as [Wilayah | 'semua', string][]).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setWilayah(k)}
              className={`px-3 py-1 rounded-lg text-xs border ${wilayah === k ? 'bg-white/10 border-white/30 text-white' : 'border-white/10 text-neutral-500'}`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="space-y-2 mt-3">
          {groups.map((g) => {
            const terbuka = buka === g.key
            return (
              <div key={g.key} className="rounded-lg border border-white/10 bg-white/[0.03] overflow-hidden">
                <button
                  onClick={() => setBuka(terbuka ? null : g.key)}
                  className="w-full text-left p-3 flex items-center gap-3"
                >
                  <span className="text-lg shrink-0">{g.ikon}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold text-ink text-sm">{g.nama}</span>
                    <span className="block text-xs text-slate-500">{WILAYAH_LABEL[g.wilayah]} · {g.stretches.length} gerakan</span>
                  </span>
                  <span className="text-slate-500 text-xs shrink-0">{terbuka ? '▲' : '▼'}</span>
                </button>

                {terbuka && (
                  <div className="px-3 pb-3 space-y-3">
                    <div className="rounded-lg bg-white/[0.03] border border-white/10 p-3">
                      <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Kenapa memendek</div>
                      <p className="text-sm text-neutral-600 mt-1 leading-relaxed">{g.kenapaTegang}</p>
                      <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mt-3">Akibatnya</div>
                      <p className="text-sm text-neutral-500 mt-1 leading-relaxed">{g.akibat}</p>
                    </div>

                    {g.stretches.map((st) => (
                      <div key={st.nama} className="rounded-lg border border-white/10 p-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-semibold text-ink text-sm">{st.nama}</span>
                          <Badge>{st.durasi}</Badge>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{st.otot}</div>

                        <ol className="mt-2 space-y-1">
                          {st.posisi.map((l, i) => (
                            <li key={i} className="text-sm text-neutral-600 flex gap-2">
                              <span className="text-slate-600 tabular-nums">{i + 1}.</span>
                              <span>{l}</span>
                            </li>
                          ))}
                        </ol>

                        <div className="mt-2 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1.5">
                          <span className="text-xs text-emerald-700/80">Seharusnya terasa di: </span>
                          <span className="text-sm text-emerald-200">{st.terasaDi}</span>
                        </div>

                        <div className="mt-1.5 rounded-md bg-amber-500/10 border border-amber-500/25 px-2.5 py-1.5">
                          <span className="text-xs text-amber-700/80">Kesalahan tersering: </span>
                          <span className="text-sm text-amber-100/90">{st.salah}</span>
                        </div>

                        {st.hatiHati && (
                          <div className="mt-1.5 rounded-md bg-rose-500/10 border border-rose-500/25 px-2.5 py-1.5">
                            <span className="text-xs text-rose-600/80">Hati-hati: </span>
                            <span className="text-sm text-rose-100/90">{st.hatiHati}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <SectionTitle icon={<IconHeart />} title="Stop stretching and get checked if you have these" />
        <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
          Tanda-tanda berikut bukan masalah kelenturan. Meregangkannya lebih jauh tidak menolong dan dapat
          memperburuk keadaan.
        </p>
        <ul className="mt-2 space-y-1.5">
          {RED_FLAGS.map((f) => (
            <li key={f} className="text-sm text-rose-200/90 flex gap-2">
              <span className="text-rose-500 shrink-0">•</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-500 mt-3 leading-relaxed">
          Isi halaman ini adalah edukasi latihan untuk orang sehat, bukan terapi untuk cedera maupun nyeri yang
          sedang berlangsung.
        </p>
      </Card>
    </div>
  )
}

function DoseCalculator() {
  const [hold, setHold] = useState('30')
  const [reps, setReps] = useState('2')
  const [sesi, setSessions] = useState('3')

  const hasil = useMemo(
    () => stretchDose(Number(hold), Number(reps), Number(sesi)),
    [hold, reps, sesi],
  )

  const pct = hasil ? Math.min(100, (hasil.perMingguDetik / WEEKLY_TARGET_SEC) * 100) : 0

  return (
    <Card>
      <SectionTitle
        icon={<IconTimer />}
        title="Is your stretching dose enough"
        subtitle="What decides the result is total time per muscle per week, not how deep you pull"
      />

      <div className="grid grid-cols-3 gap-3 mt-3">
        <Field label="Tahan (detik)">
          <input className={inputClass} value={hold} onChange={(e) => setHold(e.target.value)} inputMode="numeric" />
        </Field>
        <Field label="Ulangan">
          <input className={inputClass} value={reps} onChange={(e) => setReps(e.target.value)} inputMode="numeric" />
        </Field>
        <Field label="Sessions/minggu">
          <input className={inputClass} value={sesi} onChange={(e) => setSessions(e.target.value)} inputMode="numeric" />
        </Field>
      </div>

      {hasil == null ? (
        <p className="text-sm text-slate-500 mt-3">Isi ketiga kolom dengan angka lebih dari nol.</p>
      ) : (
        <div className="mt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm text-neutral-500">Per otot per minggu</span>
            <span className={`text-lg font-semibold ${hasil.cukup ? 'text-emerald-300' : 'text-amber-300'}`}>
              {fmtDur(hasil.perMingguDetik)}
            </span>
          </div>

          <div className="h-2 rounded-full bg-white/10 overflow-hidden mt-2">
            <div
              className={`h-full rounded-full transition-all ${hasil.cukup ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>{fmtDur(hasil.perSessionsDetik)} per sesi</span>
            <span>ambang {fmtDur(WEEKLY_TARGET_SEC)}</span>
          </div>

          <p className={`text-sm mt-3 leading-relaxed ${hasil.cukup ? 'text-emerald-200/90' : 'text-amber-100/90'}`}>
            {hasil.saran}
          </p>
        </div>
      )}
    </Card>
  )
}

export default BaseTraining

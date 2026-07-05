import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { Card } from '../components/ui'
import { HealthSnapshot } from '../components/HealthSnapshot'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'

const PROGRAM_OPTIONS = ['—', 'SIPSS / Kedinasan', 'HYROX', 'Marathon (42K)', 'Half Marathon (21K)', 'Shape: Beginner', 'Shape: Intermediate', 'Shape: Advanced', 'Shape: Pro', 'Custom']
const RPE_COLOR = (v: number) => (v >= 8 ? '#EF4444' : v >= 5 ? '#F59E0B' : '#00BF63')

// Log — consolidated data-visualization dashboard: Training Intensity (RPE) trend
// over 30 days (recharts), a training calendar, communities, high-affinity person,
// circles, current program, challenges, and the wall of gratitude.
export function Logs() {
  const { state, account, addTrainingLog, setActiveProgram } = useStore()
  const [rpe, setRpe] = useState(6)
  const [type, setType] = useState('Lari')
  const [note, setNote] = useState('')

  if (!account) return null
  const me = account.name
  const today = new Date()

  // ── RPE trend: last 30 days ──
  const chartData = useMemo(() => {
    const byDate = new Map<string, number>()
    for (const l of state.trainingLogs) byDate.set(l.date, Math.max(byDate.get(l.date) ?? 0, l.rpe))
    const out: { day: string; date: string; rpe: number | null }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      out.push({ day: `${d.getDate()}/${d.getMonth() + 1}`, date: key, rpe: byDate.has(key) ? byDate.get(key)! : null })
    }
    return out
  }, [state.trainingLogs])
  const logged = chartData.filter((d) => d.rpe != null)
  const avgRpe = logged.length ? (logged.reduce((s, d) => s + (d.rpe as number), 0) / logged.length).toFixed(1) : '—'

  // ── Calendar (current month) — mark days with training / check-in / GPS ──
  const activeDays = useMemo(() => {
    const s = new Set<string>()
    state.trainingLogs.forEach((l) => s.add(l.date))
    state.checkIns.filter((c) => c.email === account.email).forEach((c) => s.add(c.date))
    state.gpsActivities.forEach((a) => s.add(a.at.slice(0, 10)))
    return s
  }, [state.trainingLogs, state.checkIns, state.gpsActivities, account.email])
  const year = today.getFullYear(), month = today.getMonth()
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // ── Affinity (special person) ──
  const myCheckInDates = state.checkIns.filter((c) => c.email === account.email).map((c) => c.date)
  const streak = useMemo(() => {
    let s = 0, d = new Date()
    if (!myCheckInDates.includes(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1)
    while (myCheckInDates.includes(d.toISOString().slice(0, 10))) { s++; d.setDate(d.getDate() - 1) }
    return s
  }, [state.checkIns])
  const sharedCommunities = state.communities.filter((c) => c.memberNames.includes(me) && state.buddyName && c.memberNames.includes(state.buddyName))
  const affinity = state.buddyName ? Math.min(100, streak * 8 + sharedCommunities.length * 15) : 0

  const myCommunities = state.communities.filter((c) => c.memberNames.includes(me))

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-2xl">📊</span>
        <div>
          <h1 className="text-lg font-black text-ink">Log & Statistik</h1>
          <p className="text-xs text-neutral-400">Intensitas latihan, komunitas, relasi & tantangan Anda</p>
        </div>
      </div>

      <HealthSnapshot />

      {/* RPE trend (recharts) */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black text-ink">📈 Intensitas Latihan (RPE) — 30 hari</div>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500">rata² {avgRpe}</span>
        </div>
        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2ef" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#9aa5a0' }} interval={5} />
              <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 9, fill: '#9aa5a0' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #eee' }} formatter={(v) => [`RPE ${v}`, 'Intensitas']} />
              <ReferenceLine y={8} stroke="#EF4444" strokeDasharray="4 4" strokeOpacity={0.5} />
              <Line type="monotone" dataKey="rpe" stroke="#00BF63" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {logged.length === 0 && <p className="text-center text-[11px] text-neutral-400">Belum ada catatan. Catat intensitas di bawah.</p>}
        {/* RPE logger */}
        <div className="space-y-2 border-t border-neutral-100 pt-3">
          <div className="flex items-center gap-2">
            <input value={type} onChange={(e) => setType(e.target.value)} placeholder="Jenis (Lari, Gym, HIIT…)" className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-xs outline-none focus:border-brand" />
            <span className="rounded-lg px-2.5 py-1.5 text-sm font-black text-white" style={{ background: RPE_COLOR(rpe) }}>RPE {rpe}</span>
          </div>
          <input type="range" min={1} max={10} value={rpe} onChange={(e) => setRpe(+e.target.value)} className="w-full accent-[#00BF63]" />
          <div className="flex justify-between text-[9px] text-neutral-400"><span>1 Ringan</span><span>5 Sedang</span><span>10 Maksimal</span></div>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan (opsional)" className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs outline-none focus:border-brand" />
          <button onClick={() => { addTrainingLog(rpe, type, note); setNote('') }} className="w-full rounded-xl py-2.5 text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>Catat Intensitas Hari Ini</button>
        </div>
      </Card>

      {/* Calendar */}
      <Card className="space-y-2">
        <div className="text-xs font-black text-ink">📅 Kalender Latihan — {today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</div>
        <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-neutral-400">
          {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const active = activeDays.has(key)
            const isToday = day === today.getDate()
            return (
              <div key={day} className={`grid aspect-square place-items-center rounded-lg text-[11px] font-semibold ${active ? 'bg-brand text-white' : 'bg-neutral-50 text-neutral-400'} ${isToday ? 'ring-2 ring-brand-dark' : ''}`}>{day}</div>
            )
          })}
        </div>
        <p className="text-[10px] text-neutral-400">Hijau = ada latihan / check-in / aktivitas GPS hari itu.</p>
      </Card>

      {/* Current program */}
      <Card className="space-y-2">
        <div className="text-xs font-black text-ink">🎯 Program Latihan Saat Ini</div>
        <select value={state.activeProgram ?? '—'} onChange={(e) => setActiveProgram(e.target.value)} className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand">
          {PROGRAM_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {state.activeProgram && state.activeProgram !== '—' && <p className="text-[11px] text-brand-dark">Sedang menjalani: <b>{state.activeProgram}</b></p>}
      </Card>

      {/* Communities */}
      <Card className="space-y-2">
        <div className="text-xs font-black text-ink">🏃 Komunitas yang Diikuti ({myCommunities.length})</div>
        {myCommunities.length === 0 ? <p className="text-[11px] text-neutral-400">Belum bergabung komunitas. Buka Community untuk gabung.</p> : (
          <div className="space-y-1.5">
            {myCommunities.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 text-[11px]">
                <span><b className="text-ink">{c.name}</b> · <span className="text-brand-dark">{c.sportTag}</span></span>
                <span className="text-neutral-400">{c.memberNames.length} anggota</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Special person (affinity) */}
      <Card className="space-y-2">
        <div className="text-xs font-black text-ink">💞 Relasi Terdekat</div>
        {state.buddyName ? (
          <div className="rounded-xl bg-pink-50 p-3 text-pink-700">
            <div className="text-sm font-bold">🤝 {state.buddyName}</div>
            <div className="mt-1 text-[11px]">Skor afinitas <b>{affinity}/100</b> · streak {streak} hari · {sharedCommunities.length} komunitas bersama</div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/60"><div className="h-full rounded-full bg-pink-500" style={{ width: `${affinity}%` }} /></div>
          </div>
        ) : <p className="text-[11px] text-neutral-400">Belum ada Health Buddy. Tetapkan di Community untuk melacak afinitas.</p>}
      </Card>

      {/* Circles */}
      <Card className="space-y-2">
        <div className="text-xs font-black text-ink">🫂 Circle of Care ({state.circles.length})</div>
        {state.circles.length === 0 ? <p className="text-[11px] text-neutral-400">Belum ada circle.</p> : state.circles.map((c) => (
          <div key={c.id} className="rounded-xl bg-neutral-50 px-3 py-2 text-[11px] text-neutral-600"><b className="text-ink">{c.name}</b> — {c.memberNames.join(', ') || 'belum ada anggota'}</div>
        ))}
      </Card>

      {/* Challenges */}
      <Card className="space-y-2">
        <div className="text-xs font-black text-ink">🏆 Tantangan Saya ({state.challenges.length})</div>
        {state.challenges.length === 0 ? <p className="text-[11px] text-neutral-400">Belum ada tantangan aktif.</p> : state.challenges.map((c) => {
          const me2 = c.participants.find((p) => p.email === account.email)
          const top = [...c.participants].sort((a, b) => b.progress - a.progress)[0]
          return (
            <div key={c.id} className="rounded-xl bg-neutral-50 px-3 py-2 text-[11px]">
              <b className="text-ink">{c.title}</b>
              <div className="text-neutral-500">Progres Anda: {me2?.progress ?? 0} {c.unit} · pemuncak: {top?.name ?? '—'} ({top?.progress ?? 0})</div>
            </div>
          )
        })}
      </Card>

      {/* Wall of gratitude */}
      <Card className="space-y-2">
        <div className="text-xs font-black text-ink">🙏 Dinding Terima Kasih ({state.gratitudes.length})</div>
        {state.gratitudes.length === 0 ? <p className="text-[11px] text-neutral-400">Belum ada ucapan.</p> : state.gratitudes.slice(0, 8).map((g) => (
          <div key={g.id} className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-neutral-700"><b>{g.fromName}</b> → <b>{g.toName}</b>: "{g.text}"</div>
        ))}
      </Card>
    </div>
  )
}

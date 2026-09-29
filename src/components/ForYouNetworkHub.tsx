import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'

type NetworkIntent = 'friends' | 'training' | 'dating' | 'mentor' | 'collaborate'
type WorkMode = 'any' | 'remote' | 'hybrid' | 'onsite'

interface WorkTask {
  id: string
  title: string
  dueAt?: string
  done: boolean
  createdAt: string
}

const TASK_KEY = 'pmd_for_you_workboard_v1'

const INTENTS: Array<{ id: NetworkIntent; label: string; copy: string }> = [
  { id: 'friends', label: 'Friends', copy: 'Meet people with overlapping interests and activity.' },
  { id: 'training', label: 'Training partner', copy: 'Find someone to train, run, lift or play with.' },
  { id: 'dating', label: 'Relationship', copy: 'Open Panacea Connect for explicit mutual relationship intent.' },
  { id: 'mentor', label: 'Mentor', copy: 'Find people whose work or experience you want to learn from.' },
  { id: 'collaborate', label: 'Collaborator', copy: 'Meet people for research, startups, projects and professional work.' },
]

function safeTasks(): WorkTask[] {
  try {
    const raw = localStorage.getItem(TASK_KEY)
    const value = raw ? JSON.parse(raw) : []
    if (!Array.isArray(value)) return []
    return value
      .filter((item) => item && typeof item.id === 'string' && typeof item.title === 'string')
      .map((item) => ({
        id: item.id,
        title: item.title,
        dueAt: typeof item.dueAt === 'string' ? item.dueAt : undefined,
        done: item.done === true,
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
      }))
  } catch {
    return []
  }
}

function saveTasks(tasks: readonly WorkTask[]) {
  try { localStorage.setItem(TASK_KEY, JSON.stringify(tasks.slice(0, 100))) } catch { /* local quota */ }
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase() || 'U'
}

function tokens(value: string) {
  return value.toLowerCase().split(/[^a-z0-9+#.-]+/).map((x) => x.trim()).filter((x) => x.length >= 2)
}

function timeLabel(iso?: string) {
  if (!iso) return 'No deadline'
  const at = new Date(iso).getTime()
  if (!Number.isFinite(at)) return 'No deadline'
  const diff = at - Date.now()
  const hours = Math.round(Math.abs(diff) / 3_600_000)
  if (diff < 0) return hours < 24 ? `Overdue · ${hours}h` : `Overdue · ${Math.ceil(hours / 24)}d`
  if (hours < 1) return 'Due within 1h'
  if (hours < 24) return `Due in ${hours}h`
  return `Due in ${Math.ceil(hours / 24)}d`
}

function linkedinJobsUrl(query: string, location: string, mode: WorkMode) {
  const params = new URLSearchParams()
  if (query.trim()) params.set('keywords', query.trim())
  if (location.trim()) params.set('location', location.trim())
  if (mode === 'remote') params.set('f_WT', '2')
  if (mode === 'hybrid') params.set('f_WT', '3')
  if (mode === 'onsite') params.set('f_WT', '1')
  return `https://www.linkedin.com/jobs/search/?${params.toString()}`
}

export function ForYouNetworkHub() {
  const { state, account } = useStore()
  const [intent, setIntent] = useState<NetworkIntent>('friends')
  const [tasks, setTasks] = useState<WorkTask[]>([])
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDueAt, setTaskDueAt] = useState('')
  const [nowTick, setNowTick] = useState(0)
  const [jobQuery, setJobQuery] = useState('')
  const [jobLocation, setJobLocation] = useState('')
  const [workMode, setWorkMode] = useState<WorkMode>('any')

  useEffect(() => {
    setTasks(safeTasks())
    const timer = window.setInterval(() => setNowTick((x) => x + 1), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const posts = useMemo(
    () => [...state.posts]
      .filter((post) => !post.archived && !post.locked)
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at)),
    [state.posts],
  )

  const myActivities = useMemo(() => new Set(
    posts
      .filter((post) => post.authorEmail === account?.email)
      .map((post) => (post.activity ?? '').trim().toLowerCase())
      .filter(Boolean),
  ), [posts, account?.email])

  const people = useMemo(() => {
    const map = new Map<string, {
      email: string
      name: string
      activities: Set<string>
      posts: number
      lastAt: string
      avatar?: string
    }>()

    for (const post of posts) {
      if (!post.authorEmail || post.authorEmail === account?.email) continue
      const previous = map.get(post.authorEmail)
      const activity = (post.activity ?? '').trim()
      if (previous) {
        previous.posts += 1
        if (activity) previous.activities.add(activity)
        if (Date.parse(post.at) > Date.parse(previous.lastAt)) previous.lastAt = post.at
      } else {
        map.set(post.authorEmail, {
          email: post.authorEmail,
          name: post.authorName,
          activities: new Set(activity ? [activity] : []),
          posts: 1,
          lastAt: post.at,
          avatar: state.profiles[post.authorEmail]?.avatar,
        })
      }
    }

    return [...map.values()]
      .map((person) => {
        const shared = [...person.activities].filter((value) => myActivities.has(value.toLowerCase()))
        const recencyDays = Math.max(0, (Date.now() - Date.parse(person.lastAt)) / 86_400_000)
        const recency = Math.max(0, 1 - recencyDays / 30)
        const commonality = Math.min(1, shared.length / 2)
        const contribution = Math.min(1, person.posts / 5)
        // Public social commonality only. This is not a romantic compatibility,
        // attractiveness, health-status, or sensitive-trait score.
        const score = 0.55 * commonality + 0.30 * recency + 0.15 * contribution
        return { ...person, shared, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
  }, [posts, account?.email, myActivities, state.profiles])

  const opportunities = useMemo(() => {
    const markers = [
      'hiring', 'job', 'jobs', 'vacancy', 'lowongan', 'internship', 'intern',
      'research assistant', 'researcher', 'cofounder', 'co-founder', 'collaborator',
      'collaboration', 'freelance', 'position', 'role', 'opening',
    ]
    const queryTokens = tokens(jobQuery)
    return posts
      .filter((post) => {
        const body = `${post.caption ?? ''} ${post.articleTitle ?? ''} ${post.activity ?? ''}`.toLowerCase()
        return markers.some((marker) => body.includes(marker))
      })
      .map((post) => {
        const body = `${post.caption ?? ''} ${post.articleTitle ?? ''} ${post.activity ?? ''}`
        const bodyTokens = new Set(tokens(body))
        const queryMatch = queryTokens.length
          ? queryTokens.filter((token) => bodyTokens.has(token)).length / queryTokens.length
          : 0.5
        const ageDays = Math.max(0, (Date.now() - Date.parse(post.at)) / 86_400_000)
        const freshness = Math.max(0, 1 - ageDays / 45)
        return { post, score: 0.65 * queryMatch + 0.35 * freshness }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
  }, [posts, jobQuery])

  const pendingTasks = useMemo(
    () => [...tasks]
      .filter((task) => !task.done)
      .sort((a, b) => {
        if (!a.dueAt && !b.dueAt) return Date.parse(b.createdAt) - Date.parse(a.createdAt)
        if (!a.dueAt) return 1
        if (!b.dueAt) return -1
        return Date.parse(a.dueAt) - Date.parse(b.dueAt)
      }),
    [tasks, nowTick],
  )

  const addTask = () => {
    const title = taskTitle.trim()
    if (!title) return
    const next: WorkTask[] = [{
      id: Math.random().toString(36).slice(2),
      title,
      dueAt: taskDueAt ? new Date(taskDueAt).toISOString() : undefined,
      done: false,
      createdAt: new Date().toISOString(),
    }, ...tasks]
    setTasks(next)
    saveTasks(next)
    setTaskTitle('')
    setTaskDueAt('')
  }

  const toggleTask = (id: string) => {
    const next = tasks.map((task) => task.id === id ? { ...task, done: !task.done } : task)
    setTasks(next)
    saveTasks(next)
  }

  return (
    <section className="border-t border-white/10 pt-6" aria-label="People groups work and opportunities">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.16em] text-white/34">Network OS</div>
          <h2 className="mt-1 text-xl font-black tracking-[-.03em] text-white">People → groups → action → opportunity</h2>
          <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-white/42">
            Meet with explicit intent, move into a squad or discussion, coordinate what needs to happen, then surface relevant work and collaboration.
          </p>
        </div>
        <Link to="/connect" className="rounded-full border border-white/12 px-4 py-2 text-[10px] font-black text-white/70 hover:text-white">
          Full Connect ↗
        </Link>
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Connection intent">
        {INTENTS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIntent(item.id)}
            title={item.copy}
            className={`min-h-[38px] shrink-0 rounded-full border px-3 text-[10px] font-black transition ${
              intent === item.id ? 'border-white bg-white text-black' : 'border-white/10 text-white/52 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="min-w-0 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[.14em] text-white/32">Discover people</div>
              <div className="mt-1 text-sm font-black text-white/82">{INTENTS.find((x) => x.id === intent)?.copy}</div>
            </div>
            {intent === 'dating' && <Link to="/connect" className="text-[10px] font-black text-cyan-200/70">Mutual matching ↗</Link>}
          </div>

          <div className="mt-3 grid gap-2">
            {people.length ? people.map((person) => (
              <div key={person.email} className="flex items-center gap-3 border-b border-white/[.07] py-3 last:border-b-0">
                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-white/[.04] text-[10px] font-black text-white/72">
                  {person.avatar ? <img src={person.avatar} alt="" className="h-full w-full object-cover" /> : initials(person.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-black text-white/82">{person.name}</div>
                  <div className="mt-0.5 truncate text-[9px] text-white/36">
                    {person.shared.length
                      ? `Shared: ${person.shared.slice(0, 2).join(', ')}`
                      : `${person.posts} public contribution${person.posts === 1 ? '' : 's'} · recent community activity`}
                  </div>
                </div>
                <Link
                  to={`/messages?peer=${encodeURIComponent(person.name)}`}
                  className="shrink-0 rounded-full border border-white/12 px-3 py-2 text-[9px] font-black text-white/62 hover:text-white"
                >
                  Message
                </Link>
              </div>
            )) : (
              <div className="py-5 text-[11px] leading-relaxed text-white/38">
                No public people signals yet. Post an activity or join a community to create real common ground instead of synthetic matches.
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <Link to="/?t=community" className="grid min-h-[46px] place-items-center rounded-xl border border-white/10 text-[10px] font-black text-white/58">Community</Link>
            <Link to="/clubs" className="grid min-h-[46px] place-items-center rounded-xl border border-white/10 text-[10px] font-black text-white/58">Squads / Clubs</Link>
            <Link to="/feed" className="grid min-h-[46px] place-items-center rounded-xl border border-white/10 text-[10px] font-black text-white/58">Discussions</Link>
          </div>
        </div>

        <div className="min-w-0 border-t border-white/10 pt-4">
          <div className="text-[9px] font-black uppercase tracking-[.14em] text-white/32">Workboard</div>
          <div className="mt-1 text-sm font-black text-white/82">Slack-like tasks, without another page</div>

          <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px_72px]">
            <input
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && addTask()}
              placeholder="What needs to be done?"
              className="min-h-[42px] border-b border-white/15 bg-transparent px-1 text-xs font-semibold text-white outline-none placeholder:text-white/28"
            />
            <input
              type="datetime-local"
              value={taskDueAt}
              onChange={(event) => setTaskDueAt(event.target.value)}
              aria-label="Reminder date and time"
              className="min-h-[42px] border-b border-white/15 bg-transparent px-1 text-[10px] font-semibold text-white/70 outline-none"
            />
            <button type="button" onClick={addTask} disabled={!taskTitle.trim()} className="min-h-[42px] rounded-full bg-white text-[10px] font-black text-black disabled:opacity-35">
              Add
            </button>
          </div>

          <div className="mt-3">
            {pendingTasks.length ? pendingTasks.slice(0, 5).map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => toggleTask(task.id)}
                className="flex w-full items-center gap-3 border-b border-white/[.07] py-3 text-left last:border-b-0"
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-white/18 text-[9px] text-white/45">✓</span>
                <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-white/70">{task.title}</span>
                <span className={`shrink-0 text-[9px] font-black ${task.dueAt && Date.parse(task.dueAt) < Date.now() ? 'text-rose-300' : 'text-white/32'}`}>
                  {timeLabel(task.dueAt)}
                </span>
              </button>
            )) : (
              <div className="py-5 text-[11px] text-white/35">No open tasks. Add the next action and Panacea keeps it visible here until completed.</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-white/10 pt-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.75fr)]">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.14em] text-white/32">For You · opportunities</div>
            <div className="mt-1 text-sm font-black text-white/82">Jobs, research, startup and collaboration signals</div>
            <div className="mt-3 grid gap-2">
              {opportunities.length ? opportunities.map(({ post }) => (
                <Link key={post.id} to="/feed" className="block border-b border-white/[.07] py-3 last:border-b-0">
                  <div className="text-[10px] font-black text-white/48">{post.authorName} · {post.activity || 'Opportunity'}</div>
                  <div className="mt-1 line-clamp-2 text-[12px] font-semibold leading-relaxed text-white/70">
                    {post.articleTitle || post.caption || 'Open community opportunity'}
                  </div>
                </Link>
              )) : (
                <div className="py-4 text-[11px] leading-relaxed text-white/36">
                  No community opportunity posts match yet. Panacea will surface real posts here when members publish hiring, research, internship, cofounder or collaboration signals.
                </div>
              )}
            </div>
            <Link to="/feed" className="mt-2 inline-flex min-h-[40px] items-center text-[10px] font-black text-cyan-200/65">Post or browse community opportunities ↗</Link>
          </div>

          <div className="border-l-0 border-white/10 lg:border-l lg:pl-4">
            <div className="text-[9px] font-black uppercase tracking-[.14em] text-white/32">External job search</div>
            <div className="mt-3 grid gap-2">
              <input value={jobQuery} onChange={(event) => setJobQuery(event.target.value)} placeholder="Role or skill: medical AI, doctor, research…" className="min-h-[42px] border-b border-white/15 bg-transparent px-1 text-xs font-semibold text-white outline-none placeholder:text-white/28" />
              <input value={jobLocation} onChange={(event) => setJobLocation(event.target.value)} placeholder="Location" className="min-h-[42px] border-b border-white/15 bg-transparent px-1 text-xs font-semibold text-white outline-none placeholder:text-white/28" />
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {(['any', 'remote', 'hybrid', 'onsite'] as WorkMode[]).map((mode) => (
                  <button key={mode} type="button" onClick={() => setWorkMode(mode)} className={`min-h-[34px] shrink-0 rounded-full border px-3 text-[9px] font-black capitalize ${workMode === mode ? 'border-white bg-white text-black' : 'border-white/10 text-white/45'}`}>
                    {mode}
                  </button>
                ))}
              </div>
              <a
                href={linkedinJobsUrl(jobQuery, jobLocation, workMode)}
                target="_blank"
                rel="noreferrer"
                className="mt-1 grid min-h-[44px] place-items-center rounded-full border border-white/12 text-[10px] font-black text-white/68 hover:text-white"
              >
                Search LinkedIn Jobs ↗
              </a>
              <p className="text-[9px] leading-relaxed text-white/28">
                Panacea passes only the role/location/work-mode query you enter here. External listings remain LinkedIn's data, not Panacea claims.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ForYouNetworkHub

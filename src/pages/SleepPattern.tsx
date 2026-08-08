import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, SectionTitle } from '../components/ui'
import { IconHeart, IconActivity, IconTimer } from '../components/icons'
import { api, backendEnabled, type SleepNight } from '../lib/api'

// ─────────────────────────────────────────────────────────────────────────────
// Sleep Pattern — per tahapan, per malam.
//
// Total jam tidur adalah angka yang paling sering dilihat dan paling sedikit
// artinya. Tujuh jam yang terpecah-pecah dengan tidur dalam nyaris nol tidak
// sama dengan tujuh jam yang utuh, dan hanya rincian tahapan yang bisa
// membedakannya. Bagi orang yang jadwal jaganya berantakan, yang paling
// menentukan justru KETERATURAN JAM — dan itu pun tidak terlihat dari total.
// ─────────────────────────────────────────────────────────────────────────────

const WARNA = {
  deep: '#4f46e5',
  rem: '#0ea5e9',
  core: '#34d399',
  awake: '#f59e0b',
}

interface Ringkas {
  malam: number
  reratatotal: number
  rerataDeep?: number
  rerataRem?: number
  /** Simpangan baku jam mulai tidur, dalam menit — ukuran keteraturan. */
  keteraturanMenit?: number
  rerataJamTidur?: number
  rerataJamBangun?: number
}

function jamDesimal(iso?: string): number | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.getHours() + d.getMinutes() / 60
}

/** Jam tidur melewati tengah malam, jadi 23.5 dan 0.5 harus dihitung berdekatan. */
function rerataJamMelingkar(jam: number[]): number | null {
  if (!jam.length) return null
  const sin = jam.reduce((a, h) => a + Math.sin((h / 24) * 2 * Math.PI), 0) / jam.length
  const cos = jam.reduce((a, h) => a + Math.cos((h / 24) * 2 * Math.PI), 0) / jam.length
  let sudut = Math.atan2(sin, cos)
  if (sudut < 0) sudut += 2 * Math.PI
  return (sudut / (2 * Math.PI)) * 24
}

function simpanganMelingkarMenit(jam: number[]): number | null {
  if (jam.length < 2) return null
  const sin = jam.reduce((a, h) => a + Math.sin((h / 24) * 2 * Math.PI), 0) / jam.length
  const cos = jam.reduce((a, h) => a + Math.cos((h / 24) * 2 * Math.PI), 0) / jam.length
  const R = Math.sqrt(sin * sin + cos * cos)
  if (R >= 1) return 0
  const sd = Math.sqrt(-2 * Math.log(R)) // radian
  return Math.round((sd / (2 * Math.PI)) * 24 * 60)
}

function fmtJam(h: number | null): string {
  if (h == null) return '—'
  const jam = Math.floor(h) % 24
  const menit = Math.round((h - Math.floor(h)) * 60)
  return `${String(jam).padStart(2, '0')}.${String(menit).padStart(2, '0')}`
}

function fmtDurasi(h?: number): string {
  if (h == null || !Number.isFinite(h)) return '—'
  // Round to whole minutes FIRST, then split. Splitting first and rounding the
  // remainder printed "5 j 60 m" for 5.996 hours.
  const totalMenit = Math.round(h * 60)
  const jam = Math.floor(totalMenit / 60)
  const menit = totalMenit % 60
  return menit === 0 ? `${jam} j` : `${jam} j ${menit} m`
}

export function SleepPattern() {
  const [nights, setNights] = useState<SleepNight[]>([])
  const [memuat, setMemuat] = useState(true)
  const [gagal, setGagal] = useState(false)

  const load = useCallback(() => {
    setMemuat(true)
    api.sleepSeries()
      .then((r) => { setNights(r); setGagal(false) })
      .catch(() => setGagal(true))
      .finally(() => setMemuat(false))
  }, [])

  useEffect(() => {
    if (!backendEnabled) { setMemuat(false); return }
    load()
  }, [load])

  const urut = useMemo(
    () => [...nights].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30),
    [nights],
  )

  const ringkas: Ringkas | null = useMemo(() => {
    if (!urut.length) return null
    const totals = urut.map((n) => n.totalH).filter((v): v is number => v != null)
    const deeps = urut.map((n) => n.deepH).filter((v): v is number => v != null)
    const rems = urut.map((n) => n.remH).filter((v): v is number => v != null)
    const mulai = urut.map((n) => jamDesimal(n.start)).filter((v): v is number => v != null)
    const bangun = urut.map((n) => jamDesimal(n.end)).filter((v): v is number => v != null)
    return {
      malam: urut.length,
      reratatotal: totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0,
      rerataDeep: deeps.length ? deeps.reduce((a, b) => a + b, 0) / deeps.length : undefined,
      rerataRem: rems.length ? rems.reduce((a, b) => a + b, 0) / rems.length : undefined,
      keteraturanMenit: simpanganMelingkarMenit(mulai) ?? undefined,
      rerataJamTidur: rerataJamMelingkar(mulai) ?? undefined,
      rerataJamBangun: rerataJamMelingkar(bangun) ?? undefined,
    }
  }, [urut])

  if (!backendEnabled) {
    return (
      <div className="space-y-4">
        <SectionTitle icon={<IconTimer />} title="Sleep Pattern" />
        <Card>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Rincian tidur per tahapan diisi server melalui sinkronisasi otomatis, dan saat ini aplikasi
            berjalan tanpa server.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <SectionTitle
        icon={<IconTimer />}
        title="Sleep Pattern"
        subtitle="By stage and by night, from Apple Watch via automatic sync"
      />

      <Card>
        <p className="text-sm text-neutral-600 leading-relaxed">
          Total jam tidur adalah angka yang paling sering dilihat dan paling sedikit artinya.
          <strong className="text-ink"> Tujuh jam yang terpecah-pecah dengan tidur dalam nyaris nol tidak
          sama dengan tujuh jam yang utuh</strong> — dan hanya rincian tahapan yang bisa membedakannya.
        </p>
        <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
          Bagi orang yang jadwal jaganya berantakan, yang paling menentukan justru bukan lamanya melainkan
          <strong className="text-ink"> keteraturan jamnya</strong>. Jam tidur yang berpindah-pindah tiap
          malam memberi tubuh sinyal waktu yang saling bertentangan, dan itu memberi rasa lelah yang tidak
          hilang meskipun jumlah jamnya cukup.
        </p>
      </Card>

      {gagal ? (
        <Card>
          <p className="text-sm text-neutral-500">Tidak bisa memuat data tidur.</p>
          <button onClick={load} className="mt-3 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white">Coba lagi</button>
        </Card>
      ) : memuat ? (
        <Card><p className="text-sm text-slate-500">Loading…</p></Card>
      ) : !urut.length ? (
        <Card>
          <p className="text-sm text-neutral-600 leading-relaxed">Belum ada malam yang tercatat.</p>
          <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
            Pastikan <strong className="text-ink">Sleep Analysis</strong> ikut dicentang di Health Auto Export,
            dan Anda memakai jam tangan saat tidur. Rincian tahapan hanya ada bila jam tangan dipakai
            sepanjang malam — bila hanya iPhone yang di dekat tempat tidur, yang terekam paling jauh adalah
            waktu di tempat tidur, tanpa tahapan.
          </p>
          <Link to="/health-data" className="mt-3 inline-block rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white">
            Buka pengaturan sinkronisasi →
          </Link>
        </Card>
      ) : (
        <>
          <Card>
            <SectionTitle icon={<IconActivity />} title="Summary" subtitle={`${ringkas!.malam} malam terakhir`} />
            <div className="grid grid-cols-2 gap-2 mt-2 sm:grid-cols-4">
              <Stat label="Rata-rata tidur" value={fmtDurasi(ringkas!.reratatotal)} />
              <Stat label="Tidur dalam" value={fmtDurasi(ringkas!.rerataDeep)} />
              <Stat label="REM" value={fmtDurasi(ringkas!.rerataRem)} />
              <Stat
                label="Keteraturan"
                value={ringkas!.keteraturanMenit != null ? `±${ringkas!.keteraturanMenit} m` : '—'}
              />
            </div>

            {ringkas!.rerataJamTidur != null && (
              <p className="mt-3 text-sm text-neutral-500 leading-relaxed">
                Rata-rata Anda mulai tidur sekitar pukul <strong className="text-ink">{fmtJam(ringkas!.rerataJamTidur)}</strong>
                {ringkas!.rerataJamBangun != null && <> dan bangun sekitar <strong className="text-ink">{fmtJam(ringkas!.rerataJamBangun)}</strong></>}.
                {' '}Dihitung melingkar, sehingga jam sebelum dan sesudah tengah malam tidak dirata-ratakan menjadi siang hari.
              </p>
            )}

            {ringkas!.keteraturanMenit != null && (
              <p className={`mt-2 text-sm leading-relaxed ${ringkas!.keteraturanMenit <= 45 ? 'text-emerald-200/90' : 'text-amber-100/90'}`}>
                {ringkas!.keteraturanMenit <= 45
                  ? `Jam mulai tidur Anda cukup teratur (bergeser sekitar ${ringkas!.keteraturanMenit} menit dari malam ke malam). Ini bagian yang paling menentukan dan Anda sudah memilikinya.`
                  : `Jam mulai tidur Anda bergeser sekitar ${ringkas!.keteraturanMenit} menit dari malam ke malam. Pergeseran sebesar ini memberi tubuh sinyal waktu yang berubah-ubah. Bila jadwal jaga membuat jam tidur mustahil disamakan, yang paling terbantu adalah menetapkan JAM BANGUN dan mendapat cahaya terang segera sesudahnya — jam bangun jauh lebih mudah dikendalikan daripada jam tertidur.`}
              </p>
            )}
          </Card>

          <Card>
            <SectionTitle title="Per malam" subtitle="Bar length is proportional to time asleep" />
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
              {([['deep', 'Dalam'], ['rem', 'REM'], ['core', 'Inti'], ['awake', 'Terbangun']] as const).map(([k, l]) => (
                <span key={k} className="flex items-center gap-1.5 text-neutral-500">
                  <span className="h-2 w-2 rounded-full" style={{ background: WARNA[k] }} />{l}
                </span>
              ))}
            </div>

            <div className="mt-3 space-y-2.5">
              {urut.map((n) => {
                const stages = [
                  { k: 'deep' as const, v: n.deepH ?? 0 },
                  { k: 'rem' as const, v: n.remH ?? 0 },
                  { k: 'core' as const, v: n.coreH ?? 0 },
                  { k: 'awake' as const, v: n.awakeH ?? 0 },
                ]
                const jumlahStage = stages.reduce((a, s) => a + s.v, 0)
                // Skala terhadap 9 jam supaya panjang batang bisa dibandingkan
                // antarmalam, bukan dinormalkan penuh tiap baris.
                const skala = Math.min(100, ((n.totalH ?? jumlahStage) / 9) * 100)
                return (
                  <div key={n.date}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-ink">
                        {new Date(n.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <span className="text-xs text-neutral-500 tabular-nums">
                        {fmtDurasi(n.totalH)}
                        {n.start && n.end && (
                          <span className="text-slate-500"> · {fmtJam(jamDesimal(n.start))}–{fmtJam(jamDesimal(n.end))}</span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1 h-3 w-full rounded-full bg-white/5">
                      <div className="flex h-3 overflow-hidden rounded-full" style={{ width: `${skala}%` }}>
                        {jumlahStage > 0
                          ? stages.map((s) => s.v > 0 && (
                              <div key={s.k} style={{ width: `${(s.v / jumlahStage) * 100}%`, background: WARNA[s.k] }} title={`${s.k} ${fmtDurasi(s.v)}`} />
                            ))
                          : <div className="w-full bg-slate-600" title="stages not recorded" />}
                      </div>
                    </div>
                    {jumlahStage === 0 && (
                      <p className="mt-0.5 text-[10px] text-slate-500">Tahapan tidak terekam malam ini — kemungkinan jam tangan tidak dipakai.</p>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>

          <Card>
            <SectionTitle icon={<IconHeart />} title="Cara membacanya" />
            <div className="mt-2 space-y-2.5">
              {[
                ['Tidur dalam', 'Paling banyak muncul pada sepertiga awal malam, dan inilah tahap yang paling berkaitan dengan pemulihan fisik serta pelepasan hormon pertumbuhan. Tidur yang dimulai jauh lebih larut memangkas bagian ini lebih dahulu — itulah sebabnya begadang terasa jauh lebih merusak daripada sekadar tidur lebih pendek.'],
                ['REM', 'Terkonsentrasi pada sepertiga akhir malam dan berkaitan dengan daya ingat serta pengolahan emosi. Bangun lebih awal dari biasanya memotong REM lebih dahulu, sehingga terasa sebagai suasana hati yang buruk meskipun jumlah jamnya cukup.'],
                ['Terbangun', 'Terbangun singkat beberapa kali semalam adalah hal yang normal dan dialami semua orang. Yang perlu diperhatikan adalah bila jumlahnya banyak dan disertai rasa mengantuk berat di siang hari.'],
                ['Batas alat ini', 'Tahapan tidur dari jam tangan merupakan PERKIRAAN dari gerakan dan denyut jantung, bukan hasil rekaman gelombang otak. Ia cukup baik untuk melihat kecenderungan diri sendiri, dan tidak dapat dipakai untuk menegakkan diagnosis gangguan tidur. Mendengkur keras dengan henti napas yang disaksikan orang lain, maupun rasa mengantuk berat di siang hari, perlu diperiksakan langsung dan tidak akan terjawab oleh angka di halaman ini.'],
              ].map(([judul, isi]) => (
                <div key={judul} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <div className="text-sm font-semibold text-ink">{judul}</div>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-500">{isi}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-center">
      <div className="text-base font-semibold text-ink tabular-nums">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}

export default SleepPattern

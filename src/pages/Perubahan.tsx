import { useEffect, useMemo, useState } from 'react'
import { Prosa } from '../components/Prosa'
import { Link } from 'react-router-dom'
import { Card, SectionTitle, Button, Field, inputClass } from '../components/ui'
import { Ringkas, Poin } from '../components/Ringkas'
import { IconChartUp } from '../components/icons'
import { KolomAngka } from '../components/KolomAngka'
import {
  muat, simpan, ringkas, pekanBerjalan, tinjauanJatuhTempo, WILAYAH,
  type Keadaan, type Komitmen, type Wilayah,
} from '../lib/perubahan'

// ─────────────────────────────────────────────────────────────────────────────
// Change — halaman yang mengubah membaca menjadi berbuat.
//
// Bentuknya sengaja sebuah FORMULIR YANG MENUNTUT, bukan papan angka yang
// menyenangkan. Alasannya ada di lib/perubahan.ts, tetapi satu hal perlu
// diulang di sini karena menyangkut tampilan: halaman ini tidak memberi
// runtutan hari, lencana, atau perayaan. Semua itu memindahkan motivasi ke
// luar diri, dan yang paling merusak — runtutan yang putus mengubah satu hari
// terlewat menjadi kegagalan identitas.
//
// Yang diberikan sebagai gantinya adalah satu hal yang jarang diberikan
// aplikasi: KEMUNGKINAN UNTUK DIBERI TAHU BAHWA INI TIDAK BERJALAN.
// ─────────────────────────────────────────────────────────────────────────────

const KOSONG: Komitmen = {
  sasaran: '', wilayah: 'physical', ukuran: '', pembatal: '',
  kapan: '', dimana: '', minimum: '', rencanaPulih: '',
  mulaiPada: new Date().toISOString(), pekanTotal: 12,
}

export function Perubahan() {
  const [s, setS] = useState<Keadaan>(() => muat())
  const [draf, setDraf] = useState<Komitmen>(KOSONG)
  const [langkah, setLangkah] = useState(0)

  useEffect(() => { simpan(s) }, [s])

  const rk = useMemo(() => ringkas(s), [s])
  const jatuhTempo = useMemo(() => tinjauanJatuhTempo(s), [s])

  if (!s.komitmen) return <Susun draf={draf} setDraf={setDraf} langkah={langkah} setLangkah={setLangkah}
    onSelesai={() => setS((x) => ({ ...x, komitmen: { ...draf, mulaiPada: new Date().toISOString() }, tinjauan: [] }))} />

  const k = s.komitmen
  const pekan = pekanBerjalan(k)

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      <SectionTitle icon={<IconChartUp />} title="Change"
        subtitle={`Week ${Math.min(pekan, k.pekanTotal)} of ${k.pekanTotal}`} />

      <Card>
        <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Your one commitment</div>
        <p className="mt-1 text-[16px] font-black leading-snug text-ink">{k.sasaran}</p>
        <div className="mt-2 space-y-1.5">
          <Poin ikon="📏"><b>Measured by</b> — {k.ukuran}</Poin>
          <Poin ikon="🕒"><b>When</b> — {k.kapan}{k.dimana ? `, ${k.dimana}` : ''}</Poin>
          <Poin ikon="🔻"><b>Minimum version</b> — {k.minimum}</Poin>
        </div>
        {/* Pembatal ditaruh di depan, bukan disembunyikan. Ia satu-satunya
            bagian yang membuat tinjauan bisa menjawab "tidak". */}
        <div className="mt-3 rounded-xl border-l-2 border-amber-500/50 bg-amber-500/5 p-3">
          <div className="text-[10px] font-black uppercase tracking-wide text-amber-700">
            You said this would mean it failed
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-neutral-600">{k.pembatal}</p>
        </div>
      </Card>

      {rk && (
        <Card>
          <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Honest read</div>
          <p className="mt-1 text-[15px] font-black" style={{ color: warnaPutusan(rk.putusan) }}>
            {labelPutusan(rk.putusan)}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-neutral-600">{rk.alasan}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Angka label="Weeks reviewed" nilai={rk.ditinjau} />
            <Angka label="Avg days at minimum" nilai={rk.rerataHariMinimum} />
            <Angka label="Pekan yang bergerak" nilai={rk.pekanMaju} />
          </div>
        </Card>
      )}

      {jatuhTempo !== null
        ? <TinjauPekan pekan={jatuhTempo} onSimpan={(t) => setS((x) => ({ ...x, tinjauan: [...x.tinjauan, t] }))} />
        : (
          <Card>
            <Prosa kelas="text-[13px] leading-relaxed text-neutral-600">Belum ada tinjauan yang jatuh tempo. Tinjauan terbuka setelah satu pekan selesai — meninjau pekan yang masih berjalan mengukur suasana hati Anda, bukan pekannya.</Prosa>
          </Card>
        )}

      {s.tinjauan.length > 0 && (
        <Card>
          <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Weekly log</div>
          <div className="mt-2 space-y-1.5">
            {[...s.tinjauan].reverse().map((t) => (
              <div key={t.pekan} className="rounded-xl bg-white/60 p-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[12px] font-bold text-ink">Week {t.pekan}</span>
                  <span className="text-[11px] font-bold" style={{ color: warnaArah(t.arah) }}>
                    {t.arah === 'maju' ? 'moved' : t.arah === 'diam' ? 'flat' : 'went back'} · {t.hariMinimum}/7 days
                  </span>
                </div>
                {t.halangan && <p className="mt-0.5 text-[11px] leading-snug text-neutral-500">Blocked by: {t.halangan}</p>}
                {t.penyesuaian && <p className="text-[11px] leading-snug text-neutral-500">Changed: {t.penyesuaian}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Ringkas ikon="🚫" judul="Why there is no streak, badge, or celebration here"
        anak={
          <div className="space-y-1.5">
            <Poin ikon="🔗">Rangkaian yang putus mengubah satu hari terlewat menjadi vonis tentang diri Anda — dan justru itu yang membuat orang berhenti sama sekali alih-alih melanjutkan.</Poin>
            <Poin ikon="🎁">Lencana dan hadiah memindahkan dorongan dari dalam ke luar diri, dan dorongan dari luar runtuh begitu hadiahnya berhenti.</Poin>
            <Poin ikon="📉">Sebagai gantinya, yang ditawarkan di sini adalah satu hal yang tidak diberikan kebanyakan aplikasi: kemungkinan diberi tahu bahwa ini tidak berhasil.</Poin>
          </div>
        } />

      <div className="flex gap-2">
        <button
          onClick={() => {
            const hasil = prompt('What actually happened? One honest sentence for the archive.') ?? ''
            setS((x) => ({
              komitmen: undefined, tinjauan: [],
              arsip: [...x.arsip, { komitmen: k, tinjauan: x.tinjauan, selesaiPada: new Date().toISOString(), hasil }],
            }))
          }}
          className="rounded-xl bg-neutral-100 px-3 py-2.5 text-[12px] font-bold text-neutral-600"
        >
          End this commitment
        </button>
        <Link to="/learn" className="rounded-xl bg-neutral-100 px-3 py-2.5 text-[12px] font-bold text-neutral-600">
          Read the reasoning →
        </Link>
      </div>

      {s.arsip.length > 0 && (
        <Card>
          <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Previous commitments</div>
          <div className="mt-2 space-y-1.5">
            {s.arsip.map((a, i) => (
              <div key={i} className="rounded-xl bg-white/60 p-2.5">
                <div className="text-[12px] font-bold text-ink">{a.komitmen.sasaran}</div>
                <div className="text-[11px] text-neutral-500">
                  {a.tinjauan.length} weeks reviewed · {a.selesaiPada.slice(0, 10)}
                </div>
                {a.hasil && <p className="mt-0.5 text-[11px] leading-snug text-neutral-600">{a.hasil}</p>}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">
            Kept on purpose, including the ones that did not work. A record that only contains
            successes teaches you nothing about yourself.
          </p>
        </Card>
      )}
    </div>
  )
}

// ── Penyusunan komitmen ──────────────────────────────────────────────────────

const LANGKAH = [
  { kunci: 'sasaran', judul: 'One thing. Not three.', bantu: 'Attention is finite. People chasing several changes at once finish fewer of them than people chasing one.', tempat: 'Run 5 km without stopping' },
  { kunci: 'ukuran', judul: 'How will you know?', bantu: 'It has to be something you could show someone. "Feel fitter" cannot be checked; "run 5 km without walking" can.', tempat: 'A 5 km run, no walking breaks' },
  { kunci: 'pembatal', judul: 'What would mean this failed?', bantu: 'Write it now, while you are honest. A goal judged afterwards is always judged a success, because some number always went up.', tempat: 'Still cannot run 3 km after 8 weeks' },
  { kunci: 'kapan', judul: 'When exactly?', bantu: 'Naming the moment reliably increases follow-through. It works by removing the decision from the moment you are tired.', tempat: 'Tuesday, Thursday, Saturday, 6am' },
  { kunci: 'dimana', judul: 'Where?', bantu: 'A named place is one less decision. Optional, but it costs nothing.', tempat: 'The park loop near home' },
  { kunci: 'minimum', judul: 'The version for your worst day', bantu: 'Small enough that a terrible week cannot break it. This is the single most important field on this page — programmes that only have a full version stop completely.', tempat: 'Put shoes on, walk 10 minutes' },
  { kunci: 'rencanaPulih', judul: 'What happens after you miss a week?', bantu: 'Deciding now removes the moment of self-judgement later, which is what usually stops people coming back.', tempat: 'Restart at the minimum version, no catching up' },
] as const

function Susun({
  draf, setDraf, langkah, setLangkah, onSelesai,
}: {
  draf: Komitmen
  setDraf: (k: Komitmen) => void
  langkah: number
  setLangkah: (n: number) => void
  onSelesai: () => void
}) {
  const L = LANGKAH[langkah]
  const nilai = (draf as unknown as Record<string, string>)[L.kunci] ?? ''
  const bolehLanjut = L.kunci === 'dimana' || nilai.trim().length > 2

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      <SectionTitle icon={<IconChartUp />} title="Change"
        subtitle="Dua belas pekan, satu komitmen, dan ukuran yang boleh berkata tidak" />

      {langkah === 0 && (
        <Card>
          <Prosa kelas="text-[13px] leading-relaxed text-neutral-600">Membaca saja tidak mengubah apa pun — ia lebih sering hanya memunculkan perasaan telah berubah. Yang menyusul di bawah ini adalah susunan paling kecil yang memang didukung bukti: satu sasaran, waktu yang disebutkan, versi yang cukup kecil untuk bertahan pada pekan yang buruk, dan tinjauan yang boleh menyimpulkan bahwa ini tidak berhasil.</Prosa>
          <div className="mt-3">
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Area</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {WILAYAH.map((w) => (
                <button key={w.id} onClick={() => setDraf({ ...draf, wilayah: w.id as Wilayah })}
                  aria-pressed={draf.wilayah === w.id}
                  className={`rounded-lg px-2.5 py-1.5 text-[12px] font-bold ${
                    draf.wilayah === w.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                  {w.ikon} {w.label}
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
          Step {langkah + 1} of {LANGKAH.length}
        </div>
        <h3 className="mt-1 text-[16px] font-black leading-snug text-ink">{L.judul}</h3>
        <p className="mt-1 text-[12px] leading-relaxed text-neutral-500">{L.bantu}</p>
        <div className="mt-3">
          <Field label="Your answer">
            <input className={inputClass} value={nilai} placeholder={L.tempat}
              aria-label={L.judul}
              onChange={(e) => setDraf({ ...draf, [L.kunci]: e.target.value } as Komitmen)} />
          </Field>
        </div>
        <div className="mt-3 flex gap-2">
          {langkah > 0 && (
            <button onClick={() => setLangkah(langkah - 1)}
              className="rounded-xl bg-neutral-100 px-3 py-2.5 text-[12px] font-bold text-neutral-600">Back</button>
          )}
          {langkah < LANGKAH.length - 1
            ? <Button onClick={() => setLangkah(langkah + 1)} disabled={!bolehLanjut}>Next</Button>
            : <Button onClick={onSelesai} disabled={!bolehLanjut}>Mulai dua belas pekan</Button>}
        </div>
      </Card>

      <Ringkas ikon="📚" judul="Where this structure comes from"
        anak={
          <div className="space-y-1.5">
            <Poin ikon="🕒"><b>Menyebutkan kapan dan di mana</b> — one of the better-supported findings in behaviour change, though its effect is modest and shrinks in the most rigorous studies.</Poin>
            <Poin ikon="🔻"><b>Versi paling kecil</b> — reasoning from maintenance research: far less work preserves what you built than was needed to build it.</Poin>
            <Poin ikon="🔎"><b>The falsifier</b> — borrowed from trial pre-registration. Sound reasoning, but no study shows individuals who do this develop faster.</Poin>
            <Poin ikon="⚠️"><b>Twelve weeks</b> — a convention, not a finding. It is long enough to see change in most physical measures and short enough to stay real.</Poin>
          </div>
        } />
    </div>
  )
}

function TinjauPekan({ pekan, onSimpan }: { pekan: number; onSimpan: (t: import('../lib/perubahan').Tinjauan) => void }) {
  const [hari, setHari] = useState<number | undefined>(undefined)
  const [arah, setArah] = useState<'maju' | 'diam' | 'mundur'>('diam')
  const [halangan, setHalangan] = useState('')
  const [penyesuaian, setPenyesuaian] = useState('')

  return (
    <Card className="!border-brand/30 !bg-brand/5">
      <div className="text-[10px] font-black uppercase tracking-wide text-brand">Week {pekan} review is due</div>
      <div className="mt-2 space-y-2.5">
        <div>
          <div className="text-[12px] font-bold text-ink">On how many days did the minimum version happen?</div>
          <div className="mt-1 w-24"><KolomAngka nilai={hari} onNilai={setHari} ariaLabel="Days at minimum" /></div>
        </div>
        <div>
          <div className="text-[12px] font-bold text-ink">Did the measure move?</div>
          <div className="mt-1 flex gap-1.5">
            {([['maju', 'Moved'], ['diam', 'Flat'], ['mundur', 'Went back']] as const).map(([id, l]) => (
              <button key={id} onClick={() => setArah(id)} aria-pressed={arah === id}
                className={`rounded-lg px-2.5 py-1.5 text-[12px] font-bold ${
                  arah === id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>{l}</button>
            ))}
          </div>
        </div>
        <Field label="Apa yang paling menghalangi?">
          <input className={inputClass} value={halangan} aria-label="What got in the way"
            placeholder="Late meetings on Tuesdays" onChange={(e) => setHalangan(e.target.value)} />
        </Field>
        <Field label="Satu perubahan untuk pekan depan">
          <input className={inputClass} value={penyesuaian} aria-label="Satu perubahan untuk pekan depan"
            placeholder="Move Tuesday session to morning" onChange={(e) => setPenyesuaian(e.target.value)} />
        </Field>
        <Button onClick={() => onSimpan({
          pekan, pada: new Date().toISOString(), hariMinimum: Math.max(0, Math.min(7, hari ?? 0)),
          arah, halangan: halangan.trim(), penyesuaian: penyesuaian.trim(),
        })}>Save review</Button>
      </div>
      <Prosa kelas="mt-2 text-[10px] leading-relaxed text-neutral-500">Jawablah dengan apa yang terjadi, bukan apa yang Anda niatkan. Catatan yang disunting agar tampak lebih baik adalah catatan yang tidak lagi dapat memberi tahu apa pun.</Prosa>
    </Card>
  )
}

function Angka({ label, nilai }: { label: string; nilai: number }) {
  return (
    <div className="rounded-xl bg-white/60 p-2.5 text-center">
      <div className="text-lg font-black tabular-nums text-ink">{nilai}</div>
      <div className="mt-0.5 text-[10px] font-bold uppercase leading-tight tracking-wide text-neutral-500">{label}</div>
    </div>
  )
}

function labelPutusan(p: string): string {
  return p === 'berjalan' ? 'Working'
    : p === 'goyah' ? 'Partly working'
      : p === 'tidak-berjalan' ? 'Not working'
        : 'Too early to judge'
}
function warnaPutusan(p: string): string {
  return p === 'berjalan' ? '#15803d' : p === 'goyah' ? '#b45309' : p === 'tidak-berjalan' ? '#be123c' : '#57616f'
}
function warnaArah(a: string): string {
  return a === 'maju' ? '#15803d' : a === 'mundur' ? '#be123c' : '#57616f'
}

export default Perubahan

import { useEffect, useMemo, useState } from 'react'
import { Prosa } from '../components/Prosa'
import { simpanTeks } from '../lib/unduh'
import { Card, SectionTitle, Button, inputClass } from '../components/ui'
import { IconSparkle, IconChartUp } from '../components/icons'
import { hariIni } from '../lib/tanggal'

// ─────────────────────────────────────────────────────────────────────────────
// Metode Harada — kisi 9×9 (Mandal-Art).
//
// Dipakai Takashi Harada untuk membawa sekolah menengah yang biasa saja menjadi
// juara nasional atletik, dan dipakai Shohei Ohtani saat kelas satu SMA untuk
// merencanakan menjadi pilihan pertama draft. Bentuknya sederhana dan justru
// itu kekuatannya:
//
//   * Satu sasaran utama di tengah.
//   * Delapan penopang di sekelilingnya — bukan langkah, melainkan BIDANG yang
//     harus kuat agar sasaran itu mungkin.
//   * Setiap penopang punya delapan tindakan konkret. 8 × 8 = 64 tindakan.
//
// Yang membuatnya bekerja bukan kisinya, melainkan paksaan mengisi 64 kotak:
// Anda kehabisan jawaban malas sekitar kotak ke-20 dan terpaksa memikirkan hal
// yang benar-benar Anda hindari selama ini. Karena itu halaman ini menampilkan
// berapa kotak yang masih kosong, bukan menyembunyikannya.
//
// Beda dari Ikigai di halaman sebelah: Ikigai menjawab "mengapa", Harada
// menjawab "apa yang saya kerjakan hari Senin".
//
// Semuanya tersimpan di perangkat. Tidak ada yang dikirim ke mana pun.
// ─────────────────────────────────────────────────────────────────────────────

interface Penopang {
  judul: string
  aksi: string[]      // 8 tindakan
  selesai: string[]   // aksi yang sudah dicentang, disimpan sebagai indeks teks
}
interface DataHarada {
  sasaran: string
  tenggat: string
  mengapa: string
  penopang: Penopang[]  // selalu 8
  dibuat: string
}

const KOSONG = (): DataHarada => ({
  sasaran: '', tenggat: '', mengapa: '', dibuat: hariIni(),
  penopang: Array.from({ length: 8 }, () => ({ judul: '', aksi: Array(8).fill(''), selesai: [] })),
})
const KEY = 'pmd_harada_v1'

function muat(): DataHarada {
  try {
    const d = { ...KOSONG(), ...JSON.parse(localStorage.getItem(KEY) || '{}') } as DataHarada
    // Bentuknya dijaga: data lama yang penopangnya kurang dari delapan tidak
    // boleh membuat halaman ini meledak saat dirender.
    const p = Array.from({ length: 8 }, (_, i) => {
      const s = d.penopang?.[i]
      return {
        judul: s?.judul ?? '',
        aksi: Array.from({ length: 8 }, (_, j) => s?.aksi?.[j] ?? ''),
        selesai: Array.isArray(s?.selesai) ? s.selesai : [],
      }
    })
    return { ...d, penopang: p }
  } catch { return KOSONG() }
}

// Contoh yang sengaja spesifik. Contoh kabur ("jadi lebih sehat") justru
// mengajarkan kebiasaan yang ingin dihindari metode ini.
const CONTOH = {
  sasaran: 'Half marathon sub-1:45',
  tenggat: 'June 2027',
  mengapa: 'I want to prove to myself that I can finish something that takes two years, not two weeks.',
  penopang: [
    'Aerobic volume', 'Speed & threshold', 'Strength', 'Recovery',
    'Nutrition', 'Body weight', 'Mental', 'Injury prevention',
  ],
}

const POSISI_TENGAH = 4 // kotak tengah pada kisi 3×3

export function Harada() {
  const [d, setD] = useState<DataHarada>(muat)
  const [buka, setBuka] = useState<number | null>(null)
  const [tersimpan, setTersimpan] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(d)) } catch { /* kuota */ }
      setTersimpan(true)
      const s = setTimeout(() => setTersimpan(false), 1200)
      return () => clearTimeout(s)
    }, 400)
    return () => clearTimeout(t)
  }, [d])

  const ubah = (p: Partial<DataHarada>) => setD((s) => ({ ...s, ...p }))
  const ubahPenopang = (i: number, p: Partial<Penopang>) =>
    setD((s) => ({ ...s, penopang: s.penopang.map((x, j) => (j === i ? { ...x, ...p } : x)) }))
  const ubahAksi = (i: number, j: number, v: string) =>
    ubahPenopang(i, { aksi: d.penopang[i].aksi.map((a, k) => (k === j ? v : a)) })

  const alihSelesai = (i: number, aksi: string) => {
    if (!aksi.trim()) return
    const kini = d.penopang[i].selesai
    ubahPenopang(i, {
      selesai: kini.includes(aksi) ? kini.filter((x) => x !== aksi) : [...kini, aksi],
    })
  }

  const stat = useMemo(() => {
    const judul = d.penopang.filter((p) => p.judul.trim()).length
    const aksi = d.penopang.reduce((s, p) => s + p.aksi.filter((a) => a.trim()).length, 0)
    const selesai = d.penopang.reduce(
      (s, p) => s + p.aksi.filter((a) => a.trim() && p.selesai.includes(a)).length, 0)
    return { judul, aksi, selesai, sisa: 64 - aksi }
  }, [d])

  function pakaiContoh() {
    setD((s) => ({
      ...s,
      sasaran: s.sasaran || CONTOH.sasaran,
      tenggat: s.tenggat || CONTOH.tenggat,
      mengapa: s.mengapa || CONTOH.mengapa,
      penopang: s.penopang.map((p, i) => (p.judul.trim() ? p : { ...p, judul: CONTOH.penopang[i] })),
    }))
  }

  function unduh() {
    const baris: string[] = [
      'HARADA 9×9 GRID',
      `Goal      : ${d.sasaran || '—'}`,
      `Deadline  : ${d.tenggat || '—'}`,
      d.mengapa.trim() ? `Why       : ${d.mengapa.trim()}` : '',
      `Filled in : ${stat.aksi}/64 actions, ${stat.selesai} already done`,
      '',
    ]
    d.penopang.forEach((p, i) => {
      if (!p.judul.trim() && !p.aksi.some((a) => a.trim())) return
      baris.push(`${i + 1}. ${p.judul || '(untitled)'}`)
      p.aksi.forEach((a) => { if (a.trim()) baris.push(`   [${p.selesai.includes(a) ? 'x' : ' '}] ${a}`) })
      baris.push('')
    })
    void simpanTeks(baris.filter((x) => x !== undefined).join('\n'),
      `harada-${hariIni()}.txt`, 'text/plain;charset=utf-8', 'Harada grid')
  }

  function kosongkan() {
    if (!confirm('Clear the whole grid and start from scratch? This cannot be undone.')) return
    setD(KOSONG())
    setBuka(null)
  }

  // Kisi tengah: sasaran di posisi 4, delapan penopang mengelilinginya.
  const selTengah = Array.from({ length: 9 }, (_, i) => {
    if (i === POSISI_TENGAH) return { pusat: true, idx: -1 }
    const idx = i < POSISI_TENGAH ? i : i - 1
    return { pusat: false, idx }
  })

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <SectionTitle
        icon={<IconSparkle />}
        title="The Harada 9×9 Method"
        subtitle="One goal, eight pillars, 64 concrete actions"
      />

      <Card>
        <p className="text-sm leading-relaxed text-neutral-600">
          Takashi Harada used this method to take an ordinary school to national athletics
          champions, and Shohei Ohtani filled one in during his first year of high school. What makes
          it work is not the grid but <b>being forced to fill 64 boxes</b>: the lazy answers run out
          around box 20, and the rest force you to name what you have been avoiding.
        </p>
        <Prosa kelas="mt-2 text-[12px] leading-relaxed text-neutral-500">Fill it in gradually. It does not have to be finished today — an honest half-filled grid is far more useful than 64 boxes filled just to fill them.</Prosa>
      </Card>

      {/* Sasaran utama */}
      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Main goal</div>
        <input
          className={`${inputClass} mt-2`}
          placeholder="As specific as possible — 'sub-1:45 half marathon', not 'get healthier'"
          value={d.sasaran}
          onChange={(e) => ubah({ sasaran: e.target.value })}
          aria-label="Main goal"
        />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input
            className={inputClass}
            placeholder="Deadline (e.g. June 2027)"
            value={d.tenggat}
            onChange={(e) => ubah({ tenggat: e.target.value })}
            aria-label="Deadline"
          />
          <button onClick={pakaiContoh}
            className="rounded-xl bg-white/5 px-3 py-2 text-[12px] font-bold text-neutral-600">
            Fill in the example
          </button>
        </div>
        <textarea
          className={`${inputClass} mt-2 min-h-[72px]`}
          placeholder="Why does this matter to you? This is the part that holds you at month four."
          value={d.mengapa}
          onChange={(e) => ubah({ mengapa: e.target.value })}
          aria-label="Why"
        />
      </Card>

      {/* Kemajuan */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Progress</div>
          {tersimpan && <span className="text-[10px] font-bold text-emerald-500" role="status">saved</span>}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          {[
            { l: 'Pillars', v: `${stat.judul}/8` },
            { l: 'Actions', v: `${stat.aksi}/64` },
            { l: 'Completed', v: `${stat.selesai}` },
          ].map((x) => (
            <div key={x.l} className="rounded-xl bg-white/5 p-2.5">
              <div className="text-lg font-black text-ink">{x.v}</div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">{x.l}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${(stat.aksi / 64) * 100}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-neutral-500">
          {stat.sisa > 0
            ? `${stat.sisa} boxes still empty. The hardest boxes to fill usually point at the area you avoid most.`
            : 'All 64 boxes filled. Now the real part: do them, then tick them off.'}
        </p>
      </Card>

      {/* Kisi tengah 3×3 */}
      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Centre grid</div>
        <p className="mt-1 text-[11px] text-neutral-500">Tap a pillar to open its eight actions.</p>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {selTengah.map((sel, i) => {
            if (sel.pusat) {
              return (
                <div key={i} className="grid aspect-square place-items-center rounded-xl bg-brand p-1.5 text-center">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wide text-ink/70">Goal</div>
                    <div className="mt-0.5 line-clamp-3 text-[10px] font-bold leading-tight text-ink">
                      {d.sasaran || '—'}
                    </div>
                  </div>
                </div>
              )
            }
            const p = d.penopang[sel.idx]
            const terisi = p.aksi.filter((a) => a.trim()).length
            const aktif = buka === sel.idx
            return (
              <button
                key={i}
                onClick={() => setBuka(aktif ? null : sel.idx)}
                aria-label={`Pillar ${sel.idx + 1}: ${p.judul || 'empty'}, ${terisi} of 8 actions`}
                className={`grid aspect-square place-items-center rounded-xl p-1.5 text-center transition ${
                  aktif ? 'bg-brand/25 ring-2 ring-brand' : p.judul.trim() ? 'bg-white/10' : 'bg-white/5'
                }`}>
                <div>
                  <div className={`line-clamp-3 text-[10px] font-bold leading-tight ${p.judul.trim() ? 'text-white' : 'text-slate-500'}`}>
                    {p.judul || `Pillar ${sel.idx + 1}`}
                  </div>
                  <div className="mt-0.5 text-[10px] font-bold text-neutral-500">{terisi}/8</div>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Penopang terbuka */}
      {buka != null && (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">
              Pillar {buka + 1}
            </div>
            <button onClick={() => setBuka(null)}
              className="rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-bold text-neutral-600">
              Close
            </button>
          </div>
          <input
            className={`${inputClass} mt-2`}
            placeholder="An area that must be strong — e.g. 'Recovery', not 'sleep 8 hours'"
            value={d.penopang[buka].judul}
            onChange={(e) => ubahPenopang(buka, { judul: e.target.value })}
            aria-label={`Pillar ${buka + 1} title`}
          />
          <p className="mt-2 text-[11px] text-neutral-500">
            Eight actions you could do this week, not aspirations. Tick them once done.
          </p>
          <div className="mt-2 space-y-1.5">
            {d.penopang[buka].aksi.map((a, j) => {
              const sudah = a.trim() !== '' && d.penopang[buka].selesai.includes(a)
              return (
                <div key={j} className="flex items-center gap-2">
                  <button
                    onClick={() => alihSelesai(buka, a)}
                    disabled={!a.trim()}
                    aria-label={sudah ? `Untick action ${j + 1}` : `Tick action ${j + 1}`}
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[12px] font-black transition ${
                      sudah ? 'bg-emerald-500 text-white' : a.trim() ? 'bg-white/10 text-neutral-500' : 'bg-white/5 text-slate-600'
                    }`}>
                    ✓
                  </button>
                  <input
                    className={`${inputClass} ${sudah ? 'line-through opacity-60' : ''}`}
                    placeholder={`Action ${j + 1}`}
                    value={a}
                    onChange={(e) => ubahAksi(buka, j, e.target.value)}
                    aria-label={`Action ${j + 1} of pillar ${buka + 1}`}
                  />
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap gap-2">
          <Button onClick={unduh}>Download as text</Button>
          <button onClick={kosongkan}
            className="rounded-xl bg-white/5 px-3 py-2 text-[12px] font-bold text-rose-600">
            Clear the grid
          </button>
        </div>
        <Prosa kelas="mt-2 text-[11px] leading-relaxed text-neutral-500">Stored on this device only — not sent to a server and not visible to anyone else. Download a copy if you want to keep it outside the app.</Prosa>
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <IconChartUp size={16} />
          <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">How to use it</div>
        </div>
        <ol className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-neutral-600">
          <li><b>1.</b> Write a goal that can be judged true or false. "Fitter" cannot be; "sub-1:45" can.</li>
          <li><b>2.</b> Fill the eight pillars in as <i>domains</i>, not steps. Strength, recovery, nutrition — not "Tuesday run".</li>
          <li><b>3.</b> Only then fill in the actions. This is where steps you could take this week belong.</li>
          <li><b>4.</b> Review it each week. Tick what worked and replace what turned out unrealistic — swapping a box is not a failure, it is part of the method.</li>
        </ol>
      </Card>
    </div>
  )
}

export default Harada

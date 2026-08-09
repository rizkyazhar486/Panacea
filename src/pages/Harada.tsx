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
  tenggat: 'Juni 2027',
  mengapa: 'Ingin membuktikan pada diri sendiri bahwa saya bisa menyelesaikan sesuatu yang butuh dua tahun, bukan dua minggu.',
  penopang: [
    'Volume aerobik', 'Kecepatan & ambang', 'Kekuatan', 'Pemulihan',
    'Gizi', 'Berat badan', 'Mental', 'Pencegahan cedera',
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
      'KISI HARADA 9×9',
      `Sasaran   : ${d.sasaran || '—'}`,
      `Tenggat   : ${d.tenggat || '—'}`,
      d.mengapa.trim() ? `Mengapa   : ${d.mengapa.trim()}` : '',
      `Terisi    : ${stat.aksi}/64 tindakan, ${stat.selesai} sudah dijalankan`,
      '',
    ]
    d.penopang.forEach((p, i) => {
      if (!p.judul.trim() && !p.aksi.some((a) => a.trim())) return
      baris.push(`${i + 1}. ${p.judul || '(tanpa judul)'}`)
      p.aksi.forEach((a) => { if (a.trim()) baris.push(`   [${p.selesai.includes(a) ? 'x' : ' '}] ${a}`) })
      baris.push('')
    })
    void simpanTeks(baris.filter((x) => x !== undefined).join('\n'),
      `harada-${hariIni()}.txt`, 'text/plain;charset=utf-8', 'Kisi Harada')
  }

  function kosongkan() {
    if (!confirm('Hapus seluruh kisi dan mulai dari nol? Tindakan ini tidak bisa dibatalkan.')) return
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
        title="Metode Harada 9×9"
        subtitle="Satu sasaran, delapan penopang, 64 tindakan konkret"
      />

      <Card>
        <p className="text-sm leading-relaxed text-neutral-600">
          Metode ini dipakai Takashi Harada untuk membawa sekolah biasa menjadi juara nasional
          atletik, dan ditulis Shohei Ohtani saat kelas satu SMA. Yang membuatnya bekerja bukan
          kisinya, melainkan <b>paksaan mengisi 64 kotak</b>: jawaban malas habis sekitar kotak
          ke-20, dan sisanya memaksa Anda menyebut hal yang selama ini dihindari.
        </p>
        <Prosa kelas="mt-2 text-[12px] leading-relaxed text-neutral-500">Isi bertahap. Tidak harus selesai hari ini — kisi yang jujur dan setengah terisi jauh lebih berguna daripada 64 kotak yang diisi asal penuh.</Prosa>
      </Card>

      {/* Sasaran utama */}
      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Sasaran utama</div>
        <input
          className={`${inputClass} mt-2`}
          placeholder="Sespesifik mungkin — 'sub-1:45 half marathon', bukan 'lebih sehat'"
          value={d.sasaran}
          onChange={(e) => ubah({ sasaran: e.target.value })}
          aria-label="Sasaran utama"
        />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input
            className={inputClass}
            placeholder="Tenggat (mis. Juni 2027)"
            value={d.tenggat}
            onChange={(e) => ubah({ tenggat: e.target.value })}
            aria-label="Tenggat"
          />
          <button onClick={pakaiContoh}
            className="rounded-xl bg-white/5 px-3 py-2 text-[12px] font-bold text-neutral-600">
            Isi contoh
          </button>
        </div>
        <textarea
          className={`${inputClass} mt-2 min-h-[72px]`}
          placeholder="Mengapa ini penting bagi Anda? Bagian ini yang menahan Anda di bulan keempat."
          value={d.mengapa}
          onChange={(e) => ubah({ mengapa: e.target.value })}
          aria-label="Mengapa"
        />
      </Card>

      {/* Kemajuan */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Kemajuan</div>
          {tersimpan && <span className="text-[10px] font-bold text-emerald-500" role="status">tersimpan</span>}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          {[
            { l: 'Penopang', v: `${stat.judul}/8` },
            { l: 'Tindakan', v: `${stat.aksi}/64` },
            { l: 'Dijalankan', v: `${stat.selesai}` },
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
            ? `Masih ${stat.sisa} kotak kosong. Kotak yang paling sulit diisi biasanya menunjuk bidang yang paling Anda hindari.`
            : 'Ke-64 kotak terisi. Sekarang bagian yang sebenarnya: jalankan, lalu centang.'}
        </p>
      </Card>

      {/* Kisi tengah 3×3 */}
      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Kisi tengah</div>
        <p className="mt-1 text-[11px] text-neutral-500">Ketuk satu penopang untuk membuka delapan tindakannya.</p>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {selTengah.map((sel, i) => {
            if (sel.pusat) {
              return (
                <div key={i} className="grid aspect-square place-items-center rounded-xl bg-brand p-1.5 text-center">
                  <div>
                    <div className="text-[8px] font-black uppercase tracking-wide text-ink/70">Sasaran</div>
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
                aria-label={`Penopang ${sel.idx + 1}: ${p.judul || 'kosong'}, ${terisi} dari 8 tindakan`}
                className={`grid aspect-square place-items-center rounded-xl p-1.5 text-center transition ${
                  aktif ? 'bg-brand/25 ring-2 ring-brand' : p.judul.trim() ? 'bg-white/10' : 'bg-white/5'
                }`}>
                <div>
                  <div className={`line-clamp-3 text-[10px] font-bold leading-tight ${p.judul.trim() ? 'text-white' : 'text-slate-500'}`}>
                    {p.judul || `Penopang ${sel.idx + 1}`}
                  </div>
                  <div className="mt-0.5 text-[8px] font-bold text-neutral-500">{terisi}/8</div>
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
              Penopang {buka + 1}
            </div>
            <button onClick={() => setBuka(null)}
              className="rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-bold text-neutral-600">
              Tutup
            </button>
          </div>
          <input
            className={`${inputClass} mt-2`}
            placeholder="Bidang yang harus kuat — mis. 'Pemulihan', bukan 'tidur 8 jam'"
            value={d.penopang[buka].judul}
            onChange={(e) => ubahPenopang(buka, { judul: e.target.value })}
            aria-label={`Judul penopang ${buka + 1}`}
          />
          <p className="mt-2 text-[11px] text-neutral-500">
            Delapan tindakan yang bisa dijalankan minggu ini, bukan cita-cita. Centang setelah dijalankan.
          </p>
          <div className="mt-2 space-y-1.5">
            {d.penopang[buka].aksi.map((a, j) => {
              const sudah = a.trim() !== '' && d.penopang[buka].selesai.includes(a)
              return (
                <div key={j} className="flex items-center gap-2">
                  <button
                    onClick={() => alihSelesai(buka, a)}
                    disabled={!a.trim()}
                    aria-label={sudah ? `Cancelkan centang tindakan ${j + 1}` : `Centang tindakan ${j + 1}`}
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[12px] font-black transition ${
                      sudah ? 'bg-emerald-500 text-white' : a.trim() ? 'bg-white/10 text-neutral-500' : 'bg-white/5 text-slate-600'
                    }`}>
                    ✓
                  </button>
                  <input
                    className={`${inputClass} ${sudah ? 'line-through opacity-60' : ''}`}
                    placeholder={`Tindakan ${j + 1}`}
                    value={a}
                    onChange={(e) => ubahAksi(buka, j, e.target.value)}
                    aria-label={`Tindakan ${j + 1} penopang ${buka + 1}`}
                  />
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap gap-2">
          <Button onClick={unduh}>Unduh sebagai teks</Button>
          <button onClick={kosongkan}
            className="rounded-xl bg-white/5 px-3 py-2 text-[12px] font-bold text-rose-600">
            Kosongkan kisi
          </button>
        </div>
        <Prosa kelas="mt-2 text-[11px] leading-relaxed text-neutral-500">Tersimpan di perangkat ini saja — tidak dikirim ke server dan tidak terlihat oleh siapa pun. Unduh salinannya bila Anda ingin menyimpannya di luar aplikasi.</Prosa>
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <IconChartUp size={16} />
          <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Cara memakainya</div>
        </div>
        <ol className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-neutral-600">
          <li><b>1.</b> Tulis sasaran yang bisa dinilai benar atau salah. "Lebih bugar" tidak bisa; "sub-1:45" bisa.</li>
          <li><b>2.</b> Isi delapan penopang sebagai <i>bidang</i>, bukan langkah. Kekuatan, pemulihan, gizi — bukan "lari Selasa".</li>
          <li><b>3.</b> Baru isi tindakan. Di sinilah langkah yang bisa dijalankan minggu ini masuk.</li>
          <li><b>4.</b> Tinjau tiap pekan. Centang yang jalan, ganti yang ternyata tidak realistis — mengganti kotak bukan kegagalan, itu memang bagian metodenya.</li>
        </ol>
      </Card>
    </div>
  )
}

export default Harada

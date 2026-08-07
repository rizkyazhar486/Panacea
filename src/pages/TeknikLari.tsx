import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, SectionTitle } from '../components/ui'
import { IconRun } from '../components/icons'
import { BAGIAN, FISIOLOGI, LABEL_BUKTI, RUJUKAN_LARI } from '../lib/teknikLari'

// ─────────────────────────────────────────────────────────────────────────────
// Teknik Lari.
//
// Tiap bagian membawa TINGKAT BUKTI-nya sendiri, dan itu keputusan yang paling
// menentukan kegunaan halaman ini. Menyamakan "naikkan irama langkah 5%" (uji
// terkendali, manfaat terukur) dengan "condongkan badan dari pergelangan kaki"
// (kebiasaan pelatih) membuat pembaca menghabiskan tenaga pada hal yang salah —
// dan pada bagian pendaratan kaki, mendorong perubahan justru memindahkan
// cedera, bukan mencegahnya.
//
// Karena itu daftarnya diurutkan menurut kekuatan bukti, bukan menurut urutan
// anatomi dari kepala ke kaki. Yang paling berpengaruh dibaca lebih dulu.
// ─────────────────────────────────────────────────────────────────────────────

const URUT: Record<string, number> = { kuat: 0, sedang: 1, lemah: 2 }

export function TeknikLari() {
  const [buka, setBuka] = useState<string | null>('irama')
  const [bukaFis, setBukaFis] = useState<string | null>(null)

  const bagian = [...BAGIAN].sort((a, b) => URUT[a.bukti] - URUT[b.bukti])

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <SectionTitle
        icon={<IconRun />}
        title="Teknik Lari"
        subtitle="Dari start sampai napas — diurutkan menurut seberapa kuat buktinya"
      />

      {/* Yang paling sering salah dipahami, ditaruh paling atas. */}
      <Card className="!border-amber-500/30 !bg-amber-500/5">
        <div className="text-[11px] font-black uppercase tracking-wide text-amber-400">Baca ini dulu</div>
        <p className="mt-2 text-[12px] leading-relaxed text-slate-300">
          <b>Tidak ada satu bentuk lari yang benar untuk semua orang.</b> Bukti terbaik yang ada
          menunjukkan bahwa mengubah gaya lari secara paksa — terutama memaksa mendarat pada ujung
          kaki — tidak menurunkan risiko cedera, dan sering hanya memindahkannya dari lutut ke
          tendon Achilles dan tulang telapak kaki.
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-slate-300">
          Karena itu tiap bagian di bawah membawa tingkat buktinya sendiri, dan daftarnya diurutkan
          dari yang paling terbukti. Kalau waktu Anda terbatas, kerjakan yang hijau lebih dulu dan
          biarkan sisanya apa adanya.
        </p>
      </Card>

      {/* Teknik */}
      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">Teknik, dari yang paling terbukti</div>
        <div className="mt-3 space-y-1.5">
          {bagian.map((b) => {
            const t = buka === b.id
            const bk = LABEL_BUKTI[b.bukti]
            return (
              <div key={b.id} className="overflow-hidden rounded-xl bg-white/5">
                <button
                  onClick={() => setBuka(t ? null : b.id)}
                  aria-expanded={t}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{b.emoji}</span>
                      <span className="text-[13px] font-black text-white">{b.nama}</span>
                      {(b.video || b.gambar) && <span className="text-[10px]">{b.video ? '🎬' : '🖼️'}</span>}
                    </div>
                    <div className={`truncate text-[10px] font-bold ${bk.warna}`}>{bk.label} · {b.ringkas}</div>
                  </div>
                  <span className={`shrink-0 text-slate-400 transition ${t ? 'rotate-90' : ''}`}>›</span>
                </button>
                {t && (
                  <div className="space-y-2 border-t border-white/10 px-3 py-2.5">
                    {b.video ? (
                      <video src={b.video} autoPlay muted loop playsInline preload="none"
                        aria-label={`Demonstrasi ${b.nama}`}
                        className="aspect-square w-full rounded-xl object-cover" />
                    ) : b.gambar ? (
                      <img src={b.gambar} alt={`Acuan ${b.nama}`} loading="lazy"
                        className="aspect-square w-full rounded-xl object-cover" />
                    ) : null}

                    <p className="text-[12px] leading-relaxed text-slate-200">{b.intinya}</p>

                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">Cara mengerjakannya</div>
                      <ol className="mt-1 space-y-1">
                        {b.langkah.map((l, i) => (
                          <li key={l} className="flex gap-2 text-[12px] leading-snug text-slate-200">
                            <span className="font-black text-brand">{i + 1}.</span><span>{l}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="rounded-lg bg-rose-500/10 p-2">
                      <div className="text-[10px] font-black uppercase text-rose-400">Kesalahan yang paling umum</div>
                      <p className="text-[12px] leading-snug text-slate-300">{b.kesalahan}</p>
                    </div>

                    <div className="rounded-lg bg-emerald-500/10 p-2">
                      <div className="text-[10px] font-black uppercase text-emerald-400">Latihan</div>
                      <p className="text-[12px] leading-snug text-slate-300">{b.latihan}</p>
                    </div>

                    <p className="text-[10px] leading-relaxed text-slate-500">{bk.label}: {bk.arti}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Fisiologi endurance */}
      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">Membangun daya tahan</div>
        <p className="mt-1 text-[12px] leading-relaxed text-slate-400">
          Teknik menentukan seberapa murah tiap langkah. Empat hal ini menentukan berapa lama Anda
          bisa mempertahankannya.
        </p>
        <div className="mt-3 space-y-1.5">
          {FISIOLOGI.map((f) => {
            const t = bukaFis === f.id
            return (
              <div key={f.id} className="overflow-hidden rounded-xl bg-white/5">
                <button
                  onClick={() => setBukaFis(t ? null : f.id)}
                  aria-expanded={t}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left">
                  <div className="min-w-0">
                    <div className="text-[13px] font-black text-white">{f.emoji} {f.judul}</div>
                    <div className="truncate text-[10px] text-slate-400">{f.pertanyaan}</div>
                  </div>
                  <span className={`shrink-0 text-slate-400 transition ${t ? 'rotate-90' : ''}`}>›</span>
                </button>
                {t && (
                  <div className="space-y-2 border-t border-white/10 px-3 py-2.5">
                    <p className="text-[12px] leading-relaxed text-slate-200">{f.jawaban}</p>
                    <ul className="space-y-1">
                      {f.aturan.map((a) => (
                        <li key={a} className="flex gap-2 text-[12px] leading-snug text-slate-300">
                          <span className="text-brand">•</span><span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Pace tidak diduplikasi — sudah punya halamannya sendiri. */}
      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">Pace Anda sendiri</div>
        <p className="mt-2 text-[12px] leading-relaxed text-slate-300">
          Angka pace easy, tempo dan interval bergantung pada kebugaran Anda sekarang, jadi ia tidak
          diulang di sini. Halaman <b>Latihan Dasar &amp; Postur</b> menghitungnya dari hasil lomba
          atau tes Anda memakai kerangka VDOT, dan <b>Analisis Pro</b> membaca zona pace langsung
          dari sesi yang sudah tersinkron.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/latihan-dasar"
            className="rounded-xl bg-brand px-3 py-2 text-[12px] font-bold text-white">Hitung zona pace saya</Link>
          <Link to="/analisis-pro"
            className="rounded-xl bg-white/5 px-3 py-2 text-[12px] font-bold text-slate-300">Zona dari data saya</Link>
        </div>
      </Card>

      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">Rujukan</div>
        <ul className="mt-2 space-y-1">
          {RUJUKAN_LARI.map((r) => (
            <li key={r} className="text-[10px] leading-relaxed text-slate-500">{r}</li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
          Klip dan gambar dihasilkan AI sebagai acuan bentuk, bukan rekaman pelatih. Bila ada nyeri
          yang berulang di tempat yang sama, itu urusan tenaga kesehatan — bukan urusan memperbaiki
          teknik sendiri dari halaman web.
        </p>
      </Card>
    </div>
  )
}

export default TeknikLari

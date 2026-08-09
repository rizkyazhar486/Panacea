import { useEffect, useState } from 'react'
import { Card, SectionTitle, Button } from '../components/ui'
import { Ringkas, Poin } from '../components/Ringkas'
import { IconShield } from '../components/icons'
import {
  KITAB, daftarBagian, bacaBagian, PENYEDIA_HADIS, PERINGATAN_DERAJAT, CATATAN_SAHIH,
  type Kitab, type HalamanHadis,
} from '../lib/hadis'

// ─────────────────────────────────────────────────────────────────────────────
// Pembaca hadis.
//
// Seluruh alasan di balik pembagian kitabnya ada di lib/hadis.ts. Satu hal
// diulang di sini karena menyangkut apa yang dilihat pengguna: DERAJAT SEBUAH
// KITAB TIDAK PERNAH DISEMBUNYIKAN. Kitab yang isinya bercampur derajat diberi
// tanda yang berbeda di daftar, peringatan yang tidak bisa dilewati sebelum
// teksnya tampil, dan pengingat pada setiap riwayat.
//
// Menaruh riwayat lemah dan riwayat sahih dalam bingkai yang sama persis adalah
// hal yang paling mudah dilakukan dan paling merugikan pembaca, karena tidak
// ada satu pun tanda di layar yang memberitahunya.
// ─────────────────────────────────────────────────────────────────────────────

export function Hadis() {
  const [kitabId, setKitabId] = useState<string | null>(null)
  const [bab, setBab] = useState<{ nomor: number; nama: string }[]>([])
  const [buka, setBuka] = useState<number | null>(null)
  const [isi, setIsi] = useState<HalamanHadis | null>(null)
  const [tampilArab, setTampilArab] = useState(true)
  const [galat, setGalat] = useState('')
  const [muat, setMuat] = useState(false)

  const kitab = KITAB.find((k) => k.id === kitabId) ?? null

  useEffect(() => {
    if (!kitabId) { setBab([]); setBuka(null); return }
    setMuat(true); setGalat(''); setBab([])
    daftarBagian(kitabId)
      .then(setBab)
      .catch((e: Error) => setGalat(pesan(e)))
      .finally(() => setMuat(false))
  }, [kitabId])

  useEffect(() => {
    if (!kitabId || buka === null) { setIsi(null); return }
    setMuat(true); setGalat(''); setIsi(null)
    bacaBagian(kitabId, buka)
      .then(setIsi)
      .catch((e: Error) => setGalat(pesan(e)))
      .finally(() => setMuat(false))
  }, [kitabId, buka])

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      <SectionTitle icon={<IconShield />} title="Hadith"
        subtitle="Collections named, gradings stated honestly" />

      {/* Tidak bisa dilewati, dan ditaruh sebelum apa pun yang bisa dibaca. */}
      <Card className="!border-sky-500/30 !bg-sky-500/5">
        <div className="text-[11px] font-black uppercase tracking-wide text-sky-700">
          Read this before the text
        </div>
        <div className="mt-2 space-y-1.5">
          <Poin ikon="⚖️"><b>A report&rsquo;s worth depends on its grading.</b> Authentic, good and
            weak reports are judged by scholars examining the chain of narration — not by an app,
            and never by us.</Poin>
          <Poin ikon="✅"><b>Two collections stand apart.</b> Sahih al-Bukhari and Sahih Muslim are
            accepted as authentic at the level of the whole collection, so their text can be shown
            without a per-report label.</Poin>
          <Poin ikon="⚠️"><b>The four Sunan are mixed.</b> This provider does not carry their
            gradings, so they are marked differently and carry a warning wherever they appear.</Poin>
          <Poin ikon="🚫"><b>Nothing here is written by us,</b> and no grading is ever guessed.</Poin>
        </div>
      </Card>

      <Card>
        <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Serving this text</div>
        <p className="mt-1 text-[13px] font-bold text-ink">{PENYEDIA_HADIS.nama}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">{PENYEDIA_HADIS.catatan}</p>
        <a href={PENYEDIA_HADIS.situs} target="_blank" rel="noopener noreferrer"
          className="mt-1 inline-block text-[11px] font-bold text-brand underline">{PENYEDIA_HADIS.situs} →</a>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-600">
          <b>To check a grading</b> — {PENYEDIA_HADIS.periksaDerajat.nama} publishes gradings
          alongside each report.{' '}
          <a href={PENYEDIA_HADIS.periksaDerajat.situs} target="_blank" rel="noopener noreferrer"
            className="font-bold text-brand underline">{PENYEDIA_HADIS.periksaDerajat.situs} →</a>
        </p>
      </Card>

      {galat && (
        <Card className="!border-rose-500/30 !bg-rose-500/5">
          <p className="text-[12px] leading-relaxed text-rose-700">{galat}</p>
        </Card>
      )}

      {!kitab ? (
        <>
          <Bagian judul="Accepted as authentic in full"
            catatan={CATATAN_SAHIH}
            kitab={KITAB.filter((k) => k.derajat === 'sahih-kitab')}
            onPilih={setKitabId} />
          <Bagian judul="Mixed in grade — read as study"
            catatan={PERINGATAN_DERAJAT} peringatan
            kitab={KITAB.filter((k) => k.derajat !== 'sahih-kitab')}
            onPilih={setKitabId} />
        </>
      ) : (
        <>
          <button onClick={() => { if (buka !== null) setBuka(null); else setKitabId(null) }}
            className="flex items-center gap-1.5 text-[13px] font-bold text-brand hover:underline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {buka !== null ? 'All chapters' : 'All collections'}
          </button>

          <Card className={kitab.derajat === 'sahih-kitab' ? '' : '!border-amber-500/40 !bg-amber-500/5'}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-[15px] font-black text-ink">{kitab.nama}</h2>
                <p className="mt-0.5 text-[11px] text-neutral-500">{kitab.penyusun}</p>
              </div>
              <Lencana derajat={kitab.derajat} />
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-neutral-600">{kitab.tentang}</p>
            {kitab.derajat !== 'sahih-kitab' && (
              <p className="mt-2 rounded-lg bg-amber-500/10 p-2 text-[11px] font-semibold leading-relaxed text-amber-800">
                ⚠️ {PERINGATAN_DERAJAT}
              </p>
            )}
          </Card>

          {muat && <Card><p className="text-[13px] text-neutral-500">Loading…</p></Card>}

          {buka === null ? (
            <Card>
              <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
                Chapters {bab.length ? `(${bab.length})` : ''}
              </div>
              <div className="mt-2 space-y-1">
                {bab.map((b) => (
                  <button key={b.nomor} onClick={() => setBuka(b.nomor)}
                    className="flex w-full items-center gap-3 rounded-xl bg-white/60 p-2.5 text-left hover:bg-white/80">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-[12px] font-black text-brand-dark">
                      {b.nomor}
                    </span>
                    <span className="min-w-0 flex-1 text-[13px] font-bold text-ink">{b.nama}</span>
                  </button>
                ))}
              </div>
            </Card>
          ) : isi && (
            <>
              <Card>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] text-neutral-600">
                    <b>{isi.hadis.length}</b> reports · nos. {isi.dari}–{isi.sampai}
                  </div>
                  <button onClick={() => setTampilArab((x) => !x)} aria-pressed={tampilArab}
                    className={`rounded-lg px-2.5 py-1 text-[12px] font-bold ${
                      tampilArab ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                    Arabic
                  </button>
                </div>
                {isi.gagalSebagian.length > 0 && (
                  <p className="mt-2 text-[11px] leading-relaxed text-amber-700">
                    Requested but did not arrive: {isi.gagalSebagian.join(', ')}. Everything else
                    below came through intact.
                  </p>
                )}
              </Card>

              {isi.hadis.map((h) => (
                <Card key={h.nomor}>
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-brand-50 px-1.5 text-[10px] font-black text-brand-dark">
                      {h.nomor}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                      {isi.kitab.nama}
                    </span>
                    <span className="ml-auto"><Lencana derajat={isi.kitab.derajat} kecil /></span>
                  </div>
                  {tampilArab && h.arab && (
                    <p dir="rtl" lang="ar" className="mt-2 text-right text-[17px] leading-[2.1] text-ink">
                      {h.arab}
                    </p>
                  )}
                  <p className="mt-2 text-[13px] leading-relaxed text-neutral-700">{h.teks}</p>
                </Card>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}

function Lencana({ derajat, kecil }: { derajat: Kitab['derajat']; kecil?: boolean }) {
  const sahih = derajat === 'sahih-kitab'
  return (
    <span className={`shrink-0 rounded-full font-black uppercase tracking-wide ${
      kecil ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-1 text-[9px]'} ${
      sahih ? 'bg-emerald-500/15 text-emerald-800' : 'bg-amber-500/20 text-amber-900'}`}>
      {sahih ? 'Sahih collection' : 'Mixed grade'}
    </span>
  )
}

function Bagian({ judul, catatan, kitab, onPilih, peringatan }: {
  judul: string; catatan: string; kitab: Kitab[]
  onPilih: (id: string) => void; peringatan?: boolean
}) {
  return (
    <Card className={peringatan ? '!border-amber-500/40 !bg-amber-500/5' : ''}>
      <div className={`text-[11px] font-black uppercase tracking-wide ${
        peringatan ? 'text-amber-800' : 'text-emerald-800'}`}>{judul}</div>
      <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">{catatan}</p>
      <div className="mt-2.5 space-y-1.5">
        {kitab.map((k) => (
          <button key={k.id} onClick={() => onPilih(k.id)}
            className="block w-full rounded-xl bg-white/60 p-2.5 text-left hover:bg-white/80">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[13px] font-bold text-ink">{k.nama}</span>
              <Lencana derajat={k.derajat} kecil />
            </div>
            <span className="mt-0.5 block text-[10px] text-neutral-500">{k.penyusun}</span>
            <span className="mt-1 block text-[11px] leading-relaxed text-neutral-600">{k.tentang}</span>
          </button>
        ))}
      </div>
      <div className="mt-2">
        <Ringkas ikon="⚖️" judul="Why these are separated"
          anak={
            <div className="space-y-1.5">
              <Poin ikon="📗">A grading is a scholarly judgement about the chain of narration, not
                a property of the words themselves.</Poin>
              <Poin ikon="🧾">This provider carries text, not gradings — so the honest thing is to
                say which collections settle the question at the level of the book.</Poin>
              <Poin ikon="🙏">For anything you intend to act on, check the individual report with a
                qualified teacher or a source that publishes gradings.</Poin>
            </div>
          } />
      </div>
    </Card>
  )
}

/** Hanya pesan dari pemeriksaan keutuhan yang ditampilkan apa adanya. */
function pesan(e: Error): string {
  const m = e?.message ?? ''
  if (/nothing is shown/i.test(m)) return m
  return 'Could not reach the hadith provider. Nothing is stored on our side to fall back to.'
}

export default Hadis

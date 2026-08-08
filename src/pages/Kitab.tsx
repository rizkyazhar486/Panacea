import { useEffect, useState } from 'react'
import { Card, SectionTitle, Button } from '../components/ui'
import { Ringkas, Poin } from '../components/Ringkas'
import { IconShield } from '../components/icons'
import {
  daftarSurah, bacaSurah, renunganUntuk, penyediaSekarang, TAFSIR, TERJEMAHAN,
  TOTAL_SURAH, TOTAL_AYAT_HAFS,
  type Surah, type Ayat,
} from '../lib/kitab'

// ─────────────────────────────────────────────────────────────────────────────
// Scripture — pembaca kitab suci.
//
// Seluruh alasan di balik halaman ini ada di lib/kitab.ts. Satu hal diulang di
// sini karena menyangkut apa yang dilihat pengguna: SUMBER SELALU TERLIHAT.
// Bukan di halaman "tentang", melainkan di layar yang sama dengan teksnya,
// sehingga siapa pun bisa memeriksa sendiri apa yang sedang ia baca dan dari
// mana asalnya.
//
// Halaman ini juga menyatakan terus terang apa yang TIDAK dilakukannya —
// tidak menulis tafsir sendiri, dan tidak membuat klaim kecocokan dengan sains
// modern. Menyatakan batas kewenangan adalah bagian dari menghormati teksnya.
// ─────────────────────────────────────────────────────────────────────────────

export function Kitab() {
  const [surah, setSurah] = useState<Surah[]>([])
  const [buka, setBuka] = useState<number | null>(null)
  const [isi, setIsi] = useState<{ surah: Surah; ayat: Ayat[] } | null>(null)
  const [terjemahan, setTerjemahan] = useState(TERJEMAHAN[0].id)
  const [tafsirId, setTafsirId] = useState<string | undefined>(undefined)
  const [galat, setGalat] = useState('')
  const [muat, setMuat] = useState(false)
  // Dibaca ulang tiap render supaya selalu mencerminkan penyedia yang terakhir
  // benar-benar menjawab, bukan yang pertama dalam daftar.
  const p = penyediaSekarang()

  useEffect(() => {
    setMuat(true)
    daftarSurah()
      .then(setSurah)
      .catch((e: Error) => setGalat(e?.message?.startsWith('gagal_memuat')
        ? 'Could not reach the text provider. Check your connection — nothing is stored on our side to fall back to.'
        : e.message))
      .finally(() => setMuat(false))
  }, [])

  useEffect(() => {
    if (buka === null) { setIsi(null); return }
    setMuat(true); setGalat('')
    bacaSurah(buka, terjemahan, tafsirId)
      .then(setIsi)
      .catch((e: Error) => setGalat(e?.message?.startsWith('gagal_memuat')
        ? 'Could not load this surah.'
        : e.message))
      .finally(() => setMuat(false))
  }, [buka, terjemahan, tafsirId])

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      <SectionTitle icon={<IconShield />} title="Scripture"
        subtitle="Read from the source, with the source named" />

      {/* Ditaruh paling atas dan tidak bisa dilewati. */}
      <Card className="!border-sky-500/30 !bg-sky-500/5">
        <div className="text-[11px] font-black uppercase tracking-wide text-sky-700">
          How this page treats the text
        </div>
        <div className="mt-2 space-y-1.5">
          <Poin ikon="📖"><b>Nothing here is written by us.</b> Every letter is fetched from the
            provider named below and shown unaltered. This app never generates scripture.</Poin>
          <Poin ikon="🧾"><b>Commentary is attributed.</b> Where tafsir is shown, the scholar or
            work is named, so you know whose reading you are reading.</Poin>
          <Poin ikon="🚫"><b>No "scientific miracle" claims.</b> Matching verses to current science
            is rejected by many scholars and scientists alike — it makes revelation depend on
            findings that change every decade.</Poin>
          <Poin ikon="🕌"><b>This is a reader, not a teacher.</b> Questions of ruling and meaning
            belong with a qualified teacher in your own tradition.</Poin>
        </div>
      </Card>

      <Card>
        {/* Penyedia yang BENAR-BENAR melayani bacaan ini, bukan yang
            direncanakan. Bila suatu saat rantai cadangan dipakai, yang tampil
            di sini ikut berubah — pembaca tidak boleh tidak tahu ia sedang
            membaca dari mana. */}
        <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Serving this text</div>
        <p className="mt-1 text-[13px] font-bold text-ink">{p.penerbit}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">{p.catatan}</p>
        <a href={p.situs} target="_blank" rel="noopener noreferrer"
          className="mt-1 inline-block text-[11px] font-bold text-brand underline">
          {p.situs} →
        </a>
        <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-600"><b>Terms</b> — {p.syarat}</p>
        {/* Rantai asal ditampilkan penuh. Menyebut nama penyedia saja tidak
            cukup — yang menentukan sah atau tidaknya adalah dari mana penyedia
            itu sendiri memperoleh teksnya, dan apakah pembaca bisa memeriksanya. */}
        {p.provenansi && (
          <div className="mt-2.5 space-y-1.5">
            <Ringkas ikon="🔗" judul="Where this text comes from" bukaAwal
              anak={
                <div className="space-y-1.5">
                  <Poin ikon="📕"><b>Printed reference</b> — {p.provenansi.acuan}</Poin>
                  <Poin ikon="⛓️"><b>Chain</b> — {p.provenansi.rantai}</Poin>
                  <Poin ikon="🔍"><b>Verify it yourself</b> — {p.provenansi.caraPeriksa}</Poin>
                </div>
              } />
            <Ringkas ikon="🛡️" judul="What is checked before anything is shown"
              anak={
                <div className="space-y-1.5">
                  <Poin ikon="1️⃣">There must be exactly {TOTAL_SURAH} surahs.</Poin>
                  <Poin ikon="2️⃣">The ayah counts must total {TOTAL_AYAT_HAFS} — the count of the Hafs reading.</Poin>
                  <Poin ikon="3️⃣">Each surah must arrive with the exact number of ayat it declares, which catches truncation.</Poin>
                  <Poin ikon="4️⃣">Every ayah must contain Arabic script, with no Latin letters and no replacement characters.</Poin>
                  <Poin ikon="⚠️">If any check fails, nothing is displayed at all. These checks prove the text arrived intact — only a printed mushaf can prove it is correct.</Poin>
                </div>
              } />
          </div>
        )}
      </Card>

      {galat && (
        <Card className="!border-rose-500/30 !bg-rose-500/5">
          <p className="text-[12px] leading-relaxed text-rose-700">{galat}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
            The text is deliberately not bundled with the app. Shipping our own copy would mean
            shipping a version nobody verified — fetching it keeps the provider accountable for
            the text and keeps us out of the business of reproducing it.
          </p>
        </Card>
      )}

      {muat && <Card><p className="text-[13px] text-neutral-500">Loading…</p></Card>}

      {buka === null ? (
        <Card>
          <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
            Surahs {surah.length ? `(${surah.length})` : ''}
          </div>
          <div className="mt-2 space-y-1">
            {surah.map((s) => (
              <button key={s.nomor} onClick={() => setBuka(s.nomor)}
                className="flex w-full items-center gap-3 rounded-xl bg-white/60 p-2.5 text-left hover:bg-white/80">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-[12px] font-black text-brand-dark">
                  {s.nomor}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold text-ink">{s.nama}</span>
                  <span className="block text-[11px] text-neutral-500">{s.arti} · {s.jumlahAyat} ayat · {s.tempat}</span>
                </span>
                <span className="shrink-0 text-[15px] text-ink" dir="rtl">{s.namaArab}</span>
              </button>
            ))}
          </div>
        </Card>
      ) : (
        <>
          <button onClick={() => setBuka(null)}
            className="flex items-center gap-1.5 text-[13px] font-bold text-brand hover:underline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            All surahs
          </button>

          <Card>
            <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Translation</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {TERJEMAHAN.map((t) => (
                <button key={t.id} onClick={() => setTerjemahan(t.id)} aria-pressed={terjemahan === t.id}
                  className={`rounded-lg px-2.5 py-1 text-[12px] font-bold ${
                    terjemahan === t.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                  {t.nama}
                </button>
              ))}
            </div>
            <div className="mt-2.5 text-[10px] font-black uppercase tracking-wide text-neutral-500">Commentary</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <button onClick={() => setTafsirId(undefined)} aria-pressed={!tafsirId}
                className={`rounded-lg px-2.5 py-1 text-[12px] font-bold ${
                  !tafsirId ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>None</button>
              {TAFSIR.map((t) => (
                <button key={t.id} onClick={() => setTafsirId(t.id)} aria-pressed={tafsirId === t.id}
                  className={`rounded-lg px-2.5 py-1 text-[12px] font-bold ${
                    tafsirId === t.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                  {t.nama}
                </button>
              ))}
            </div>
          </Card>

          {isi && (
            <>
              <Card>
                <div className="text-center">
                  <div className="text-[20px] font-black text-ink" dir="rtl">{isi.surah.namaArab}</div>
                  <div className="mt-0.5 text-[13px] font-bold text-ink">{isi.surah.nama}</div>
                  <div className="text-[11px] text-neutral-500">{isi.surah.arti} · {isi.surah.jumlahAyat} ayat</div>
                </div>
              </Card>

              {isi.ayat.map((a) => (
                <Card key={a.nomor}>
                  <div className="flex items-start gap-2">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-[10px] font-black text-brand-dark">
                      {a.nomor}
                    </span>
                    <p dir="rtl" lang="ar"
                      className="min-w-0 flex-1 text-right text-[20px] leading-[2.1] text-ink">
                      {a.arab}
                    </p>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">{a.terjemahan}</p>
                  <div className="mt-2 space-y-1.5">
                    {a.tafsir && (
                      <Ringkas ikon="🧾" judul={`Commentary — ${a.tafsir.oleh}`}
                        anak={<p dir="rtl" lang="ar" className="text-right leading-[2] text-[15px]">{a.tafsir.teks}</p>} />
                    )}
                    {/* Renungan, bukan tafsir. Bedanya dinyatakan pada judulnya. */}
                    <Ringkas ikon="🤲" judul="A question to sit with (not commentary)"
                      anak={<p className="leading-relaxed">{renunganUntuk(isi.surah.nomor, a.nomor)}</p>} />
                  </div>
                </Card>
              ))}
            </>
          )}
        </>
      )}

      <Ringkas ikon="📚" judul="Other traditions"
        anak={
          <div className="space-y-1.5">
            <Poin ikon="✝️"><b>Bible</b> and <b>Tanakh</b> — readers are planned using the same
              approach: fetched from a named provider, never written by us.</Poin>
            <Poin ikon="🕉️"><b>Vedas, Pali Canon, Confucian texts</b> — short introductions with
              pointers to primary sources, rather than partial text we cannot verify.</Poin>
            <Poin ikon="⚖️">Including a tradition here is not a claim about which is true. It is a
              reader for people who already have one.</Poin>
          </div>
        } />
    </div>
  )
}

export default Kitab

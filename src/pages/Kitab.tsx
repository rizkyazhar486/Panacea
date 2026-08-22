import { useEffect, useState } from 'react'
import { Prosa } from '../components/Prosa'
import { Card, SectionTitle, Button } from '../components/ui'
import { Ringkas, Poin } from '../components/Ringkas'
import { IconShield } from '../components/icons'
import {
  daftarSurah, bacaSurah, renunganUntuk, penyediaSekarang, TAFSIR, TERJEMAHAN, QARI,
  TOTAL_SURAH, TOTAL_AYAT_HAFS, bacaAlkitab, bacaTanakh, PENGANTAR, SUMBER,
  bacaTradisi,
  type Surah, type Bacaan, type HasilBaca, type Pengantar,
} from '../lib/kitab'
import { usePemutarAyat, TombolPutar } from '../components/PemutarAyat'
import { Field, inputClass } from '../components/ui'

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

type Tab = 'quran' | 'bible' | 'tanakh' | 'lain'

export function Kitab() {
  const [tab, setTab] = useState<Tab>('quran')
  const [surah, setSurah] = useState<Surah[]>([])
  const [buka, setBuka] = useState<number | null>(null)
  const [isi, setIsi] = useState<HasilBaca | null>(null)
  const [terjemahan, setTerjemahan] = useState(TERJEMAHAN[0].id)
  const [tafsirId, setTafsirId] = useState<string | undefined>(TAFSIR[0].id)
  // Alih aksara menyala secara bawaan. Sebagian besar pengguna aplikasi ini
  // tidak membaca aksara Arab, dan tanpa alih aksara mereka hanya bisa MELIHAT
  // ayat tanpa bisa melafalkannya — jadi bawaan yang benar adalah menyala.
  const [latin, setLatin] = useState(true)
  const [qari, setQari] = useState<string | undefined>(undefined)
  const [galat, setGalat] = useState('')
  const [muat, setMuat] = useState(false)
  // Dibaca ulang tiap render supaya selalu mencerminkan penyedia yang terakhir
  // benar-benar menjawab, bukan yang pertama dalam daftar.
  const p = penyediaSekarang()

  // Daftar trek dibangun dari ayat yang benar-benar membawa alamat rekaman.
  // Bila edisi qari gagal diambil, daftarnya kosong dan seluruh kendali putar
  // hilang dengan sendirinya — tidak ada tombol yang menjanjikan sesuatu yang
  // tidak ada di baliknya.
  const audio = (isi?.ayat ?? [])
    .filter((a): a is typeof a & { audio: string } => !!a.audio)
    .map((a) => ({ nomor: a.nomor, audio: a.audio }))
  const { main, putar, berhenti, galat: galatAudio } = usePemutarAyat(audio)

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
    bacaSurah(buka, terjemahan, tafsirId, { latin, qari })
      .then(setIsi)
      .catch((e: Error) => setGalat(e?.message?.startsWith('gagal_memuat')
        ? 'Could not load this surah.'
        : e.message))
      .finally(() => setMuat(false))
  }, [buka, terjemahan, tafsirId, latin, qari])

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      <SectionTitle icon={<IconShield />} title="Scripture"
        subtitle="Dibaca dari sumbernya, dan sumbernya disebutkan" />

      <div className="flex flex-wrap gap-1.5">
        {([['quran', 'Qur’an'], ['bible', 'Bible'], ['tanakh', 'Torah / Tanakh'], ['lain', 'Other traditions']] as const)
          .map(([id, l]) => (
            <button key={id} onClick={() => setTab(id)} aria-pressed={tab === id}
              className={`rounded-lg px-2.5 py-1.5 text-[12px] font-bold ${
                tab === id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>{l}</button>
          ))}
      </div>

      {/* Hadis dan waktu salat berdiri sebagai halaman sendiri, bukan tab.
          Keduanya punya persoalannya masing-masing yang perlu dijelaskan di
          bagian atas halamannya — derajat riwayat, dan metode hisab — dan
          penjelasan itu tidak akan terbaca bila terkubur sebagai tab kelima. */}
      <div className="flex flex-wrap gap-1.5">
        <a href="#/hadith"
          className="rounded-lg bg-neutral-100 px-2.5 py-1.5 text-[12px] font-bold text-neutral-600 hover:bg-neutral-200">
          📜 Hadith →
        </a>
        <a href="#/prayer-times"
          className="rounded-lg bg-neutral-100 px-2.5 py-1.5 text-[12px] font-bold text-neutral-600 hover:bg-neutral-200">
          🕌 Prayer times →
        </a>
      </div>

      {tab === 'bible' && <Petikan jenis="bible" />}
      {tab === 'tanakh' && <Petikan jenis="tanakh" />}
      {tab === 'lain' && <Lain />}
      {tab !== 'quran' ? null : (
      <>

      {/* Ditaruh paling atas dan tidak bisa dilewati. */}
      <Card className="!border-sky-500/30 !bg-sky-500/5">
        <div className="text-[11px] font-black uppercase tracking-wide text-sky-700">
          How this page treats the text
        </div>
        <div className="mt-2 space-y-1.5">
          <Poin ikon="📖"><b>Tidak ada satu pun di sini yang kami tulis sendiri.</b> Every letter is fetched from the
            provider named below and shown unaltered. This app never generates scripture.</Poin>
          <Poin ikon="🧾"><b>Tafsir disebutkan penulisnya.</b> Where tafsir is shown, the scholar or
            work is named, so you know whose reading you are reading.</Poin>
          <Poin ikon="🚫"><b>No "scientific miracle" claims.</b> Matching verses to current science
            is rejected by many scholars and scientists alike — it makes revelation depend on
            findings that change every decade.</Poin>
          <Poin ikon="🕌"><b>Ini pembaca teks, bukan guru.</b> Questions of ruling and meaning
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
                  <Poin ikon="3️⃣">Tiap surah harus datang dengan jumlah ayat persis seperti yang dinyatakannya — inilah yang menangkap teks yang terpotong.</Poin>
                  <Poin ikon="4️⃣">Tiap ayat harus memuat aksara Arab, tanpa huruf Latin dan tanpa aksara pengganti.</Poin>
                  <Poin ikon="⚠️">Bila satu pemeriksaan saja gagal, tidak ada yang ditampilkan sama sekali. Pemeriksaan ini membuktikan teksnya sampai utuh — hanya mushaf cetak yang dapat membuktikan teksnya benar.</Poin>
                </div>
              } />
          </div>
        )}
      </Card>

      {galat && (
        <Card className="!border-rose-500/30 !bg-rose-500/5">
          <p className="text-[12px] leading-relaxed text-rose-700">{galat}</p>
          <Prosa kelas="mt-1 text-[11px] leading-relaxed text-neutral-600">Teksnya sengaja tidak disertakan di dalam aplikasi. Menyertakan salinan sendiri berarti menyebarkan versi yang tidak diperiksa siapa pun — mengambilnya dari penyedia membuat penyedia itulah yang bertanggung jawab atas teksnya, dan menjauhkan kami dari perkara memperbanyaknya.</Prosa>
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
            <div className="mt-3 text-[10px] font-black uppercase tracking-wide text-neutral-500">
              How to read it aloud
            </div>
            <button onClick={() => setLatin((x) => !x)} aria-pressed={latin}
              className={`mt-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-bold ${
                latin ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>
              🔤 Latin transliteration
            </button>
            <Prosa kelas="mt-1 text-[10px] leading-relaxed text-neutral-500">Panduan pelafalan, bukan terjemahan, dan sama sekali bukan pengganti teks Arabnya. Diambil dari penyedia seperti seluruh isi halaman ini.</Prosa>

            <div className="mt-3 text-[10px] font-black uppercase tracking-wide text-neutral-500">Recitation</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <button onClick={() => setQari(undefined)} aria-pressed={!qari}
                className={`rounded-lg px-2.5 py-1 text-[12px] font-bold ${
                  !qari ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>Off</button>
              {QARI.map((q) => (
                <button key={q.id} onClick={() => setQari(q.id)} aria-pressed={qari === q.id}
                  className={`rounded-lg px-2.5 py-1 text-[12px] font-bold ${
                    qari === q.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                  {q.nama}
                </button>
              ))}
            </div>
            {qari && (
              <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">
                {QARI.find((q) => q.id === qari)?.catatan} Playing one ayah continues into the next
                until you pause.
              </p>
            )}

            <div className="mt-3 text-[10px] font-black uppercase tracking-wide text-neutral-500">
              Commentary (tafsir)
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <button onClick={() => setTafsirId(undefined)} aria-pressed={!tafsirId}
                className={`rounded-lg px-2.5 py-1 text-[12px] font-bold ${
                  !tafsirId ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>None</button>
              {TAFSIR.map((t) => (
                <button key={t.id} onClick={() => setTafsirId(t.id)} aria-pressed={tafsirId === t.id}
                  className={`rounded-lg px-2.5 py-1 text-[12px] font-bold ${
                    tafsirId === t.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                  {t.nama.split(' — ')[0]}
                  <span className={`ml-1 text-[10px] font-black uppercase ${
                    tafsirId === t.id ? 'text-white/80' : 'text-neutral-600'}`}>{t.bahasa}</span>
                </button>
              ))}
            </div>
            {tafsirId && (
              <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">
                {TAFSIR.find((t) => t.id === tafsirId)?.tentang}
              </p>
            )}
            <div className="mt-2">
              <Ringkas ikon="💚" judul="Why commentary matters here"
                anak={
                  <div className="space-y-1.5">
                    <Poin ikon="🧠">Reading a verse you do not understand can settle you for a
                      moment. Understanding it gives you something you can actually hold on to when
                      things are hard — which is the whole reason commentary sits in a health app.</Poin>
                    <Poin ikon="🎓">And that is exactly why the meaning must come from scholars,
                      never from us. Composing a soothing "meaning" for a verse would bend
                      revelation into motivation, and not one sentence of that is done here.</Poin>
                    <Poin ikon="🩺">If you are in real distress, a commentary is not a clinician.
                      Both are worth having, and neither replaces the other.</Poin>
                  </div>
                } />
            </div>
          </Card>

          {isi && isi.gagalSebagian.length > 0 && (
            <Card className="!border-amber-500/40 !bg-amber-500/5">
              <p className="text-[12px] leading-relaxed text-amber-800">
                <b>Diminta tetapi tidak sampai:</b> {isi.gagalSebagian.join(', ')}. The verses and
                translation below came through intact and were checked; only the missing parts are
                absent. They are named here rather than left blank, so you are never looking at a
                page that quietly dropped something you asked for.
              </p>
            </Card>
          )}

          {isi && (
            <>
              {audio.length > 0 && (
                <Card className="!border-brand/30 !bg-brand-50/50">
                  <div className="flex items-center gap-3">
                    <TombolPutar aktif={main !== null}
                      onKlik={() => (main !== null ? berhenti() : putar(audio[0].nomor))}
                      label={main !== null ? 'Pause recitation' : 'Play the whole surah'} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-black text-ink">
                        {main !== null ? `Playing ayah ${main}` : 'Play the whole surah'}
                      </div>
                      <div className="truncate text-[10px] text-neutral-500">
                        {QARI.find((q) => q.id === qari)?.nama}
                      </div>
                    </div>
                  </div>
                  {galatAudio && <p className="mt-1.5 text-[11px] text-rose-700">{galatAudio}</p>}
                </Card>
              )}

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
                    {a.audio && (
                      <TombolPutar aktif={main === a.nomor} onKlik={() => putar(a.nomor)}
                        label={main === a.nomor ? `Pause ayah ${a.nomor}` : `Play ayah ${a.nomor}`} />
                    )}
                  </div>

                  {/* Alih aksara diberi gaya yang JELAS BERBEDA dari ayatnya —
                      miring, lebih kecil, warna lebih redup — supaya tidak
                      pernah terbaca sebagai teks Al-Qur'an itu sendiri. */}
                  {a.latin && (
                    <p lang="ar-Latn"
                      className="mt-2 border-l-2 border-brand/25 pl-2.5 text-[12px] italic leading-relaxed text-neutral-500">
                      {a.latin}
                    </p>
                  )}

                  <p className="mt-2 text-[13px] leading-relaxed text-neutral-700">{a.terjemahan}</p>

                  <div className="mt-2 space-y-1.5">
                    {a.tafsir && (
                      <Ringkas ikon="🧾" judul={`Commentary — ${a.tafsir.oleh}`}
                        anak={
                          a.tafsir.bahasa === 'Arabic'
                            ? <p dir="rtl" lang="ar" className="text-right text-[15px] leading-[2]">{a.tafsir.teks}</p>
                            : <p className="text-[13px] leading-relaxed">{a.tafsir.teks}</p>
                        } />
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

      </>
      )}
    </div>
  )
}

/**
 * Pembaca petikan untuk Alkitab dan Tanakh.
 *
 * Berbentuk pencarian rujukan, bukan daftar seluruh kitab, karena jumlah kitab
 * BERBEDA antar-kanon — Protestan, Katolik, dan Ortodoks tidak sama. Menampilkan
 * satu daftar berarti diam-diam memilih satu kanon dan menyebutnya "Alkitab".
 * Perbedaan itu disebut di layar, bukan disembunyikan.
 */
function Petikan({ jenis }: { jenis: 'bible' | 'tanakh' }) {
  const [rujukan, setRujukan] = useState(jenis === 'bible' ? 'John 1:1-5' : 'Genesis 1:1')
  const [hasil, setHasil] = useState<{ utama: Bacaan; kedua?: Bacaan } | null>(null)
  const [galat, setGalat] = useState('')
  const [muat, setMuat] = useState(false)
  const sumber = SUMBER[jenis]

  async function cari() {
    setMuat(true); setGalat(''); setHasil(null)
    try {
      if (jenis === 'bible') {
        setHasil({ utama: await bacaAlkitab(rujukan) })
      } else {
        const r = await bacaTanakh(rujukan)
        setHasil({ utama: r.ibrani, kedua: r.terjemahan })
      }
    } catch (e) {
      const m = (e as Error)?.message ?? ''
      // Hanya pesan dari pemeriksaan keutuhan kita sendiri yang ditampilkan apa
      // adanya; galat jaringan mentah seperti "Failed to fetch" tidak berarti
      // apa-apa bagi pembaca dan justru terlihat seperti aplikasi yang rusak.
      setGalat(/nothing is shown/i.test(m)
        ? m
        : 'Could not reach the provider, or that reference was not found. Nothing is shown.')
    } finally { setMuat(false) }
  }

  return (
    <>
      <Card>
        <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Serving this text</div>
        <p className="mt-1 text-[13px] font-bold text-ink">{sumber.penerbit}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">{sumber.catatan}</p>
        <a href={sumber.situs} target="_blank" rel="noopener noreferrer"
          className="mt-1 inline-block text-[11px] font-bold text-brand underline">{sumber.situs} →</a>
        <div className="mt-2.5">
          <Ringkas ikon="⚖️" judul="Why there is no full book list here"
            anak={
              <div className="space-y-1.5">
                <Poin ikon="📚">The number of books differs between canons — Protestant, Catholic,
                  and Orthodox do not agree. Showing one list would quietly pick one and call it
                  the whole.</Poin>
                <Poin ikon="🔤">Translation is named on every passage, because different
                  translations can carry different meaning.</Poin>
                <Poin ikon="🛡️">Passages are checked before display: not empty, correct script,
                  no corrupted encoding, and never a web page returned in place of text.</Poin>
              </div>
            } />
        </div>
      </Card>

      <Card>
        <Field label={jenis === 'bible' ? 'Reference (e.g. John 1:1-5)' : 'Reference (e.g. Genesis 1:1)'}>
          <input className={inputClass} value={rujukan} aria-label="Reference"
            onChange={(e) => setRujukan(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void cari() }} />
        </Field>
        <div className="mt-2"><Button onClick={() => void cari()} disabled={muat}>
          {muat ? 'Loading…' : 'Read'}</Button></div>
      </Card>

      {galat && (
        <Card className="!border-rose-500/30 !bg-rose-500/5">
          <p className="text-[12px] leading-relaxed text-rose-700">{galat}</p>
        </Card>
      )}

      {hasil && (
        <Card>
          <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
            {hasil.utama.rujukan} · {hasil.utama.edisi}
          </div>
          <p className={`mt-2 text-[15px] leading-relaxed text-ink ${jenis === 'tanakh' ? 'text-right' : ''}`}
            dir={jenis === 'tanakh' ? 'rtl' : 'ltr'} lang={jenis === 'tanakh' ? 'he' : undefined}>
            {hasil.utama.teks}
          </p>
          {hasil.kedua && (
            <>
              <div className="mt-3 text-[10px] font-black uppercase tracking-wide text-neutral-500">
                {hasil.kedua.edisi}
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">{hasil.kedua.teks}</p>
            </>
          )}
        </Card>
      )}
    </>
  )
}

/** Tradisi yang teksnya tidak dimuat — keterangan, bukan kutipan. */
function Lain() {
  return (
    <>
      <Card className="!border-sky-500/30 !bg-sky-500/5">
        <Prosa kelas="text-[12px] leading-relaxed text-neutral-600">Bila sebuah tradisi punya sumber yang dapat kami sebut namanya dan kami panggil, ia tampil di sini persis seperti Alkitab dan Tanakh — diambil, diperiksa, dan disebutkan asalnya. Bila tidak, yang Anda dapat adalah keterangan beserta penunjuk ke arsip yang sepatutnya, dan tidak ada satu pun kutipan dari ingatan untuk menambal kekosongan itu. Penolakan itu tidak melemah hanya karena tradisinya berganti.</Prosa>
      </Card>
      {PENGANTAR.map((x) => <TradisiLain key={x.tradisi} x={x} />)}
      <Card>
        <p className="text-[11px] leading-relaxed text-neutral-500">
          Including a tradition here is not a claim about which is true. This is a reader for
          people who already have one.
        </p>
      </Card>
    </>
  )
}

/**
 * Satu tradisi lain: pengantar, dan pembaca bila ada penyedia yang bisa
 * disebut namanya.
 *
 * Yang tidak punya penyedia TIDAK diberi kotak pencarian yang tidak akan
 * pernah menghasilkan apa-apa. Sebuah kolom yang selalu gagal lebih buruk
 * daripada tidak ada kolom sama sekali: ia menjanjikan sesuatu, lalu
 * membiarkan pengguna menyalahkan dirinya sendiri karena mengetik salah.
 */
function TradisiLain({ x }: { x: Pengantar }) {
  const [rujukan, setRujukan] = useState(x.baca?.contoh[0]?.rujukan ?? '')
  const [hasil, setHasil] = useState<Bacaan[] | null>(null)
  const [galat, setGalat] = useState('')
  const [muat, setMuat] = useState(false)

  async function cari(r = rujukan) {
    if (!x.baca || !r.trim()) return
    setMuat(true); setGalat(''); setHasil(null)
    try {
      setHasil(await bacaTradisi(x.tradisi, r.trim()))
    } catch (e) {
      const m = (e as Error)?.message ?? ''
      setGalat(/nothing is shown|returned nothing/i.test(m)
        ? m
        : `Could not reach ${x.baca.penyedia}, or that reference was not found. Nothing is shown.`)
    } finally { setMuat(false) }
  }

  return (
    <Card>
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden="true">{x.ikon}</span>
        <h3 className="text-[15px] font-black text-ink">{x.nama}</h3>
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-600">{x.ringkas}</p>
      <div className="mt-2 space-y-1">
        {x.susunan.map((y) => <Poin key={y} ikon="•">{y}</Poin>)}
      </div>

      {x.baca ? (
        <div className="mt-3 rounded-xl bg-white/50 p-2.5">
          <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
            Read a passage · {x.baca.penyedia}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {x.baca.contoh.map((c) => (
              <button key={c.rujukan} onClick={() => { setRujukan(c.rujukan); void cari(c.rujukan) }}
                className="rounded-lg bg-neutral-100 px-2.5 py-1 text-[11px] font-bold text-neutral-600 hover:bg-neutral-200">
                {c.label}
              </button>
            ))}
          </div>
          <div className="mt-2">
            <Field label="Reference">
              <input className={inputClass} value={rujukan} aria-label={`Reference for ${x.nama}`}
                onChange={(e) => setRujukan(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void cari() }} />
            </Field>
          </div>
          <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">{x.baca.petunjuk}</p>
          <div className="mt-2"><Button onClick={() => void cari()} disabled={muat}>
            {muat ? 'Loading…' : 'Read'}</Button></div>

          {galat && <p className="mt-2 text-[11px] leading-relaxed text-rose-700">{galat}</p>}
          {hasil?.map((b, i) => (
            <div key={b.edisi + i} className="mt-2.5 border-t border-black/5 pt-2">
              <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
                {b.rujukan} · {b.edisi}
              </div>
              <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-ink">{b.teks}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-xl bg-amber-500/10 p-2.5 text-[11px] leading-relaxed text-amber-800">
          <b>Sengaja tidak ada pembaca langsung di sini.</b> The archives below are good to read, but none of
          them offers an interface we can call while still naming the edition and editor for each
          passage. Showing this text without being able to say which edition it came from would be
          showing text of unknown origin — the one thing this page will not do.
        </p>
      )}

      <div className="mt-2 text-[10px] font-black uppercase tracking-wide text-neutral-500">
        Where to read it properly
      </div>
      <div className="mt-1 space-y-0.5">
        {x.sumberUtama.map((sx) => (
          <a key={sx.situs} href={sx.situs} target="_blank" rel="noopener noreferrer"
            className="block text-[11px] font-bold text-brand underline">{sx.nama} →</a>
        ))}
      </div>
    </Card>
  )
}

export default Kitab

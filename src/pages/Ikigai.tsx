import { useEffect, useState } from 'react'
import { simpanTeks } from '../lib/unduh'
import { hariIni } from '../lib/tanggal'
import { Card, SectionTitle, Button, Field } from '../components/ui'
import { IconSparkle, IconHeart } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Ikigai & Legacy Letter — a structured "sense of purpose" exercise. Purpose in
// life is a validated predictor of lower all-cause mortality (independent of
// other risk factors), which is why the Longevity Center already tracks it as
// a checkbox. This page gives it real structure instead of a single tick box:
// the classic four-circle Ikigai map, plus a guided legacy letter you can
// revisit and re-download. Pure local reflection — no AI, no external API,
// nothing sent anywhere.
// ─────────────────────────────────────────────────────────────────────────────

interface IkigaiData {
  love: string; goodAt: string; worldNeeds: string; paidFor: string
  mattersMost: string; rememberedFor: string; adviceToFuture: string; habitToKeep: string
}
const DEF: IkigaiData = { love: '', goodAt: '', worldNeeds: '', paidFor: '', mattersMost: '', rememberedFor: '', adviceToFuture: '', habitToKeep: '' }
const KEY = 'pmd_ikigai_v1'

function load(): IkigaiData {
  try { return { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return DEF }
}

export function Ikigai() {
  const [d, setD] = useState<IkigaiData>(load)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(d)) } catch { /* ignore */ }
      setSaved(true)
      const hide = setTimeout(() => setSaved(false), 1500)
      return () => clearTimeout(hide)
    }, 500)
    return () => clearTimeout(t)
  }, [d])

  const set = <K extends keyof IkigaiData>(k: K, v: string) => setD((s) => ({ ...s, [k]: v }))

  const filled = [d.love, d.goodAt, d.worldNeeds, d.paidFor].filter((s) => s.trim()).length
  const passion = d.love.trim() && d.goodAt.trim()
  const mission = d.love.trim() && d.worldNeeds.trim()
  const vocation = d.worldNeeds.trim() && d.paidFor.trim()
  const profession = d.goodAt.trim() && d.paidFor.trim()

  function downloadLetter() {
    const date = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    const lines = [
      `MY LEGACY LETTER`,
      `Written ${date}`,
      '',
      d.mattersMost.trim() && `WHAT MATTERS MOST TO ME\n${d.mattersMost.trim()}\n`,
      d.rememberedFor.trim() && `WHAT I WANT TO BE REMEMBERED FOR\n${d.rememberedFor.trim()}\n`,
      d.adviceToFuture.trim() && `ADVICE TO MY FUTURE SELF\n${d.adviceToFuture.trim()}\n`,
      d.habitToKeep.trim() && `ONE HABIT I WANT TO KEEP FOR DECADES\n${d.habitToKeep.trim()}\n`,
      filled === 4 && `MY IKIGAI\nWhat I love: ${d.love.trim()}\nWhat I'm good at: ${d.goodAt.trim()}\nWhat the world needs: ${d.worldNeeds.trim()}\nWhat I can be paid for: ${d.paidFor.trim()}\n`,
    ].filter(Boolean).join('\n')
    void simpanTeks(lines, `legacy-letter-${hariIni()}.txt`, 'text/plain;charset=utf-8', 'Legacy Letter')
  }

  const hasLetterContent = [d.mattersMost, d.rememberedFor, d.adviceToFuture, d.habitToKeep].some((s) => s.trim())

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconSparkle size={20} />} title="Ikigai & Surat Warisan" subtitle="Perenungan tersusun tentang tujuan hidup — faktor umur panjang yang tervalidasi, bukan sekadar suasana hati" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Rasa memiliki tujuan hidup yang jelas berkaitan dengan angka kematian keseluruhan yang lebih
          rendah pada kajian jangka panjang, terlepas dari faktor kesehatan lainnya. Halaman ini
          mewujudkannya menjadi sesuatu yang nyata: peta <b>Ikigai</b> empat lingkaran yang klasik, dan
          <b>surat warisan</b> yang Anda tulis untuk diri sendiri. Semuanya tinggal di perangkat ini —
          tidak dikirim ke mana pun dan tidak diperlihatkan kepada siapa pun kecuali Anda sendiri yang
          mengunduhnya.
        </p>
        {saved && <p className="mt-2 text-[11px] font-semibold text-brand-dark">Tersimpan di perangkat ini ✓</p>}
      </Card>

      <Card className="!p-5">
        <div className="text-sm font-black uppercase tracking-wide text-neutral-500">Peta Ikigai</div>
        <p className="mt-1 text-[12px] text-neutral-500">Isi sebanyak yang Anda bisa — satu kalimat jujur untuk masing-masing sudah cukup.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="What I love"><textarea className={taClass} rows={2} value={d.love} onChange={(e) => set('love', e.target.value)} placeholder="Kegiatan yang membuat Anda lupa waktu" /></Field>
          <Field label="What I'm good at"><textarea className={taClass} rows={2} value={d.goodAt} onChange={(e) => set('goodAt', e.target.value)} placeholder="Keterampilan yang diakui orang lain pada Anda" /></Field>
          <Field label="Yang dibutuhkan dunia"><textarea className={taClass} rows={2} value={d.worldNeeds} onChange={(e) => set('worldNeeds', e.target.value)} placeholder="Masalah yang ingin Anda pecahkan" /></Field>
          <Field label="Yang dapat dibayar orang kepada saya"><textarea className={taClass} rows={2} value={d.paidFor} onChange={(e) => set('paidFor', e.target.value)} placeholder="Keterampilan yang benar-benar berguna bagi orang lain" /></Field>
        </div>

        {filled >= 2 && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Overlap label="Passion" active={!!passion} hint="love + skill" />
            <Overlap label="Mission" active={!!mission} hint="love + need" />
            <Overlap label="Vocation" active={!!vocation} hint="need + pay" />
            <Overlap label="Profession" active={!!profession} hint="skill + pay" />
          </div>
        )}
        {filled === 4 && (
          <div className="mt-4 rounded-2xl bg-brand-50 p-4 text-[13px] leading-relaxed text-brand-dark">
            <b>Ikigai Anda, dalam satu kalimat:</b> I find purpose in <i>{d.love.trim().toLowerCase()}</i>,
            using my strength in <i>{d.goodAt.trim().toLowerCase()}</i> to address <i>{d.worldNeeds.trim().toLowerCase()}</i>,
            in a way that can sustain me through <i>{d.paidFor.trim().toLowerCase()}</i>.
          </div>
        )}
      </Card>

      <Card className="!p-5">
        <div className="text-sm font-black uppercase tracking-wide text-neutral-500">Legacy letter</div>
        <p className="mt-1 text-[12px] text-neutral-500">Surat pendek untuk diri Anda di masa depan — bacalah dan perbarui kapan saja.</p>
        <div className="mt-3 space-y-3">
          <Field label="Yang paling berarti bagi saya"><textarea className={taClass} rows={2} value={d.mattersMost} onChange={(e) => set('mattersMost', e.target.value)} /></Field>
          <Field label="Yang ingin dikenang dari saya"><textarea className={taClass} rows={2} value={d.rememberedFor} onChange={(e) => set('rememberedFor', e.target.value)} /></Field>
          <Field label="Pesan untuk diri saya kelak"><textarea className={taClass} rows={2} value={d.adviceToFuture} onChange={(e) => set('adviceToFuture', e.target.value)} /></Field>
          <Field label="Satu kebiasaan yang ingin saya jaga puluhan tahun"><textarea className={taClass} rows={2} value={d.habitToKeep} onChange={(e) => set('habitToKeep', e.target.value)} /></Field>
        </div>
        <Button className="mt-4" onClick={downloadLetter} disabled={!hasLetterContent && filled < 4}>
          <IconHeart size={16} /> Download my letter (.txt)
        </Button>
      </Card>
    </div>
  )
}

function Overlap({ label, active, hint }: { label: string; active: boolean; hint: string }) {
  return (
    <div className={`rounded-xl border p-2.5 text-center transition-colors ${active ? 'border-brand/30 bg-brand-50 text-brand-dark' : 'border-neutral-100 bg-neutral-50 text-neutral-500'}`}>
      <div className="text-xs font-black">{label}</div>
      <div className="text-[10px]">{hint}</div>
    </div>
  )
}

const taClass = 'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors duration-200 placeholder:text-neutral-500 focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none'

export default Ikigai

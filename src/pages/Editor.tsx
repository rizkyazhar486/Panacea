import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore, uid } from '../lib/store'
import { Card, SectionTitle, Button, Field, inputClass, Badge } from '../components/ui'
import { IconBook, IconUpload, IconScissors, IconCheck, IconSparkle } from '../components/icons'
import { verifyMaterial } from '../lib/ai'
import type { Material, MaterialCategory, ExamTrack } from '../lib/types'

export function Editor() {
  const { state, account, uploadMaterial, setMaterialAIReview } = useStore()
  const [title, setTitle] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [category, setCategory] = useState<MaterialCategory>('Catatan')
  const [exam, setExam] = useState<ExamTrack>('UKMPPD')
  const [price, setPrice] = useState(6)
  const [body, setBody] = useState('')
  const [status, setStatus] = useState('')
  const taRef = useRef<HTMLTextAreaElement>(null)

  function cutSelection() {
    const ta = taRef.current
    if (!ta) return
    const { selectionStart: s, selectionEnd: e } = ta
    if (s === e) return
    setBody(body.slice(0, s) + body.slice(e))
  }

  async function submit() {
    if (!title.trim() || !body.trim()) return
    const m: Material = {
      id: uid(),
      title: title.trim(),
      description: body.trim().slice(0, 160) + (body.length > 160 ? '…' : ''),
      category,
      exam,
      specialty: specialty.trim() || 'General',
      authorId: account?.email ?? state.currentUserId,
      authorName: account?.name ?? 'Author',
      fileType: 'Word',
      fileName: title.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 30) + '.docx',
      priceTokens: Number(price) || 0,
      status: 'pending-ai',
      createdAt: new Date().toISOString(),
      downloads: 0,
      rating: 0,
    }
    uploadMaterial(m)
    setStatus('Sent to Claude AI verification…')
    const review = await verifyMaterial(state.settings, m)
    setMaterialAIReview(m.id, review)
    setStatus(review.verdict === 'approved' ? 'Passed AI ✓ — awaiting Subspecialist/Professor verifier.' : 'AI requested revisions.')
    setTitle(''); setBody(''); setSpecialty('')
  }

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle
          icon={<IconBook size={20} />}
          title="Write Medical Material / Notes"
          subtitle="Write, edit, trim, then upload — passed on to a verifier"
          right={
            <Link to="/my-materials"><Button variant="outline">My Materials →</Button></Link>
          }
        />
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Title"><input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          <Field label="Specialty / Topic"><input className={inputClass} value={specialty} onChange={(e) => setSpecialty(e.target.value)} /></Field>
          <Field label="Category">
            <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as MaterialCategory)}>
              {(['Catatan', 'Materi', 'Jurnal', 'Artikel'] as MaterialCategory[]).map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Exam Track">
            <select className={inputClass} value={exam} onChange={(e) => setExam(e.target.value as ExamTrack)}>
              {(['USMLE', 'UKMPPD', 'Umum'] as ExamTrack[]).map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      <Card>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Material content (editor)</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={cutSelection}><IconScissors size={14} /> Cut selection</Button>
            <span className="text-xs text-neutral-400">{body.length} characters</span>
          </div>
        </div>
        <textarea
          ref={taRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          placeholder="Write your notes/journal here… select text then 'Cut selection' to trim."
          className="w-full resize-y rounded-xl border border-neutral-200 p-3 font-mono text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="w-32">
            <Field label="Price (PNC)"><input className={inputClass} type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} /></Field>
          </div>
          <Button onClick={submit} disabled={!title.trim() || !body.trim()}><IconUpload size={16} /> Upload to Verifier</Button>
          {status && <Badge tone="brand"><IconSparkle size={12} /> {status}</Badge>}
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-400">
          <IconCheck size={12} className="text-brand" /> Pipeline: Write → Claude AI → Verifier (Subspecialist/Professor) → Published on Marketplace.
        </p>
      </Card>
    </div>
  )
}

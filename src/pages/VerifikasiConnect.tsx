import { useEffect, useState } from 'react'
import { Prosa } from '../components/Prosa'
import { Card, SectionTitle, Button, Field, inputClass } from '../components/ui'
import { KolomAngka } from '../components/KolomAngka'
import { IconShield } from '../components/icons'
import { api, backendEnabled } from '../lib/api'

// ─────────────────────────────────────────────────────────────────────────────
// Verifikasi akun Connect.
//
// Formulir ini mengumpulkan data paling sensitif di seluruh aplikasi, jadi
// halaman ini menyatakan APA ADANYA apa yang terjadi pada tiap data — bukan
// menyembunyikannya di balik tautan kebijakan privasi yang tidak dibaca siapa
// pun. Tiga hal yang paling penting disebut tepat di sebelah kolomnya:
//
//   * Identitas diikat ke NOMOR TELEPON, bukan NIK. Yang disimpan hanya
//     sidiknya dan empat digit terakhir. Nomornya tidak dibuktikan lewat kode
//     SMS, jadi ia mencegah satu nomor dipakai dua akun — bukan mencegah
//     seseorang memakai nomor orang lain.
//   * Orientasi seksual tidak pernah ditampilkan kepada pengguna lain. Ia data
//     pribadi spesifik menurut UU PDP 27/2022, dan di Indonesia daftar semacam
//     itu bisa membahayakan keselamatan orang.
//   * Selfie berpose adalah data biometrik. Ia hanya dilihat pemilik saat
//     meninjau, lalu DIHAPUS begitu putusan diambil.
//
// Persetujuan diminta terpisah per tujuan, bukan satu centang untuk semuanya,
// karena UU PDP Pasal 20-22 menuntut persetujuan yang tegas untuk tujuan yang
// spesifik — dan karena satu centang besar tidak memberi orang pilihan nyata.
// ─────────────────────────────────────────────────────────────────────────────

// Tiga platform yang diterima untuk pencocokan. Daftar ini harus tetap sama
// dengan PLATFORM_SOSIAL di server/src/connect.ts — server yang menolak, bukan
// formulir ini, jadi formulir hanya boleh menawarkan yang pasti diterima.
const PLATFORM = [
  { id: 'linkedin' as const, label: 'LinkedIn', contoh: 'https://linkedin.com/in/your-name' },
  { id: 'facebook' as const, label: 'Facebook', contoh: 'https://facebook.com/your.name' },
  { id: 'instagram' as const, label: 'Instagram', contoh: 'https://instagram.com/yourname' },
]

// Tujuan pemrosesan yang perlu persetujuan tegas. Idnya harus sama dengan
// TujuanPersetujuan di server.
const TUJUAN = [
  {
    id: 'biometrik_selfie' as const,
    judul: 'Process my face photo (biometric data)',
    isi: 'The posed selfie is used once by the owner to match your face against the photo on your social account. Once a decision is made, the link is deleted.',
  },
  {
    id: 'orientasi_seksual' as const,
    judul: 'Process my preference (sexual orientation)',
    isi: 'Used only on the server to decide who appears in your deck. It is never sent to the device of another user and never appears on a profile.',
  },
  {
    id: 'telepon_sidik' as const,
    judul: 'Fingerprint my phone number to prevent duplicate accounts',
    isi: 'The number itself is not stored — only a one-way fingerprint and the last four digits. A fingerprint cannot be turned back into a number, so a leaked database gives nobody a list of numbers to contact.',
  },
]

const JUDUL_TUJUAN: Record<string, string> = Object.fromEntries(
  TUJUAN.map((t) => [t.id, t.judul]))

const PREFERENSI = [
  { id: 'straight', l: 'Straight' },
  { id: 'gay', l: 'Gay' },
  { id: 'lesbian', l: 'Lesbian' },
  { id: 'biseksual', l: 'Bisexual' },
]

const GALAT: Record<string, string> = {
  telepon_tidak_sah: 'That phone number is not valid. Example: 08123456789.',
  telepon_sudah_dipakai: 'This number is already used by another account. One person may have only one account.',
  telepon_wajib: 'Phone number is required.',
  selfie_wajib: 'A posed selfie is required.',
  sosial_media_wajib: 'Enter at least one LinkedIn, Facebook, or Instagram link.',
  sosial_media_tidak_dikenal: 'Links may only point to LinkedIn, Facebook, or Instagram. Check the address you pasted.',
  sosial_media_sudah_dipakai: 'This social account is already used by another Connect account. One social account belongs to one person.',
  nama_wajib: 'Name is required.',
  umur_minimal_18: 'Connect is for 18 and over only.',
  sudah_terverifikasi: 'Your account is already verified.',
  persetujuan_belum_lengkap: 'All three consents below must be ticked. Without them there is no lawful basis to process your data.',
}

export function VerifikasiConnect() {
  const [f, setF] = useState({
    nama: '', tempatLahir: '', tanggalLahir: '', pekerjaan: '', status: '',
    preferensi: 'straight', pendidikanTerakhir: '', tempatTinggal: '',
    telepon: '', selfieUrl: '', linkedin: '', facebook: '', instagram: '',
  })
  const [umur, setAge] = useState<number | undefined>(undefined)
  const [setuju, setSetuju] = useState<Record<string, boolean>>({})
  const [tarik, setTarik] = useState(false)
  const [kirim, setKirim] = useState(false)
  const [pesan, setPesan] = useState('')
  const [galat, setGalat] = useState('')
  const [saya, setSaya] = useState<Awaited<ReturnType<typeof api.connectSaya>> | null>(null)

  useEffect(() => {
    if (!backendEnabled) return
    void api.connectSaya().then(setSaya).catch(() => setSaya(null))
  }, [])

  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }))

  async function ajukan() {
    setGalat(''); setPesan(''); setKirim(true)
    try {
      await api.connectVerifikasi({
        nama: f.nama, tempatLahir: f.tempatLahir, tanggalLahir: f.tanggalLahir,
        umur: umur ?? 0, pekerjaan: f.pekerjaan, status: f.status,
        preferensi: f.preferensi, pendidikanTerakhir: f.pendidikanTerakhir,
        tempatTinggal: f.tempatTinggal, telepon: f.telepon, selfieUrl: f.selfieUrl,
        sosialMedia: PLATFORM.map((p) => f[p.id]).filter(Boolean),
        persetujuan: TUJUAN.filter((t) => setuju[t.id]).map((t) => t.id),
      })
      setPesan('Submitted. The owner will review your selfie and social accounts.')
      setSaya(await api.connectSaya())
    } catch (e) {
      const k = (e as Error)?.message ?? ''
      setGalat(GALAT[k] ?? 'Could not submit. Please try again.')
    } finally { setKirim(false) }
  }

  async function lakukanTarik() {
    try {
      await api.connectTarikPersetujuan()
      setSaya(await api.connectSaya())
      setTarik(false)
      setPesan('Consent withdrawn and your verification data deleted.')
    } catch { setGalat('Could not withdraw consent. Please try again.') }
  }

  const status = saya?.status ?? 'belum'

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <SectionTitle icon={<IconShield />} title="Connect Verification"
        subtitle="Required before you can meet anyone — so the person you meet is really them" />

      {status === 'terverifikasi' && (
        <Card className="!border-emerald-500/30 !bg-emerald-500/5">
          <p className="text-[13px] font-bold text-emerald-700">✓ Your account is already verified.</p>
          <p className="mt-1 text-[12px] text-neutral-600">
            Your trust credit is <b>{saya?.kredit}</b> out of {saya?.ambang.awal}.
            {saya?.bahaya && ' Your credit is in the danger zone.'}
          </p>
        </Card>
      )}
      {status === 'menunggu' && (
        <Card className="!border-amber-500/30 !bg-amber-500/5">
          <p className="text-[13px] font-bold text-amber-700">Waiting for owner review.</p>
          <p className="mt-1 text-[12px] text-neutral-600">You will be able to use Connect once approved.</p>
        </Card>
      )}
      {status === 'ditolak' && (
        <Card className="!border-rose-500/30 !bg-rose-500/5">
          <p className="text-[13px] font-bold text-rose-600">Submission rejected.</p>
          <p className="mt-1 text-[12px] text-neutral-600">{saya?.alasanReject}</p>
        </Card>
      )}

      {/* Yang terjadi pada data Anda — di depan, bukan di catatan kaki. */}
      <Card className="!border-sky-500/30 !bg-sky-500/5">
        <div className="text-[11px] font-black uppercase tracking-wide text-sky-700">What happens to your data</div>
        <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-neutral-600">
          <li>• <b>The national ID number is no longer requested.</b> Private use of the NIK is governed by
            UU Adminduk 24/2013 and requires a formal arrangement with Dukcapil. Identity is now tied to a
            <b> phone number</b>, used to ensure one person does not create two accounts.
            The NIK is not requested anywhere in this app.</li>
          <li>• <b>The phone number itself is not stored.</b> Only its fingerprint and the last four digits, so
            a leaked database gives nobody a list of numbers to contact.</li>
          <li>• <b>Sexual orientation is never shown to other users.</b>
            It is used only by the matching engine on the server.</li>
          <li>• <b>The address is never shown in full</b> — other users see only the city.
            Distance is computed between city centres, not from GPS.</li>
          <li>• <b>The selfie is deleted after the decision.</b> The owner views it once to match the face,
            then the link is discarded — whether your application is approved or rejected.</li>
          <li>• <b>Religion is no longer requested.</b> The field used to exist but nothing used it;
            data that is not used should not be collected.</li>
          <li>• <b>You can withdraw consent at any time</b>, and withdrawing it deletes your
            verification data.</li>
        </ul>
        <Prosa kelas="mt-2 text-[10px] leading-relaxed text-slate-500">Basis: UU No. 27/2022 on Personal Data Protection — Article 4(2) for specific personal data, Article 16 for purpose limitation, Articles 20–22 for consent, Article 9 for withdrawal of consent, and Article 43 for erasure.</Prosa>
      </Card>

      {status !== 'terverifikasi' && status !== 'menunggu' && (
        <>
          <Card>
            <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Personal details</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Field label="Full name"><input className={inputClass} value={f.nama} onChange={(e) => set('nama', e.target.value)} aria-label="Full name" /></Field>
              <Field label="Age"><KolomAngka nilai={umur} onNilai={setAge} ariaLabel="Age" /></Field>
              <Field label="Place of birth"><input className={inputClass} value={f.tempatLahir} onChange={(e) => set('tempatLahir', e.target.value)} aria-label="Place of birth" /></Field>
              <Field label="Date of birth"><input className={inputClass} type="date" value={f.tanggalLahir} onChange={(e) => set('tanggalLahir', e.target.value)} aria-label="Date of birth" /></Field>
              <Field label="Occupation"><input className={inputClass} value={f.pekerjaan} onChange={(e) => set('pekerjaan', e.target.value)} aria-label="Occupation" /></Field>
              <Field label="Status"><input className={inputClass} placeholder="single / married" value={f.status} onChange={(e) => set('status', e.target.value)} aria-label="Status" /></Field>
              <Field label="Highest education"><input className={inputClass} value={f.pendidikanTerakhir} onChange={(e) => set('pendidikanTerakhir', e.target.value)} aria-label="Highest education" /></Field>
            </div>
            <div className="mt-2">
              <Field label="Residence (city, province)">
                <input className={inputClass} placeholder="Bandung, Jawa Barat" value={f.tempatTinggal} onChange={(e) => set('tempatTinggal', e.target.value)} aria-label="Residence" />
              </Field>
            </div>
            <div className="mt-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Preference</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {PREFERENSI.map((p) => (
                  <button key={p.id} onClick={() => set('preferensi', p.id)} aria-pressed={f.preferensi === p.id}
                    className={`rounded-lg px-2.5 py-1 text-[12px] font-bold ${f.preferensi === p.id ? 'bg-brand text-white' : 'bg-white/5 text-neutral-600'}`}>
                    {p.l}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[10px] text-slate-500">Never shown to other users.</p>
            </div>
          </Card>

          <Card>
            <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Proof of identity</div>
            <div className="mt-2">
              <Field label="Phone number">
                <input className={inputClass} inputMode="tel" placeholder="08123456789"
                  value={f.telepon} onChange={(e) => set('telepon', e.target.value)} aria-label="Phone number" />
              </Field>
              <Prosa kelas="mt-1 text-[11px] leading-relaxed text-neutral-500">Used to ensure one person does not create two accounts. The number itself is not stored — only its fingerprint and the last four digits, so it can neither be read back nor used to contact you.</Prosa>
            </div>
            <div className="mt-2">
              <Field label="Posed selfie link">
                <input className={inputClass} placeholder="https://…" value={f.selfieUrl}
                  onChange={(e) => set('selfieUrl', e.target.value)} aria-label="Selfie link" />
              </Field>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                A photo of your face while <b>forming the letter P with your fingers</b>. This pose is what proves
                the photo was taken by you just now, rather than pulled from the internet.
              </p>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2">
              {PLATFORM.map((p) => (
                <Field key={p.id} label={p.label}>
                  <input className={inputClass} placeholder={p.contoh} value={f[p.id]}
                    onChange={(e) => set(p.id, e.target.value)} aria-label={p.label} />
                </Field>
              ))}
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
              Fill in <b>at least one</b> of the three. One social account may only be used by
              one Connect account. Only these three are accepted because matching a
              face only means something when the page it is compared against is hard to fabricate on the spot — all three
              show a posting history, connections, and a join date. A link to any other site
              gives the owner nothing to assess.
            </p>
          </Card>

          {/* Persetujuan terpisah per tujuan — bukan satu centang untuk semuanya. */}
          <Card>
            <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">
              Processing consent
            </div>
            <Prosa kelas="mt-1 text-[11px] leading-relaxed text-neutral-500">All three are required for verification, and that is stated plainly: if you decline any one of them, verification cannot proceed. What is separated here is the information — you are entitled to know exactly what you are agreeing to, one item at a time.</Prosa>
            <div className="mt-2 space-y-2">
              {TUJUAN.map((t) => (
                <label key={t.id} className="flex cursor-pointer items-start gap-2 rounded-xl bg-white/5 p-2.5">
                  <input type="checkbox" className="mt-0.5 shrink-0" checked={!!setuju[t.id]}
                    aria-label={t.judul}
                    onChange={(e) => setSetuju((s) => ({ ...s, [t.id]: e.target.checked }))} />
                  <span>
                    <span className="block text-[12px] font-bold text-ink">{t.judul}</span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-neutral-500">{t.isi}</span>
                  </span>
                </label>
              ))}
            </div>
          </Card>

          {galat && <Card className="!border-rose-500/30 !bg-rose-500/5"><p className="text-[12px] text-rose-600">{galat}</p></Card>}
          {pesan && <Card className="!border-emerald-500/30 !bg-emerald-500/5"><p className="text-[12px] text-emerald-700">{pesan}</p></Card>}

          <Button onClick={() => void ajukan()} disabled={kirim}>
            {kirim ? 'Submitting…' : 'Submit verification'}
          </Button>
        </>
      )}

      {/* Penarikan persetujuan — hak Pasal 9, jadi diletakkan di halaman yang
          sama dengan pemberiannya, bukan disembunyikan di menu lain. */}
      {saya && saya.persetujuan?.some((p) => !p.dicabutPada) && (
        <Card>
          <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Your consents</div>
          <div className="mt-2 space-y-1">
            {saya.persetujuan.filter((p) => !p.dicabutPada).map((p) => (
              <div key={p.tujuan} className="flex items-baseline justify-between gap-2 rounded-lg bg-white/5 px-2 py-1">
                <span className="text-[11px] text-neutral-600">{JUDUL_TUJUAN[p.tujuan] ?? p.tujuan}</span>
                <span className="shrink-0 text-[10px] text-slate-500">{p.pada.slice(0, 10)}</span>
              </div>
            ))}
          </div>
          {tarik ? (
            <div className="mt-2 rounded-xl bg-rose-500/10 p-3">
              <Prosa kelas="text-[12px] leading-relaxed text-neutral-600">Withdrawing consent deletes your verification data and returns the account to unverified status, so Connect cannot be used until you apply again. Trust credit and violation history are retained.</Prosa>
              <div className="mt-2 flex gap-2">
                <button onClick={() => void lakukanTarik()}
                  className="rounded-xl bg-rose-500 px-3 py-2 text-[12px] font-bold text-ink">
                  Yes, withdraw consent
                </button>
                <button onClick={() => setTarik(false)}
                  className="rounded-xl bg-white/5 px-3 py-2 text-[12px] font-bold text-neutral-600">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setTarik(true)}
              className="mt-2 text-[12px] font-bold text-rose-600 underline">
              Withdraw consent and delete my verification data
            </button>
          )}
          <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
            The consent record and the date you withdrew it are kept — that record is precisely the evidence
            that your withdrawal was honoured.
          </p>
        </Card>
      )}

      {/* Trust credit */}
      {saya && (
        <Card>
          <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Trust credit</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${saya.kredit <= saya.ambang.hapus ? 'text-rose-500' : saya.bahaya ? 'text-amber-700' : 'text-emerald-700'}`}>
              {saya.kredit}
            </span>
            <span className="text-[11px] text-neutral-500">dari {saya.ambang.awal}</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
            Below {saya.ambang.bahaya} the account is at risk. Below {saya.ambang.hapus} the account is
            scheduled for deletion — scheduled, not immediate, so that a mistaken decision can still be reversed.
          </p>
          {saya.hapusPada && (
            <p className="mt-2 rounded-lg bg-rose-500/10 p-2 text-[12px] font-bold text-rose-600">
              Account scheduled for deletion on {saya.hapusPada.slice(0, 10)}.
            </p>
          )}
          {saya.pelanggaran.length > 0 && (
            <div className="mt-2 space-y-1">
              {saya.pelanggaran.map((p) => (
                <div key={p.id} className="flex items-baseline justify-between rounded-lg bg-white/5 px-2 py-1">
                  <span className="text-[11px] text-neutral-600">{p.alasan}</span>
                  <span className="text-[11px] font-bold text-rose-600">−{p.poin}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default VerifikasiConnect

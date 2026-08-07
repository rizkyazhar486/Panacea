import { useEffect, useState } from 'react'
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
//   * NIK tidak disimpan. Yang disimpan hanya sidiknya, untuk memastikan satu
//     orang satu akun. Nomornya tidak bisa dibaca kembali oleh siapa pun,
//     termasuk pemilik aplikasi.
//   * Agama dan orientasi seksual tidak pernah ditampilkan kepada pengguna
//     lain. Keduanya data pribadi spesifik menurut UU PDP 27/2022, dan di
//     Indonesia daftar semacam itu bisa membahayakan keselamatan orang.
//   * Selfie berpose hanya dilihat pemilik saat meninjau.
// ─────────────────────────────────────────────────────────────────────────────

const PREFERENSI = [
  { id: 'straight', l: 'Straight' },
  { id: 'gay', l: 'Gay' },
  { id: 'lesbian', l: 'Lesbian' },
  { id: 'biseksual', l: 'Biseksual' },
]

const GALAT: Record<string, string> = {
  nik_tidak_sah: 'NIK harus 16 digit angka.',
  nik_sudah_dipakai: 'NIK ini sudah dipakai akun lain. Satu orang hanya boleh punya satu akun.',
  selfie_wajib: 'Selfie berpose wajib diunggah.',
  sosial_media_wajib: 'Isi minimal satu tautan media sosial.',
  nama_wajib: 'Nama wajib diisi.',
  umur_minimal_18: 'Connect hanya untuk 18 tahun ke atas.',
  sudah_terverifikasi: 'Akun Anda sudah terverifikasi.',
}

export function VerifikasiConnect() {
  const [f, setF] = useState({
    nama: '', tempatLahir: '', tanggalLahir: '', pekerjaan: '', status: '',
    preferensi: 'straight', agama: '', pendidikanTerakhir: '', tempatTinggal: '',
    nik: '', selfieUrl: '', sosial1: '', sosial2: '',
  })
  const [umur, setUmur] = useState<number | undefined>(undefined)
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
        preferensi: f.preferensi, agama: f.agama, pendidikanTerakhir: f.pendidikanTerakhir,
        tempatTinggal: f.tempatTinggal, nik: f.nik, selfieUrl: f.selfieUrl,
        sosialMedia: [f.sosial1, f.sosial2].filter(Boolean),
      })
      setPesan('Ajuan terkirim. Pemilik akan meninjau selfie dan media sosial Anda.')
      setSaya(await api.connectSaya())
    } catch (e) {
      const k = (e as Error)?.message ?? ''
      setGalat(GALAT[k] ?? 'Gagal mengirim ajuan. Coba lagi.')
    } finally { setKirim(false) }
  }

  const status = saya?.status ?? 'belum'

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <SectionTitle icon={<IconShield />} title="Verifikasi Connect"
        subtitle="Wajib sebelum bisa berkenalan — supaya yang Anda temui benar orangnya" />

      {status === 'terverifikasi' && (
        <Card className="!border-emerald-500/30 !bg-emerald-500/5">
          <p className="text-[13px] font-bold text-emerald-400">✓ Akun Anda sudah terverifikasi.</p>
          <p className="mt-1 text-[12px] text-slate-300">
            Kredit kepercayaan Anda <b>{saya?.kredit}</b> dari {saya?.ambang.awal}.
            {saya?.bahaya && ' Kredit Anda berada di zona bahaya.'}
          </p>
        </Card>
      )}
      {status === 'menunggu' && (
        <Card className="!border-amber-500/30 !bg-amber-500/5">
          <p className="text-[13px] font-bold text-amber-400">Menunggu tinjauan pemilik.</p>
          <p className="mt-1 text-[12px] text-slate-300">Anda akan bisa memakai Connect setelah disetujui.</p>
        </Card>
      )}
      {status === 'ditolak' && (
        <Card className="!border-rose-500/30 !bg-rose-500/5">
          <p className="text-[13px] font-bold text-rose-400">Ajuan ditolak.</p>
          <p className="mt-1 text-[12px] text-slate-300">{saya?.alasanTolak}</p>
        </Card>
      )}

      {/* Yang terjadi pada data Anda — di depan, bukan di catatan kaki. */}
      <Card className="!border-sky-500/30 !bg-sky-500/5">
        <div className="text-[11px] font-black uppercase tracking-wide text-sky-400">Apa yang terjadi pada data Anda</div>
        <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-slate-300">
          <li>• <b>NIK tidak disimpan.</b> Yang disimpan hanya sidiknya, untuk memastikan satu orang
            satu akun. Nomornya tidak bisa dibaca kembali oleh siapa pun — termasuk pemilik aplikasi.
            Hanya empat digit terakhir yang terlihat saat peninjauan.</li>
          <li>• <b>Agama dan orientasi seksual tidak pernah ditampilkan kepada pengguna lain.</b>
            Keduanya hanya dipakai mesin pencocokan di server.</li>
          <li>• <b>Alamat tidak ditampilkan utuh</b> — pengguna lain hanya melihat kotanya.</li>
          <li>• <b>Selfie hanya dilihat pemilik saat meninjau</b>, tidak muncul di profil.</li>
        </ul>
      </Card>

      {status !== 'terverifikasi' && status !== 'menunggu' && (
        <>
          <Card>
            <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">Data diri</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Field label="Nama lengkap"><input className={inputClass} value={f.nama} onChange={(e) => set('nama', e.target.value)} aria-label="Nama lengkap" /></Field>
              <Field label="Umur"><KolomAngka nilai={umur} onNilai={setUmur} ariaLabel="Umur" /></Field>
              <Field label="Tempat lahir"><input className={inputClass} value={f.tempatLahir} onChange={(e) => set('tempatLahir', e.target.value)} aria-label="Tempat lahir" /></Field>
              <Field label="Tanggal lahir"><input className={inputClass} type="date" value={f.tanggalLahir} onChange={(e) => set('tanggalLahir', e.target.value)} aria-label="Tanggal lahir" /></Field>
              <Field label="Pekerjaan"><input className={inputClass} value={f.pekerjaan} onChange={(e) => set('pekerjaan', e.target.value)} aria-label="Pekerjaan" /></Field>
              <Field label="Status"><input className={inputClass} placeholder="lajang / menikah" value={f.status} onChange={(e) => set('status', e.target.value)} aria-label="Status" /></Field>
              <Field label="Pendidikan terakhir"><input className={inputClass} value={f.pendidikanTerakhir} onChange={(e) => set('pendidikanTerakhir', e.target.value)} aria-label="Pendidikan terakhir" /></Field>
              <Field label="Agama"><input className={inputClass} value={f.agama} onChange={(e) => set('agama', e.target.value)} aria-label="Agama" /></Field>
            </div>
            <div className="mt-2">
              <Field label="Tempat tinggal (kota, provinsi)">
                <input className={inputClass} placeholder="Bandung, Jawa Barat" value={f.tempatTinggal} onChange={(e) => set('tempatTinggal', e.target.value)} aria-label="Tempat tinggal" />
              </Field>
            </div>
            <div className="mt-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Preferensi</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {PREFERENSI.map((p) => (
                  <button key={p.id} onClick={() => set('preferensi', p.id)} aria-pressed={f.preferensi === p.id}
                    className={`rounded-lg px-2.5 py-1 text-[12px] font-bold ${f.preferensi === p.id ? 'bg-brand text-white' : 'bg-white/5 text-slate-300'}`}>
                    {p.l}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[10px] text-slate-500">Tidak pernah ditampilkan kepada pengguna lain.</p>
            </div>
          </Card>

          <Card>
            <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">Pembuktian identitas</div>
            <div className="mt-2">
              <Field label="NIK (16 digit)">
                <input className={inputClass} inputMode="numeric" maxLength={16} value={f.nik}
                  onChange={(e) => set('nik', e.target.value.replace(/\D/g, ''))} aria-label="NIK" />
              </Field>
              <p className="mt-1 text-[10px] text-slate-500">Tidak disimpan — hanya sidiknya, untuk mencegah akun ganda.</p>
            </div>
            <div className="mt-2">
              <Field label="Tautan selfie berpose">
                <input className={inputClass} placeholder="https://…" value={f.selfieUrl}
                  onChange={(e) => set('selfieUrl', e.target.value)} aria-label="Tautan selfie" />
              </Field>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                Foto wajah Anda sambil <b>membentuk huruf P dengan jari</b>. Pose ini yang membuktikan
                fotonya diambil sekarang oleh Anda sendiri, bukan diambil dari internet.
              </p>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2">
              <Field label="Media sosial 1"><input className={inputClass} placeholder="https://instagram.com/…" value={f.sosial1} onChange={(e) => set('sosial1', e.target.value)} aria-label="Media sosial 1" /></Field>
              <Field label="Media sosial 2 (opsional)"><input className={inputClass} value={f.sosial2} onChange={(e) => set('sosial2', e.target.value)} aria-label="Media sosial 2" /></Field>
            </div>
            <p className="mt-1 text-[10px] text-slate-500">Pemilik mencocokkan wajah di selfie dengan foto di akun media sosial Anda.</p>
          </Card>

          {galat && <Card className="!border-rose-500/30 !bg-rose-500/5"><p className="text-[12px] text-rose-400">{galat}</p></Card>}
          {pesan && <Card className="!border-emerald-500/30 !bg-emerald-500/5"><p className="text-[12px] text-emerald-400">{pesan}</p></Card>}

          <Button onClick={() => void ajukan()} disabled={kirim}>
            {kirim ? 'Mengirim…' : 'Ajukan verifikasi'}
          </Button>
        </>
      )}

      {/* Kredit kepercayaan */}
      {saya && (
        <Card>
          <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">Kredit kepercayaan</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${saya.kredit <= saya.ambang.hapus ? 'text-rose-500' : saya.bahaya ? 'text-amber-400' : 'text-emerald-400'}`}>
              {saya.kredit}
            </span>
            <span className="text-[11px] text-slate-400">dari {saya.ambang.awal}</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
            Di bawah {saya.ambang.bahaya} akun berada dalam bahaya. Di bawah {saya.ambang.hapus} akun
            dijadwalkan dihapus — dijadwalkan, bukan langsung, supaya keputusan yang keliru masih bisa ditarik.
          </p>
          {saya.hapusPada && (
            <p className="mt-2 rounded-lg bg-rose-500/10 p-2 text-[12px] font-bold text-rose-400">
              Akun dijadwalkan dihapus pada {saya.hapusPada.slice(0, 10)}.
            </p>
          )}
          {saya.pelanggaran.length > 0 && (
            <div className="mt-2 space-y-1">
              {saya.pelanggaran.map((p) => (
                <div key={p.id} className="flex items-baseline justify-between rounded-lg bg-white/5 px-2 py-1">
                  <span className="text-[11px] text-slate-300">{p.alasan}</span>
                  <span className="text-[11px] font-bold text-rose-400">−{p.poin}</span>
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

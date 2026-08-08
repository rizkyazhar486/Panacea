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
  { id: 'linkedin' as const, label: 'LinkedIn', contoh: 'https://linkedin.com/in/nama-anda' },
  { id: 'facebook' as const, label: 'Facebook', contoh: 'https://facebook.com/nama.anda' },
  { id: 'instagram' as const, label: 'Instagram', contoh: 'https://instagram.com/namaanda' },
]

// Tujuan pemrosesan yang perlu persetujuan tegas. Idnya harus sama dengan
// TujuanPersetujuan di server.
const TUJUAN = [
  {
    id: 'biometrik_selfie' as const,
    judul: 'Memproses foto wajah saya (data biometrik)',
    isi: 'Selfie berpose dipakai satu kali oleh pemilik untuk mencocokkan wajah Anda dengan foto di akun media sosial Anda. Setelah putusan diambil, tautannya dihapus.',
  },
  {
    id: 'orientasi_seksual' as const,
    judul: 'Memproses preferensi saya (orientasi seksual)',
    isi: 'Dipakai hanya di server untuk menentukan siapa yang muncul di deck Anda. Tidak pernah dikirim ke perangkat pengguna lain dan tidak muncul di profil.',
  },
  {
    id: 'telepon_sidik' as const,
    judul: 'Menyidik nomor telepon saya untuk mencegah akun ganda',
    isi: 'Nomornya tidak disimpan — hanya sidik satu arahnya dan empat digit terakhir. Sidik tidak bisa dikembalikan menjadi nomor, jadi basis data yang bocor tidak memberi siapa pun daftar nomor untuk dihubungi.',
  },
]

const JUDUL_TUJUAN: Record<string, string> = Object.fromEntries(
  TUJUAN.map((t) => [t.id, t.judul]))

const PREFERENSI = [
  { id: 'straight', l: 'Straight' },
  { id: 'gay', l: 'Gay' },
  { id: 'lesbian', l: 'Lesbian' },
  { id: 'biseksual', l: 'Biseksual' },
]

const GALAT: Record<string, string> = {
  telepon_tidak_sah: 'Nomor telepon tidak sah. Contoh: 08123456789.',
  telepon_sudah_dipakai: 'Nomor ini sudah dipakai akun lain. Satu orang hanya boleh punya satu akun.',
  telepon_wajib: 'Nomor telepon wajib diisi.',
  selfie_wajib: 'Selfie berpose wajib diunggah.',
  sosial_media_wajib: 'Isi minimal satu tautan LinkedIn, Facebook, atau Instagram.',
  sosial_media_tidak_dikenal: 'Tautan hanya boleh ke LinkedIn, Facebook, atau Instagram. Periksa alamat yang Anda tempel.',
  sosial_media_sudah_dipakai: 'Akun media sosial ini sudah dipakai akun Connect lain. Satu akun media sosial hanya untuk satu orang.',
  nama_wajib: 'Nama wajib diisi.',
  umur_minimal_18: 'Connect hanya untuk 18 tahun ke atas.',
  sudah_terverifikasi: 'Akun Anda sudah terverifikasi.',
  persetujuan_belum_lengkap: 'Ketiga persetujuan di bawah harus dicentang. Tanpa itu tidak ada dasar hukum untuk memproses data Anda.',
}

export function VerifikasiConnect() {
  const [f, setF] = useState({
    nama: '', tempatLahir: '', tanggalLahir: '', pekerjaan: '', status: '',
    preferensi: 'straight', pendidikanTerakhir: '', tempatTinggal: '',
    telepon: '', selfieUrl: '', linkedin: '', facebook: '', instagram: '',
  })
  const [umur, setUmur] = useState<number | undefined>(undefined)
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
      setPesan('Ajuan terkirim. Pemilik akan meninjau selfie dan media sosial Anda.')
      setSaya(await api.connectSaya())
    } catch (e) {
      const k = (e as Error)?.message ?? ''
      setGalat(GALAT[k] ?? 'Gagal mengirim ajuan. Coba lagi.')
    } finally { setKirim(false) }
  }

  async function lakukanTarik() {
    try {
      await api.connectTarikPersetujuan()
      setSaya(await api.connectSaya())
      setTarik(false)
      setPesan('Persetujuan ditarik dan data verifikasi Anda dihapus.')
    } catch { setGalat('Gagal menarik persetujuan. Coba lagi.') }
  }

  const status = saya?.status ?? 'belum'

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <SectionTitle icon={<IconShield />} title="Verifikasi Connect"
        subtitle="Required before you can meet anyone — so the person you meet is really them" />

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
          <li>• <b>NIK tidak lagi diminta.</b> Pemakaian NIK oleh pihak swasta diatur UU Adminduk
            24/2013 dan menuntut kerja sama resmi dengan Dukcapil. Identitas kini diikat ke
            <b> nomor telepon</b>, yang dipakai memastikan satu orang tidak membuat dua akun.</li>
          <li>• <b>Nomor telepon tidak disimpan.</b> Hanya sidiknya dan empat digit terakhir, jadi
            basis data yang bocor tidak memberi siapa pun daftar nomor untuk dihubungi.</li>
          <li>• <b>Orientasi seksual tidak pernah ditampilkan kepada pengguna lain.</b>
            Ia hanya dipakai mesin pencocokan di server.</li>
          <li>• <b>Alamat tidak ditampilkan utuh</b> — pengguna lain hanya melihat kotanya.
            Jarak dihitung antar pusat kota, bukan dari GPS.</li>
          <li>• <b>Selfie dihapus setelah putusan.</b> Ia dilihat pemilik satu kali untuk
            mencocokkan wajah, lalu tautannya dibuang — baik ajuan Anda disetujui maupun ditolak.</li>
          <li>• <b>Agama tidak lagi diminta.</b> Dulu kolomnya ada, tetapi tidak dipakai oleh apa
            pun; data yang tidak dipakai tidak boleh diminta.</li>
          <li>• <b>Persetujuan bisa Anda tarik kapan saja</b>, dan penarikannya menghapus data
            verifikasi Anda.</li>
        </ul>
        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
          Dasar: UU No. 27/2022 tentang Pelindungan Data Pribadi — Pasal 4 ayat (2) untuk data
          pribadi spesifik, Pasal 16 untuk pembatasan tujuan, Pasal 20-22 untuk persetujuan,
          Pasal 9 untuk penarikan persetujuan, dan Pasal 43 untuk penghapusan.
        </p>
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
              <Field label="Nomor telepon">
                <input className={inputClass} inputMode="tel" placeholder="08123456789"
                  value={f.telepon} onChange={(e) => set('telepon', e.target.value)} aria-label="Nomor telepon" />
              </Field>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                Dipakai memastikan satu orang tidak membuat dua akun. Nomornya tidak disimpan —
                hanya sidiknya dan empat digit terakhir, jadi ia tidak bisa dibaca kembali maupun
                dipakai menghubungi Anda.
              </p>
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
              {PLATFORM.map((p) => (
                <Field key={p.id} label={p.label}>
                  <input className={inputClass} placeholder={p.contoh} value={f[p.id]}
                    onChange={(e) => set(p.id, e.target.value)} aria-label={p.label} />
                </Field>
              ))}
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              Isi <b>minimal satu</b> dari ketiganya. Satu akun media sosial hanya boleh dipakai
              satu akun Connect. Hanya tiga ini yang diterima karena pencocokan
              wajah baru berarti bila halaman pembandingnya sulit dikarang mendadak — ketiganya
              memperlihatkan riwayat unggahan, koneksi, dan tanggal bergabung. Tautan ke situs lain
              tidak memberi pemilik apa pun untuk dinilai.
            </p>
          </Card>

          {/* Persetujuan terpisah per tujuan — bukan satu centang untuk semuanya. */}
          <Card>
            <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">
              Persetujuan pemrosesan
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              Ketiganya wajib untuk bisa diverifikasi, dan itu disampaikan terus terang: bila salah
              satu tidak Anda setujui, verifikasi tidak bisa dijalankan. Yang dipisah di sini adalah
              informasinya — Anda berhak tahu persis apa yang Anda setujui, satu per satu.
            </p>
            <div className="mt-2 space-y-2">
              {TUJUAN.map((t) => (
                <label key={t.id} className="flex cursor-pointer items-start gap-2 rounded-xl bg-white/5 p-2.5">
                  <input type="checkbox" className="mt-0.5 shrink-0" checked={!!setuju[t.id]}
                    aria-label={t.judul}
                    onChange={(e) => setSetuju((s) => ({ ...s, [t.id]: e.target.checked }))} />
                  <span>
                    <span className="block text-[12px] font-bold text-slate-200">{t.judul}</span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-400">{t.isi}</span>
                  </span>
                </label>
              ))}
            </div>
          </Card>

          {galat && <Card className="!border-rose-500/30 !bg-rose-500/5"><p className="text-[12px] text-rose-400">{galat}</p></Card>}
          {pesan && <Card className="!border-emerald-500/30 !bg-emerald-500/5"><p className="text-[12px] text-emerald-400">{pesan}</p></Card>}

          <Button onClick={() => void ajukan()} disabled={kirim}>
            {kirim ? 'Mengirim…' : 'Ajukan verifikasi'}
          </Button>
        </>
      )}

      {/* Penarikan persetujuan — hak Pasal 9, jadi diletakkan di halaman yang
          sama dengan pemberiannya, bukan disembunyikan di menu lain. */}
      {saya && saya.persetujuan?.some((p) => !p.dicabutPada) && (
        <Card>
          <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">Persetujuan Anda</div>
          <div className="mt-2 space-y-1">
            {saya.persetujuan.filter((p) => !p.dicabutPada).map((p) => (
              <div key={p.tujuan} className="flex items-baseline justify-between gap-2 rounded-lg bg-white/5 px-2 py-1">
                <span className="text-[11px] text-slate-300">{JUDUL_TUJUAN[p.tujuan] ?? p.tujuan}</span>
                <span className="shrink-0 text-[10px] text-slate-500">{p.pada.slice(0, 10)}</span>
              </div>
            ))}
          </div>
          {tarik ? (
            <div className="mt-2 rounded-xl bg-rose-500/10 p-3">
              <p className="text-[12px] leading-relaxed text-slate-300">
                Menarik persetujuan menghapus data verifikasi Anda dan mengembalikan akun ke status
                belum terverifikasi, sehingga Connect tidak bisa dipakai sampai Anda mengajukannya
                lagi. Kredit kepercayaan dan riwayat pelanggaran tetap tersimpan.
              </p>
              <div className="mt-2 flex gap-2">
                <button onClick={() => void lakukanTarik()}
                  className="rounded-xl bg-rose-500 px-3 py-2 text-[12px] font-bold text-white">
                  Ya, tarik persetujuan
                </button>
                <button onClick={() => setTarik(false)}
                  className="rounded-xl bg-white/5 px-3 py-2 text-[12px] font-bold text-slate-300">
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setTarik(true)}
              className="mt-2 text-[12px] font-bold text-rose-400 underline">
              Tarik persetujuan dan hapus data verifikasi saya
            </button>
          )}
          <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
            Catatan persetujuan beserta tanggal penarikannya tetap disimpan — justru itulah bukti
            bahwa penarikan Anda dihormati.
          </p>
        </Card>
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

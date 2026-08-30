import { useCallback, useEffect, useState } from 'react'
import { Prosa } from '../components/Prosa'
import { Link } from 'react-router-dom'
import { Card, SectionTitle, Button } from '../components/ui'
import { IconShield } from '../components/icons'
import { api, backendEnabled } from '../lib/api'

// ─────────────────────────────────────────────────────────────────────────────
// Deck Connect — kartu calon kenalan.
//
// Halaman ini sengaja tidak menyembunyikan cara kerjanya. Aplikasi perkenalan
// biasanya merahasiakan mengapa seseorang muncul atau tidak muncul, dan
// kerahasiaan itu hampir selalu menguntungkan aplikasinya, bukan penggunanya.
// Di sini alasannya ditulis: siapa yang disaring, oleh apa, dan apa batasnya.
//
// Dua hal yang paling penting untuk dipahami pengguna:
//
//   * JARAK DIHITUNG ANTAR PUSAT KOTA, bukan dari GPS. Aplikasi ini tidak
//     pernah meminta letak persis Anda. Jarak presisi yang dibaca dari
//     beberapa titik bisa dipakai menghitung letak rumah seseorang, dan basis
//     data semacam itu membahayakan keselamatan orang bila bocor. Akibatnya
//     jujur: semua orang di same city berjarak 0 km, jadi radius di bawah
//     jarak antarkota tidak menyaring apa-apa di dalam satu kota.
//   * RADIUS BERLAKU DUA ARAH. Radius Anda membatasi siapa yang Anda lihat
//     sekaligus siapa yang melihat Anda. Memasang radius lebar tidak menembus
//     batas sempit yang dipasang orang lain.
// ─────────────────────────────────────────────────────────────────────────────

type Kartu = Awaited<ReturnType<typeof api.connectDek>>[number]

const PILIHAN_RADIUS = [5, 10, 25, 50, 100, 200, 500]

export function DekConnect() {
  const [kartu, setKartu] = useState<Kartu[]>([])
  const [radius, setRadius] = useState(25)
  const [status, setStatus] = useState<string>('belum')
  const [muat, setMuat] = useState(true)
  const [galat, setGalat] = useState('')

  const segarkan = useCallback(async () => {
    if (!backendEnabled) { setMuat(false); return }
    try {
      const saya = await api.connectSaya()
      setStatus(saya.status); setRadius(saya.radiusKm)
      // Deck hanya diminta bila memang berhak — supaya kegagalan yang wajar
      // (belum terverifikasi) tidak muncul sebagai pesan galat yang menakutkan.
      if (saya.status === 'terverifikasi') setKartu(await api.connectDek())
      setGalat('')
    } catch { setGalat('Could not load. Check your connection.') }
    finally { setMuat(false) }
  }, [])

  useEffect(() => { void segarkan() }, [segarkan])

  async function ubahRadius(km: number) {
    setRadius(km)
    try {
      await api.connectRadius(km)
      setKartu(await api.connectDek())
    } catch { setGalat('Radius could not be saved.') }
  }

  async function blokir(email: string) {
    try {
      await api.connectBlock(email)
      setKartu((s) => s.filter((k) => k.email !== email))
    } catch { setGalat('Could not block.') }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <SectionTitle icon={<IconShield />} title="Connect"
        subtitle="Meet verified people, within a radius you set" />

      {galat && <Card className="!border-rose-500/30 !bg-rose-500/5"><p className="text-[12px] text-rose-600">{galat}</p></Card>}
      {muat && <Card><p className="text-[13px] text-neutral-500">Loading…</p></Card>}

      {!muat && status !== 'terverifikasi' && (
        <Card className="!border-amber-500/30 !bg-amber-500/5">
          <p className="text-[13px] font-bold text-amber-700">
            {status === 'menunggu' ? 'Your submission is under review.' : 'Your account is not verified yet.'}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-neutral-600">
            Connect hanya mempertemukan akun terverifikasi. Itu satu-satunya alasan fitur ini ada:
            supaya orang yang Anda temui benar orangnya.
          </p>
          {status !== 'menunggu' && (
            <Link to="/verifikasi-connect" className="mt-2 inline-block text-[12px] font-bold text-brand underline">
              Submit verification →
            </Link>
          )}
        </Card>
      )}

      {status === 'terverifikasi' && (
        <>
          <Card>
            <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Search radius</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PILIHAN_RADIUS.map((km) => (
                <button key={km} onClick={() => void ubahRadius(km)} aria-pressed={radius === km}
                  className={`rounded-lg px-2.5 py-1 text-[12px] font-bold ${
                    radius === km ? 'bg-brand text-white' : 'bg-white/5 text-neutral-600'}`}>
                  {km} km
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              Jarak dihitung antar <b>pusat kota</b>, bukan dari GPS — aplikasi ini tidak pernah
              meminta letak persis Anda, karena jarak presisi bisa dipakai melacak tempat tinggal
              seseorang. Akibatnya: semua orang di same city tercatat 0 km. Radius juga
              berlaku <b>dua arah</b> — memasangnya lebar tidak menembus batas sempit orang lain.
              Batas terjauh 500 km.
            </p>
          </Card>

          <Card>
            <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">
              People you could meet ({kartu.length})
            </div>
            {kartu.length === 0 && (
              <Prosa kelas="mt-2 text-[12px] leading-relaxed text-neutral-500">Belum ada yang cocok. Yang muncul di sini hanya akun terverifikasi, dengan kredit kepercayaan di atas ambang bahaya, preferensi yang saling cocok, dan berada di dalam radius Anda maupun radius mereka. Melebarkan radius biasanya yang paling berpengaruh.</Prosa>
            )}
            <div className="mt-2 space-y-2">
              {kartu.map((k) => (
                <div key={k.email} className="rounded-xl bg-white/5 p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[14px] font-black text-ink">{k.nama}, {k.umur}</span>
                    <span className="shrink-0 text-[11px] font-bold text-neutral-500">
                      {k.jarakKm === null ? 'distance unknown'
                        : k.jarakKm === 0 ? 'same city' : `± ${k.jarakKm} km`}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[12px] text-neutral-600">{k.pekerjaan} · {k.pendidikan}</div>
                  <div className="text-[11px] text-slate-500">{k.kota}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                      Verified
                    </span>
                    <span className="text-[10px] text-slate-500">Credit {k.kredit}</span>
                    <button onClick={() => void blokir(k.email)}
                      className="ml-auto rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-bold text-rose-600">
                      Block
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <Prosa kelas="text-[11px] leading-relaxed text-neutral-500">Memblokir seseorang membuatnya hilang dari kedua sisi sekaligus — ia tidak lagi melihat Anda dan tidak bisa menghubungi Anda dari perangkat mana pun yang tersambung ke akunnya. Bila ada yang mengganggu, laporkan; laporan dinilai pemilik, dan pengurangan kredit dicatat beserta alasannya.</Prosa>
            <Link to="/verifikasi-connect" className="mt-2 inline-block text-[12px] font-bold text-brand underline">
              See my trust credit →
            </Link>
          </Card>
        </>
      )}
    </div>
  )
}

export default DekConnect

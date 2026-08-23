import { useEffect, useState } from 'react'
import { api, backendEnabled } from '../lib/api'
import { pushStatus, type PushStatus } from '../lib/push'
import { DiagnosaNotifikasi } from './DiagnosaNotifikasi'
import { SaklarNotifikasi } from './SaklarNotifikasi'
import { muatSetelan, simpanSetelan } from '../lib/adzan'

// ─────────────────────────────────────────────────────────────────────────────
// Satu tempat untuk menyalakan pengingat: latihan harian, gol tim, dan adzan.
//
// KENAPA DI BERANDA, BUKAN HANYA DI PENGATURAN. Pengingat yang tidak pernah
// ditemukan sama saja dengan pengingat yang tidak ada. Tiga saklar ini yang
// paling sering ditanyakan, dan ketiganya sebelum ini terkubur di halaman
// pengaturan yang berbeda-beda.
//
// APA YANG SEBENARNYA TERJADI DI BALIK TIAP SAKLAR — ditulis apa adanya di
// widgetnya, karena janji notifikasi yang tidak ditepati lebih buruk daripada
// tidak menjanjikan apa pun:
//
//   · LATIHAN HARIAN dan GOL TIM dikirim oleh server lewat Web Push, jadi
//     keduanya sampai meski aplikasi ditutup — tetapi HANYA setelah izin
//     notifikasi diberikan dan langganan push terdaftar. Karena itu saklarnya
//     mati sendiri bila push belum menyala, bukan pura-pura menyala.
//   · ADZAN berbunyi dan bergetar DARI DALAM aplikasi, jadi ia hanya bekerja
//     selama halaman ini terbuka. Itu bukan kekurangan yang disembunyikan:
//     bunyi adzan yang dijadwalkan server akan berupa notifikasi biasa, bukan
//     lantunan, dan menamainya "adzan" berarti menjanjikan yang bukan-bukan.
//
// Jam pengingat latihan disimpan bersama SELISIH ZONA WAKTU perangkat, supaya
// pukul 17.00 berarti pukul lima sore di tempat pemakainya berada, bukan di
// tempat servernya berdiri.
// ─────────────────────────────────────────────────────────────────────────────

interface Setelan {
  notifLatihan?: boolean
  latihanHHMM?: string
  sportsNotif?: boolean
  notifSalat?: boolean
  salatLeadMin?: number
  salatKota?: string
  salatNegara?: string
  salatMetode?: number
  // Kategori mesin aturan — lihat server/src/aturanNotif.ts.
  notifPemulihan?: boolean
  notifLatihanPintar?: boolean
  notifVital?: boolean
  notifLingkungan?: boolean
  notifGizi?: boolean
  notifKebiasaan?: boolean
  notifKuota?: number
  notifSenyapMulai?: number
  notifSenyapSelesai?: number
}

/* Kategori notifikasi berbasis keadaan — bukan jam tetap seperti tiga saklar
   di atasnya. Isinya baru dikirim BILA syaratnya terpenuhi, dan yang
   menentukan syaratnya adalah data yang benar-benar masuk. Karena itu
   keterangannya menyebut contoh syarat, bukan menjanjikan notifikasi harian. */
const KATEGORI: { kunci: keyof Setelan; judul: string; contoh: string }[] = [
  { kunci: 'notifPemulihan', judul: 'Pemulihan & tidur', contoh: 'HRV atau denyut istirahat menyimpang, utang tidur menumpuk' },
  { kunci: 'notifLatihanPintar', judul: 'Latihan', contoh: 'tiga hari tanpa sesi, menit pekan ini kurang, langkah tertinggal' },
  { kunci: 'notifVital', judul: 'Vital & pencegahan', contoh: 'tekanan darah tinggi, saturasi rendah dua malam, data berhenti masuk' },
  { kunci: 'notifLingkungan', judul: 'Udara & sinar UV', contoh: 'AQI di atas 80 atau indeks UV puncak ≥ 8 di kota Anda' },
  { kunci: 'notifGizi', judul: 'Gizi & kafein', contoh: 'protein tertinggal sore hari, kopi sore, jendela puasa panjang' },
  { kunci: 'notifKebiasaan', judul: 'Kebiasaan mencatat', contoh: 'beberapa hari tanpa catatan harian atau catatan makan' },
]

function jamDariMenit(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}
function menitDariJam(v: string): number {
  const [h, m] = v.split(':').map(Number)
  return (Number.isFinite(h) ? h : 22) * 60 + (Number.isFinite(m) ? m : 0)
}

function Saklar({ nyala, onUbah, label }: { nyala: boolean; onUbah: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={nyala}
      aria-label={label}
      onClick={() => onUbah(!nyala)}
      className={`relative h-6 w-10 shrink-0 rounded-full transition ${nyala ? 'bg-brand' : 'bg-neutral-300 dark:bg-white/20'}`}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
        style={{ left: nyala ? 18 : 2 }}
      />
    </button>
  )
}

function Baris({ judul, catatan, kanan }: { judul: string; catatan: string; kanan: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-2">
      <span className="min-w-0 flex-1">
        <span className="t-kecil block truncate font-bold text-ink dark:text-white">{judul}</span>
        <span className="t-mikro block truncate text-neutral-400">{catatan}</span>
      </span>
      {kanan}
    </div>
  )
}

export function UbinNotifikasi() {
  const [push, setPush] = useState<PushStatus>('disabled')
  const [setelan, setSetelan] = useState<Setelan>({})
  const [adzan, setAdzan] = useState(() => muatSetelan())

  useEffect(() => {
    void pushStatus().then(setPush)
    // Jawaban server yang tidak berbentuk seperti dugaan TIDAK BOLEH menjatuhkan
    // halaman. Sebelum penjaga ini, satu jawaban kosong dari server membuat
    // seluruh beranda berganti menjadi layar "Something went wrong" — dan yang
    // hilang bukan hanya widget pengingatnya, melainkan semuanya.
    if (backendEnabled) void api.getSettings().then((s) => setSetelan((s ?? {}) as Setelan)).catch(() => {})
  }, [])

  const simpanServer = async (patch: Setelan) => {
    setSetelan((s) => ({ ...s, ...patch }))
    if (!backendEnabled) return
    try {
      // Selisih zona waktu ikut disimpan setiap kali, bukan sekali saat
      // mendaftar: orang berpindah zona waktu, dan pengingat pukul 17.00 yang
      // berbunyi pukul 20.00 sesudah terbang adalah pengingat yang rusak.
      await api.saveSettings({ ...patch, tzOffsetMin: -new Date().getTimezoneOffset() })
    } catch { /* gagal simpan — saklar tetap sesuai yang dilihat, dicoba lagi nanti */ }
  }

  const pushNyala = push === 'enabled'

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Pengingat</h2>
      </div>

      <div className="kaca rounded-3xl px-3 py-1">
        {/* Keadaan push disebut lebih dahulu, karena dua saklar di bawahnya
            bergantung padanya. Menaruhnya di bawah membuat orang menyalakan
            saklar yang tidak akan pernah berbunyi. */}
        {/* Satu tombol yang mengerjakan KETIGA langkahnya sekaligus — izin,
            langganan, dan jenis pengingat bawaan. Sebelum ini langkah ketiga
            tidak pernah disebutkan, dan yang melewatkannya mendapat lencana
            hijau beserta kesunyian. */}
        {!pushNyala && (
          <div className="py-2">
            <SaklarNotifikasi onSelesai={() => { void pushStatus().then(setPush); if (backendEnabled) void api.getSettings().then((s) => setSetelan((s ?? {}) as Setelan)).catch(() => {}) }} />
          </div>
        )}

        <div className="border-t border-neutral-100 dark:border-white/10">
          <Baris
            judul="Latihan harian"
            catatan={pushNyala ? 'Dikirim server, sampai walau aplikasi ditutup' : 'Nyalakan notifikasi dahulu'}
            kanan={
              <span className="flex shrink-0 items-center gap-2">
                <input
                  type="time"
                  value={setelan.latihanHHMM ?? '17:00'}
                  onChange={(e) => void simpanServer({ latihanHHMM: e.target.value })}
                  aria-label="Jam pengingat latihan"
                  className="t-kecil rounded-lg border border-neutral-200 bg-transparent px-1.5 py-1 tabular-nums text-ink dark:border-white/12 dark:text-white"
                />
                <Saklar
                  label="Pengingat latihan harian"
                  nyala={!!setelan.notifLatihan && pushNyala}
                  onUbah={(v) => void simpanServer({ notifLatihan: v, latihanHHMM: setelan.latihanHHMM ?? '17:00' })}
                />
              </span>
            }
          />
        </div>

        <div className="border-t border-neutral-100 dark:border-white/10">
          <Baris
            judul="Gol tim yang dibintangi"
            catatan={pushNyala ? 'Gol dan peluit akhir, diperiksa server tiap 90 detik' : 'Nyalakan notifikasi dahulu'}
            kanan={
              <Saklar
                label="Notifikasi gol tim"
                nyala={setelan.sportsNotif !== false && pushNyala}
                onUbah={(v) => void simpanServer({ sportsNotif: v })}
              />
            }
          />
        </div>

        {/* Pengingat SEBELUM waktu salat, dikirim server — beda benda dengan
            baris Adzan di bawahnya, dan bedanya disebut supaya tidak dikira
            saklar yang sama. Yang ini sampai walau aplikasi ditutup, tetapi
            berupa notifikasi biasa; yang di bawah berbunyi dan bergetar,
            tetapi hanya selama aplikasi terbuka. */}
        <div className="border-t border-neutral-100 dark:border-white/10">
          <Baris
            judul="Menjelang waktu salat"
            catatan={pushNyala ? `${setelan.salatLeadMin ?? 5} menit sebelumnya · ${setelan.salatKota ?? adzan.kota}` : 'Nyalakan notifikasi dahulu'}
            kanan={
              <span className="flex shrink-0 items-center gap-2">
                <select
                  value={String(setelan.salatLeadMin ?? 5)}
                  onChange={(e) => void simpanServer({ salatLeadMin: Number(e.target.value), salatKota: adzan.kota, salatNegara: adzan.negara, salatMetode: adzan.metode } as Setelan)}
                  aria-label="Berapa menit sebelum waktu salat"
                  className="t-kecil rounded-lg border border-neutral-200 bg-transparent px-1.5 py-1 tabular-nums text-ink dark:border-white/12 dark:text-white"
                >
                  {[0, 2, 5, 10, 15].map((m) => (
                    <option key={m} value={m}>{m === 0 ? 'tepat' : `${m} mnt`}</option>
                  ))}
                </select>
                <Saklar
                  label="Pengingat menjelang salat"
                  nyala={!!setelan.notifSalat && pushNyala}
                  onUbah={(v) => void simpanServer({
                    notifSalat: v,
                    salatLeadMin: setelan.salatLeadMin ?? 5,
                    salatKota: adzan.kota,
                    salatNegara: adzan.negara,
                    salatMetode: adzan.metode,
                  } as Setelan)}
                />
              </span>
            }
          />
        </div>

        <div className="border-t border-neutral-100 dark:border-white/10">
          <Baris
            judul="Adzan"
            catatan={adzan.aktif ? `Bunyi${adzan.getar ? ' + getar' : ''} · hanya saat aplikasi terbuka` : 'Bunyi di dalam aplikasi · mati'}
            kanan={
              <span className="flex shrink-0 items-center gap-2">
                {adzan.aktif && (
                  <button
                    onClick={() => { const b = { ...adzan, getar: !adzan.getar }; setAdzan(b); simpanSetelan(b) }}
                    aria-label="Getar saat adzan"
                    aria-pressed={adzan.getar}
                    className={`t-mikro min-h-[40px] rounded-lg px-2 font-black ${
                      adzan.getar ? 'bg-brand/15 text-brand-dark dark:text-brand' : 'text-neutral-400'
                    }`}
                  >
                    Getar
                  </button>
                )}
                <Saklar
                  label="Pengingat adzan"
                  nyala={adzan.aktif}
                  onUbah={(v) => { const b = { ...adzan, aktif: v }; setAdzan(b); simpanSetelan(b) }}
                />
              </span>
            }
          />
        </div>

        {/* ── Notifikasi berbasis keadaan ─────────────────────────────────
            Tiga saklar di atas berbunyi pada JAM yang ditentukan; yang di
            bawah ini hanya berbunyi bila SYARATNYA terpenuhi. Bedanya
            disebut karena harapan yang salah adalah cara tercepat membuat
            orang mematikan seluruh notifikasi. */}
        <div className="border-t border-neutral-100 pt-2 dark:border-white/10">
          <p className="t-mikro pb-1 font-black uppercase tracking-wide text-neutral-500">Berdasarkan keadaan</p>
          {KATEGORI.map((c) => (
            <div key={String(c.kunci)} className="border-t border-neutral-100 first:border-t-0 dark:border-white/10">
              <Baris
                judul={c.judul}
                catatan={pushNyala ? c.contoh : 'Nyalakan notifikasi dahulu'}
                kanan={
                  <Saklar
                    label={c.judul}
                    nyala={!!setelan[c.kunci] && pushNyala}
                    onUbah={(v) => void simpanServer({ [c.kunci]: v } as Setelan)}
                  />
                }
              />
            </div>
          ))}

          {/* KUOTA DAN JAM SENYAP ADA DI SINI, bukan tersembunyi di
              pengaturan: keduanya yang menentukan apakah aplikasi ini masih
              boleh menyela hidup orang besok. */}
          <div className="flex items-center gap-2 border-t border-neutral-100 py-2 dark:border-white/10">
            <span className="min-w-0 flex-1">
              <span className="t-kecil block truncate font-bold text-ink dark:text-white">Paling banyak per hari</span>
              <span className="t-mikro block truncate text-neutral-400">Sesudah kuota habis, sisanya menunggu besok</span>
            </span>
            <select
              value={String(setelan.notifKuota ?? 6)}
              onChange={(e) => void simpanServer({ notifKuota: Number(e.target.value) })}
              aria-label="Kuota notifikasi harian"
              className="t-kecil shrink-0 rounded-lg border border-neutral-200 bg-transparent px-1.5 py-1 tabular-nums text-ink dark:border-white/12 dark:text-white"
            >
              {[2, 4, 6, 8, 12].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 border-t border-neutral-100 py-2 dark:border-white/10">
            <span className="min-w-0 flex-1">
              <span className="t-kecil block truncate font-bold text-ink dark:text-white">Jam senyap</span>
              <span className="t-mikro block truncate text-neutral-400">Tidak ada yang dikirim pada jam ini</span>
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <input
                type="time"
                value={jamDariMenit(setelan.notifSenyapMulai ?? 22 * 60)}
                onChange={(e) => void simpanServer({ notifSenyapMulai: menitDariJam(e.target.value) })}
                aria-label="Jam senyap mulai"
                className="t-kecil rounded-lg border border-neutral-200 bg-transparent px-1 py-1 tabular-nums text-ink dark:border-white/12 dark:text-white"
              />
              <span className="t-mikro text-neutral-400">–</span>
              <input
                type="time"
                value={jamDariMenit(setelan.notifSenyapSelesai ?? 6 * 60)}
                onChange={(e) => void simpanServer({ notifSenyapSelesai: menitDariJam(e.target.value) })}
                aria-label="Jam senyap selesai"
                className="t-kecil rounded-lg border border-neutral-200 bg-transparent px-1 py-1 tabular-nums text-ink dark:border-white/12 dark:text-white"
              />
            </span>
          </div>
        </div>

        <DiagnosaNotifikasi setelan={setelan as Record<string, unknown>} />
      </div>
    </section>
  )
}

export default UbinNotifikasi

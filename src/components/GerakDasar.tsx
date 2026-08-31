// ─────────────────────────────────────────────────────────────────────────────
// Diagram lima gerakan dasar: push-up, sit-up, pull-up, burpee, jumping jack.
//
// KENAPA SVG DIGAMBAR SENDIRI, BUKAN GAMBAR YANG DIBANGKITKAN AI.
//
// Permintaannya adalah gambar untuk tiap tingkat gerakan. Gambar hasil
// pembangkit AI sekilas tampak meyakinkan dan hampir selalu salah pada hal
// yang justru diajarkan halaman ini: siku yang mengembang ke samping, punggung
// yang melengkung, lutut yang jatuh ke dalam. Pada halaman yang mengajarkan
// TEKNIK, gambar yang posisinya keliru bukan hiasan yang kurang bagus — ia
// mengajarkan gerakan yang salah kepada orang yang datang untuk belajar.
//
// Berkas ini mengikuti pendirian yang sudah dipakai SkillDiagrams.tsx dan
// MorfologiLesi.tsx: digambar sendiri, tidak diunduh dari mana pun, tetap tajam
// di semua ukuran layar, ikut mode gelap, dan bekerja tanpa jaringan.
//
// TIAP GERAKAN DIGAMBAR DUA POSISI — awal dan akhir — sebab yang membingungkan
// pemula hampir selalu bukan bentuk satu posisi, melainkan APA YANG BERUBAH di
// antara keduanya.
// ─────────────────────────────────────────────────────────────────────────────

interface Pose {
  /** Titik sendi: kepala, bahu, siku, tangan, pinggul, lutut, kaki. */
  kepala: [number, number]
  bahu: [number, number]
  siku: [number, number]
  tangan: [number, number]
  pinggul: [number, number]
  lutut: [number, number]
  kaki: [number, number]
  /** Anggota badan sisi JAUH, digambar lebih pudar. */
  sikuJauh?: [number, number]
  tanganJauh?: [number, number]
  lututJauh?: [number, number]
  kakiJauh?: [number, number]
}

/**
 * ANGGOTA BADAN SISI JAUH DIGAMBAR LEBIH PUDAR, dan itu bukan hiasan.
 *
 * Pada tampak samping, lengan dan tungkai sisi jauh jatuh tepat di atas yang
 * dekat, sehingga sosoknya menyusut menjadi beberapa garis yang tidak lagi
 * terbaca sebagai manusia. Menggesernya sedikit dan memudarkannya adalah cara
 * baku pada gambar anatomi, dan tanpa itu gambar ini gagal pada satu-satunya
 * hal yang harus ia kerjakan: menunjukkan bentuk gerakan.
 */
function Orang({ p, warna = 'currentColor', tebal = 3.5 }: { p: Pose; warna?: string; tebal?: number }) {
  const garis = (a: [number, number], b: [number, number], k: string, pudar = false) => (
    <line
      x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}
      stroke={warna} strokeWidth={pudar ? tebal - 1 : tebal} strokeLinecap="round"
      opacity={pudar ? 0.32 : 1}
      key={k}
    />
  )
  return (
    <g>
      {p.sikuJauh && garis(p.bahu, p.sikuJauh, 'lenganAtasJauh', true)}
      {p.sikuJauh && p.tanganJauh && garis(p.sikuJauh, p.tanganJauh, 'lenganBawahJauh', true)}
      {p.lututJauh && garis(p.pinggul, p.lututJauh, 'pahaJauh', true)}
      {p.lututJauh && p.kakiJauh && garis(p.lututJauh, p.kakiJauh, 'betisJauh', true)}
      {garis(p.bahu, p.pinggul, 'badan')}
      {garis(p.pinggul, p.lutut, 'paha')}
      {garis(p.lutut, p.kaki, 'betis')}
      {garis(p.bahu, p.siku, 'lenganAtas')}
      {garis(p.siku, p.tangan, 'lenganBawah')}
      {/* LEHER. Tanpa garis pendek ini kepala tampak melayang lepas dari badan
          pada posisi telungkup, dan sosoknya berhenti terbaca sebagai orang. */}
      {garis(p.bahu, p.kepala, 'leher')}
      <circle cx={p.kepala[0]} cy={p.kepala[1]} r={7} fill={warna} />
    </g>
  )
}

function Panel({
  judul, awal, akhir, labelAwal, labelAkhir, kunci, garisBantu,
}: {
  judul: string
  awal: Pose
  akhir: Pose
  labelAwal: string
  labelAkhir: string
  kunci: string
  garisBantu?: { a: [number, number]; b: [number, number]; teks: string }
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
      <div className="text-[13px] font-black text-ink dark:text-white">{judul}</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {[
          { p: awal, l: labelAwal },
          { p: akhir, l: labelAkhir },
        ].map((x, i) => (
          <div key={i} className="rounded-xl bg-neutral-50 p-2 dark:bg-white/5">
            <svg
              viewBox="0 0 160 120"
              className="w-full text-ink dark:text-white"
              role="img"
              aria-label={`${judul} — ${x.l}`}
            >
              {/* lantai */}
              <line x1="6" y1="112" x2="154" y2="112" className="stroke-neutral-300 dark:stroke-white/20" strokeWidth="2" />
              {i === 1 && garisBantu && (
                <>
                  <line
                    x1={garisBantu.a[0]} y1={garisBantu.a[1]} x2={garisBantu.b[0]} y2={garisBantu.b[1]}
                    className="stroke-emerald-500" strokeWidth="1.5" strokeDasharray="4 3"
                  />
                  <text x="6" y="14" className="fill-emerald-600 text-[8px] font-bold dark:fill-emerald-400">
                    {garisBantu.teks}
                  </text>
                </>
              )}
              <Orang p={x.p} />
            </svg>
            <div className="mt-0.5 text-center text-[10px] font-bold text-neutral-500">{x.l}</div>
          </div>
        ))}
      </div>
      <p className="mt-2 rounded-lg bg-amber-500/10 p-2 text-[11.5px] leading-snug text-amber-900 dark:text-amber-200">
        <b>The key: </b>{kunci}
      </p>
    </div>
  )
}

// ── Pose ─────────────────────────────────────────────────────────────────────
// Koordinat ditulis apa adanya, bukan dihitung, supaya tiap posisi dapat
// diperiksa dengan mata dan diperbaiki satu titik pada satu waktu. Lantai ada
// pada y = 112.

// PUSH-UP, tampak samping. Kepala di kanan, kaki di kiri.
const PUSHUP_ATAS: Pose = {
  kepala: [126, 52], bahu: [112, 60], siku: [110, 84], tangan: [108, 108],
  pinggul: [66, 76], lutut: [42, 88], kaki: [16, 104],
  sikuJauh: [118, 84], tanganJauh: [116, 108], lututJauh: [44, 92], kakiJauh: [18, 108],
}
const PUSHUP_BAWAH: Pose = {
  kepala: [128, 80], bahu: [114, 86], siku: [98, 72], tangan: [108, 108],
  pinggul: [66, 94], lutut: [42, 100], kaki: [16, 108],
  sikuJauh: [104, 74], tanganJauh: [116, 108], lututJauh: [44, 103], kakiJauh: [18, 110],
}

// SIT-UP, tampak samping. Kepala di kiri, lutut menekuk di kanan.
const SITUP_BAWAH: Pose = {
  kepala: [26, 96], bahu: [44, 100], siku: [50, 86], tangan: [40, 80],
  pinggul: [88, 104], lutut: [110, 72], kaki: [130, 108],
  lututJauh: [114, 78], kakiJauh: [134, 110],
}
const SITUP_ATAS: Pose = {
  kepala: [70, 50], bahu: [76, 64], siku: [66, 58], tangan: [58, 62],
  pinggul: [88, 104], lutut: [110, 72], kaki: [130, 108],
  lututJauh: [114, 78], kakiJauh: [134, 110],
}

// PULL-UP, tampak depan. Lengan dibuka ke palang supaya keduanya terlihat.
const PULLUP_BAWAH: Pose = {
  kepala: [80, 50], bahu: [80, 62], siku: [98, 44], tangan: [112, 26],
  pinggul: [80, 88], lutut: [82, 104], kaki: [86, 112],
  sikuJauh: [62, 44], tanganJauh: [48, 26], lututJauh: [74, 104], kakiJauh: [70, 112],
}
const PULLUP_ATAS: Pose = {
  kepala: [80, 34], bahu: [80, 46], siku: [102, 42], tangan: [112, 26],
  pinggul: [80, 72], lutut: [88, 90], kaki: [80, 100],
  sikuJauh: [58, 42], tanganJauh: [48, 26], lututJauh: [72, 90], kakiJauh: [80, 100],
}

// BURPEE: jongkok tangan di lantai, lalu melompat ke posisi papan.
const BURPEE_JONGKOK: Pose = {
  kepala: [64, 68], bahu: [72, 80], siku: [80, 94], tangan: [86, 108],
  pinggul: [92, 96], lutut: [78, 104], kaki: [66, 110],
  lututJauh: [82, 100], kakiJauh: [70, 108],
}
const BURPEE_PAPAN: Pose = {
  kepala: [126, 54], bahu: [112, 62], siku: [110, 86], tangan: [108, 108],
  pinggul: [66, 78], lutut: [42, 90], kaki: [16, 106],
  sikuJauh: [118, 86], tanganJauh: [116, 108], lututJauh: [44, 94], kakiJauh: [18, 110],
}

// JUMPING JACK, tampak depan.
const JJ_TUTUP: Pose = {
  kepala: [80, 28], bahu: [80, 42], siku: [88, 60], tangan: [90, 78],
  pinggul: [80, 78], lutut: [84, 96], kaki: [84, 112],
  sikuJauh: [72, 60], tanganJauh: [70, 78], lututJauh: [76, 96], kakiJauh: [76, 112],
}
const JJ_BUKA: Pose = {
  kepala: [80, 30], bahu: [80, 44], siku: [100, 34], tangan: [116, 20],
  pinggul: [80, 78], lutut: [98, 96], kaki: [116, 110],
  sikuJauh: [60, 34], tanganJauh: [44, 20], lututJauh: [62, 96], kakiJauh: [44, 110],
}

export function GerakDasar() {
  return (
    <div className="space-y-2">
      <Panel
        judul="Push-up"
        awal={PUSHUP_ATAS}
        akhir={PUSHUP_BAWAH}
        labelAwal="Top — body in one line"
        labelAkhir="Bottom — chest close to the floor"
        garisBantu={{ a: [14, 106], b: [126, 82], teks: 'ear → heel in one line' }}
        kunci="Elbows at about 45° from the body, not flared to 90°. Flared elbows load the shoulder joint rather than the chest — the most common cause of shoulder pain in push-ups."
      />
      <Panel
        judul="Sit-up"
        awal={SITUP_BAWAH}
        akhir={SITUP_ATAS}
        labelAwal="Bottom — back flat on the floor"
        labelAkhir="Top — shoulders lifted"
        garisBantu={{ a: [62, 58], b: [92, 100], teks: 'neck relaxed, chin not pulled in' }}
        kunci="Lift until the shoulder blades leave the floor, and let the neck stay relaxed. Pulling the head with your hands moves the work from the abdomen to the neck."
      />
      <Panel
        judul="Pull-up"
        awal={PULLUP_BAWAH}
        akhir={PULLUP_ATAS}
        labelAwal="Bottom — active hang"
        labelAkhir="Top — chin over the bar"
        garisBantu={{ a: [40, 26], b: [120, 26], teks: 'bar' }}
        kunci="Pull the shoulders down away from the ears BEFORE pulling up. Hanging passively then jerking is the fastest way to injure an elbow."
      />
      <Panel
        judul="Burpee"
        awal={BURPEE_JONGKOK}
        akhir={BURPEE_PAPAN}
        labelAwal="Squat — hands on the floor"
        labelAkhir="Plank — hips not sagging"
        garisBantu={{ a: [14, 108], b: [126, 58], teks: 'hips level with shoulders' }}
        kunci="The hips must not sag when the feet are thrown back. An arched back in the plank position is where lower-back injuries in burpees happen."
      />
      <Panel
        judul="Jumping jack"
        awal={JJ_TUTUP}
        akhir={JJ_BUKA}
        labelAwal="Closed — feet together"
        labelAkhir="Open — arms and legs out"
        kunci="Land with the knees slightly bent and the forefoot first. Landing with locked knees passes the whole impact into the knees and back."
      />
      <p className="px-1 text-[10.5px] leading-relaxed text-neutral-500">
        Every drawing above is authored as SVG inside this app — not downloaded, not copied, and not generated by an
        image model. On a page teaching technique, a drawing with the joints in the wrong place teaches the wrong
        movement to the person who came to learn.
      </p>
    </div>
  )
}

export default GerakDasar

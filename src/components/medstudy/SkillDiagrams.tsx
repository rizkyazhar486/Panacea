// ─────────────────────────────────────────────────────────────────────────────
// Diagram untuk halaman Keterampilan Klinis.
//
// SEMUA diagram di bawah ini DIGAMBAR SENDIRI sebagai SVG. Tidak ada gambar
// yang diunduh atau disalin dari internet maupun buku ajar — ilustrasi medis
// di sana dilindungi hak cipta dan tidak boleh didistribusikan ulang di dalam
// aplikasi ini. SVG orisinal juga tetap tajam pada semua ukuran layar, ringan,
// dan otomatis mengikuti mode terang maupun gelap.
// ─────────────────────────────────────────────────────────────────────────────

const SKIN = 'currentColor'

/** Sudut penyuntikan: intrakutan, subkutan, intramuskular. */
export function InjectionAnglesDiagram() {
  const rows = [
    { label: 'Intrakutan (IC)', angle: '5-15°', deg: 12, depth: 'Dermis', note: 'BCG, Mantoux — terbentuk wheal' },
    { label: 'Subkutan (SC)', angle: '45°', deg: 45, depth: 'Subkutis', note: 'Campak/MR, insulin — kulit dicubit' },
    { label: 'Intramuskular (IM)', angle: '90°', deg: 90, depth: 'Otot', note: 'DPT-HB-Hib, vitamin K1 — kulit diregangkan' },
  ]

  return (
    <div className="space-y-3">
      {rows.map((r) => {
        // Titik tusuk pada (120, 46) — permukaan kulit.
        const rad = (r.deg * Math.PI) / 180
        const len = 62
        const x2 = 120 - Math.cos(rad) * len
        const y2 = 46 - Math.sin(rad) * len
        return (
          <div key={r.label} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[12px] font-black text-ink dark:text-white">{r.label}</span>
              <span className="text-[12px] font-black text-brand-dark">{r.angle}</span>
            </div>
            <svg viewBox="0 0 240 100" className="mt-1 w-full" role="img" aria-label={`Sudut penyuntikan ${r.label} ${r.angle}`}>
              {/* lapisan kulit */}
              <rect x="10" y="40" width="220" height="12" className="fill-amber-200/70 dark:fill-amber-300/30" />
              <rect x="10" y="52" width="220" height="16" className="fill-yellow-100/80 dark:fill-yellow-200/20" />
              <rect x="10" y="68" width="220" height="18" className="fill-rose-200/70 dark:fill-rose-300/25" />
              <text x="14" y="49" className="fill-neutral-500 text-[7px] dark:fill-neutral-400">Epidermis/Dermis</text>
              <text x="14" y="63" className="fill-neutral-500 text-[7px] dark:fill-neutral-400">Subkutis</text>
              <text x="14" y="80" className="fill-neutral-500 text-[7px] dark:fill-neutral-400">Otot</text>
              {/* jarum */}
              <line x1={x2} y1={y2} x2={120} y2={46} stroke={SKIN} strokeWidth="2.5" className="text-brand" strokeLinecap="round" />
              {/* ujung jarum menunjukkan kedalaman */}
              <circle cx="120" cy="46" r="2.5" className="fill-brand" />
              {/* busur sudut */}
              <path d="M 150 46 A 30 30 0 0 0 150 46" fill="none" />
              <line x1="120" y1="46" x2="195" y2="46" stroke={SKIN} strokeWidth="1" strokeDasharray="3 3" className="text-neutral-500" />
              <text x="198" y="49" className="fill-neutral-500 text-[8px] font-bold dark:fill-neutral-400">{r.angle}</text>
            </svg>
            <p className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-500">
              Target: <span className="font-bold">{r.depth}</span> · {r.note}
            </p>
          </div>
        )
      })}
    </div>
  )
}

/** Kode warna dan laju aliran kanula IV. */
export function IvGaugesDiagram() {
  const gauges = [
    { g: '14 G', color: '#f97316', flow: '~270', use: 'Trauma mayor, transfusi masif', w: 30 },
    { g: '16 G', color: '#9ca3af', flow: '~180', use: 'Resusitasi cairan, bedah besar', w: 26 },
    { g: '18 G', color: '#22c55e', flow: '~90', use: 'Transfusi darah, cairan kental', w: 22 },
    { g: '20 G', color: '#ec4899', flow: '~60', use: 'Pilihan umum dewasa', w: 18 },
    { g: '22 G', color: '#3b82f6', flow: '~36', use: 'Anak, lansia, vena kecil', w: 14 },
    { g: '24 G', color: '#eab308', flow: '~20', use: 'Neonatus dan bayi', w: 10 },
  ]
  return (
    <div className="space-y-1.5">
      {gauges.map((x) => (
        <div key={x.g} className="flex items-center gap-2.5 rounded-lg bg-neutral-50 p-2 dark:bg-white/5">
          <svg viewBox="0 0 60 30" className="h-7 w-14 shrink-0" role="img" aria-label={`Kanula ${x.g}`}>
            <rect x="2" y={15 - x.w / 4} width="34" height={x.w / 2} rx="2" fill={x.color} />
            <polygon points={`36,${15 - x.w / 4} 56,15 36,${15 + x.w / 4}`} fill={x.color} opacity="0.85" />
          </svg>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[12px] font-black text-ink dark:text-white">{x.g}</span>
              <span className="text-[11px] font-bold text-brand-dark">{x.flow} mL/mnt</span>
            </div>
            <p className="truncate text-[11px] text-neutral-500 dark:text-neutral-500">{x.use}</p>
          </div>
        </div>
      ))}
      <p className="px-1 pt-1 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-500">
        Angka gauge makin <span className="font-bold">kecil</span> berarti diameter makin{' '}
        <span className="font-bold">besar</span> dan aliran makin cepat. Untuk resusitasi pilih kanula{' '}
        <span className="font-bold">pendek dan besar</span> — aliran sebanding pangkat empat jari-jari
        dan berbanding terbalik dengan panjang (Hagen-Poiseuille).
      </p>
    </div>
  )
}

/** Urutan primary survey ATLS. */
export function AbcdeDiagram() {
  const steps = [
    { k: 'A', t: 'Airway', d: 'Jalan napas + proteksi servikal', c: 'bg-rose-500' },
    { k: 'B', t: 'Breathing', d: 'Ventilasi & oksigenasi', c: 'bg-orange-500' },
    { k: 'C', t: 'Circulation', d: 'Perfusi & kontrol perdarahan', c: 'bg-amber-500' },
    { k: 'D', t: 'Disability', d: 'GCS, pupil, gula darah', c: 'bg-emerald-500' },
    { k: 'E', t: 'Exposure', d: 'Buka pakaian, cegah hipotermia', c: 'bg-sky-500' },
  ]
  return (
    <div className="space-y-1.5">
      {steps.map((s, i) => (
        <div key={s.k} className="flex items-center gap-2.5">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${s.c} text-base font-black text-white`}>
            {s.k}
          </div>
          <div className="min-w-0 flex-1 rounded-lg bg-neutral-50 px-3 py-1.5 dark:bg-white/5">
            <div className="text-[12px] font-black text-ink dark:text-white">{s.t}</div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-500">{s.d}</div>
          </div>
          {i < steps.length - 1 && <span className="shrink-0 text-neutral-300">↓</span>}
        </div>
      ))}
      <p className="px-1 pt-1 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-500">
        Kerjakan <span className="font-bold">berurutan</span>. Jangan lanjut ke huruf berikutnya sebelum
        masalah pada huruf sebelumnya teratasi, dan <span className="font-bold">ulangi dari A</span>{' '}
        setiap kali kondisi pasien berubah.
      </p>
    </div>
  )
}

/** Pola jahitan dasar dan penampang jahitan yang benar. */
export function SuturePatternsDiagram() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
        <div className="text-[12px] font-black text-ink dark:text-white">Simpul terputus (simple interrupted)</div>
        <svg viewBox="0 0 240 70" className="mt-1 w-full" role="img" aria-label="Pola jahitan simpul terputus">
          {/* kulit */}
          <rect x="10" y="28" width="220" height="16" className="fill-amber-200/70 dark:fill-amber-300/25" />
          {/* garis luka */}
          <line x1="120" y1="26" x2="120" y2="46" stroke={SKIN} strokeWidth="1.5" className="text-rose-500" strokeDasharray="2 2" />
          {/* jahitan */}
          {[55, 85, 155, 185].map((x) => (
            <g key={x}>
              <path d={`M ${x} 24 L ${x} 48`} stroke={SKIN} strokeWidth="1.8" className="text-brand" fill="none" />
            </g>
          ))}
          {[70, 170].map((x) => (
            <g key={x}>
              <path d={`M ${x - 15} 24 Q ${x} 12 ${x + 15} 24`} stroke={SKIN} strokeWidth="1.8" className="text-brand" fill="none" />
              <path d={`M ${x - 15} 48 Q ${x} 58 ${x + 15} 48`} stroke={SKIN} strokeWidth="1.8" className="text-brand" fill="none" />
              <circle cx={x + 6} cy="18" r="2" className="fill-brand" />
            </g>
          ))}
          <text x="12" y="66" className="fill-neutral-500 text-[7px] dark:fill-neutral-400">
            Jarak antarjahitan ≈ jarak jahitan ke tepi luka · simpul diletakkan di satu sisi, bukan di atas garis luka
          </text>
        </svg>
      </div>

      <div className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
        <div className="text-[12px] font-black text-ink dark:text-white">Penampang — kedalaman & eversi tepi</div>
        <svg viewBox="0 0 240 86" className="mt-1 w-full" role="img" aria-label="Penampang jahitan dengan eversi tepi luka">
          {/* BENAR */}
          <text x="12" y="12" className="fill-emerald-600 text-[8px] font-bold dark:fill-emerald-400">BENAR — tepi eversi, kedalaman sama</text>
          <path d="M 20 34 Q 50 30 58 24" className="fill-none stroke-amber-300 dark:stroke-amber-300/50" strokeWidth="9" />
          <path d="M 100 24 Q 108 30 138 34" className="fill-none stroke-amber-300 dark:stroke-amber-300/50" strokeWidth="9" />
          <path d="M 46 20 C 52 44, 106 44, 112 20" stroke={SKIN} strokeWidth="1.8" className="text-brand" fill="none" />
          <circle cx="79" cy="17" r="2.5" className="fill-brand" />

          {/* SALAH */}
          <text x="12" y="60" className="fill-rose-600 text-[8px] font-bold dark:fill-rose-400">SALAH — tepi inversi / kedalaman tidak sama</text>
          <path d="M 20 78 Q 52 74 62 80" className="fill-none stroke-amber-300 dark:stroke-amber-300/50" strokeWidth="9" />
          <path d="M 96 80 Q 106 70 138 74" className="fill-none stroke-amber-300 dark:stroke-amber-300/50" strokeWidth="9" />
          <path d="M 48 70 C 54 88, 104 84, 110 66" stroke={SKIN} strokeWidth="1.8" className="text-rose-400" fill="none" />

          <text x="150" y="34" className="fill-neutral-500 text-[7px] dark:fill-neutral-400">Tepi sedikit terangkat</text>
          <text x="150" y="44" className="fill-neutral-500 text-[7px] dark:fill-neutral-400">→ parut lebih halus</text>
          <text x="150" y="78" className="fill-neutral-500 text-[7px] dark:fill-neutral-400">Tepi masuk / bertingkat</text>
          <text x="150" y="86" className="fill-neutral-500 text-[7px] dark:fill-neutral-400">→ parut lebih jelas</text>
        </svg>
      </div>

      <p className="px-1 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-500">
        Ambil <span className="font-bold">kedalaman yang sama</span> pada kedua tepi agar luka bertemu
        rata. Ikat secukupnya untuk mendekatkan tepi —{' '}
        <span className="font-bold">jangan terlalu kencang</span>, karena edema akan membuat tepi luka
        iskemik dan nekrosis.
      </p>
    </div>
  )
}

export function SkillDiagram({ kind }: { kind: string }) {
  if (kind === 'injectionAngles') return <InjectionAnglesDiagram />
  if (kind === 'ivGauges') return <IvGaugesDiagram />
  if (kind === 'abcde') return <AbcdeDiagram />
  if (kind === 'suturePatterns') return <SuturePatternsDiagram />
  return null
}

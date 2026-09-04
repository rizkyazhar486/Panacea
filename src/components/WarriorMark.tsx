// Siluet figur berdiri, gaya garis tipis — elemen dekoratif latar untuk kartu
// metal-forge/metal-spotlight (lihat referensi gambar sketsa prajurit).
// Murni hiasan; disembunyikan dari pembaca layar.
export function WarriorMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 220" className={className} aria-hidden="true" fill="none">
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.9">
        <circle cx="52" cy="20" r="12" />
        <path d="M52 32 C46 40 44 52 46 66 C47 78 44 92 42 104" />
        <path d="M52 32 C58 42 60 54 58 66 C57 80 60 94 62 104" />
        <path d="M46 66 C40 70 34 78 30 88" />
        <path d="M58 66 C64 72 68 80 70 90" />
        <path d="M42 104 C40 128 38 150 36 172 L34 208" />
        <path d="M62 104 C63 128 64 150 66 172 L68 208" />
        <path d="M34 208 L20 214" />
        <path d="M68 208 L82 214" />
      </g>
    </svg>
  )
}

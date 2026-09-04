import '../styles/metal.css'

// Efek gema baris berulang seperti pada referensi "FOCUS ON THE MISSION" —
// satu kalimat pendek, ditumpuk beberapa kali, hanya baris tengah yang
// menyala. Murni dekoratif teks, bukan sumber informasi baru.
export function MetalMotto({ text, repeat = 4 }: { text: string; repeat?: number }) {
  const rows = Array.from({ length: repeat * 2 + 1 }, (_, i) => i === repeat)
  return (
    <div className="metal-motto text-[13px] sm:text-base" aria-label={text}>
      {rows.map((active, i) => (
        <span key={i} data-active={active} aria-hidden={!active}>{text}</span>
      ))}
    </div>
  )
}

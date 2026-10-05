import { WORKOUT_MUSCLE_GROUPS } from './workoutMuscles'
import { penjelasanOrgan } from './organExplain'
import { SISTEM_FISIOLOGI } from './physiology'
import { ORGAN_FOCUS } from './organFocus'
import { humanizeStructureName } from '../components/Body3D'
import { jenisDariNamaStruktur } from '../domains/body-exposure/engine/jenisStruktur'
import { faktaMilikOrgan } from '../domains/body-exposure/engine/faktaMilikOrgan'

// ─────────────────────────────────────────────────────────────────────────────
// PENJELASAN YANG SELALU ADA.
//
// Layar sebelumnya menampilkan "No explanation was generated" begitu model
// bahasa mati, belum dipasang, atau kena batas laju — dan itu terjadi pada
// hal-hal yang justru paling dasar, seperti "otot punggung". Pesan itu tidak
// memberi tahu apa pun dan tidak bisa diperbaiki oleh pembacanya.
//
// Berkas ini membalik urutannya. Penjelasan TERTULIS dibangun lebih dulu dari
// data aplikasi sendiri — selalu tersedia, termasuk luring — dan model bahasa
// menjadi TAMBAHAN di atasnya, bukan sumber tunggalnya. Kalau model tersedia,
// pembaca dapat keduanya; kalau tidak, ia tetap dapat penjelasan sungguhan.
//
// Tidak ada jalur di sini yang bisa berakhir dengan teks kosong.
// ─────────────────────────────────────────────────────────────────────────────

/** Sumber penjelasan, ditampilkan supaya pembaca tahu ini tulisan atau AI. */
export type SumberPenjelasan = 'tertulis' | 'ai'

export interface Penjelasan {
  teks: string
  sumber: SumberPenjelasan
}

/** Penjelasan tertulis untuk satu kelompok otot latihan. */
function untukOtot(label: string): string | null {
  const g = WORKOUT_MUSCLE_GROUPS.find(
    (x) => label.toLowerCase().startsWith(x.label.toLowerCase()),
  )
  if (!g) return null
  const p = g.penjelasan
  return [
    `**Which muscles.** ${p.otot}`,
    `**What they do.** ${p.aksi}`,
    `**How to train them.** ${p.latihan}`,
    `**What goes wrong.** ${p.hatiHati}`,
  ].join('\n\n')
}

/** Penjelasan tertulis untuk satu organ, dari organExplain + physiology. */
function untukOrgan(label: string): string | null {
  const fokus = ORGAN_FOCUS.find((o) => o.label.toLowerCase() === label.toLowerCase())
  const pen = fokus ? penjelasanOrgan(fokus.key) : undefined
  if (!pen) return null
  const bagian = [
    `**What it is.** ${pen.definisi}`,
    `**What it does.** ${pen.fungsi.join(' ')}`,
    `**How it works.** ${pen.caraKerja}`,
  ]
  if (pen.fakta?.length) bagian.push(`**Worth knowing.** ${pen.fakta.join('. ')}.`)
  if (pen.bawaan.length) {
    bagian.push(`**Congenital conditions.** ${pen.bawaan.map((b) => b.nama).join(', ')} — each is explained in the dossier below.`)
  }
  return bagian.join('\n\n')
}

/** Penjelasan tertulis untuk satu sistem faal. */
function untukSistem(label: string): string | null {
  const f = SISTEM_FISIOLOGI.find((x) => x.label.toLowerCase() === label.toLowerCase())
  if (!f) return null
  return [
    `**What this system does.** ${f.fungsi}`,
    `**How it works.** ${f.proses.join(' ')}`,
    `**What controls it.** ${f.regulasi}`,
    `**Under exercise.** ${f.saatOlahraga}`,
  ].join('\n\n')
}

/**
 * Penjelasan untuk satu struktur anatomi yang disentuh di model 3D.
 *
 * Nama nyatanya sendiri sudah memuat banyak keterangan — sisi kiri/kanan,
 * jenis jaringan, dan bagian tubuhnya — jadi nama itu diuraikan, bukan
 * dibiarkan sebagai istilah Latin yang tidak dijelaskan.
 */
function untukStruktur(rawName: string): string {
  const rapi = humanizeStructureName(rawName)
  const jenis = jenisDariNamaStruktur(rawName) || 'an anatomical structure in the human body'
  const milik = faktaMilikOrgan(rapi, jenis, ORGAN_FOCUS.flatMap((o) => {
    const pen = penjelasanOrgan(o.key)
    return pen?.definisi ? [{ label: o.label, keywords: o.keywords, definisi: pen.definisi }] : []
  }))
  const sisi = /\.l$/.test(rawName) ? ' This is the LEFT one; the body has a matching structure on the right.'
    : /\.r$/.test(rawName) ? ' This is the RIGHT one; the body has a matching structure on the left.'
    : ''
  return [
    milik ? `**${milik}**${sisi}` : `**${rapi}** is ${jenis}.${sisi}`,
    'The name comes from the Terminologia Anatomica used by the 3D dataset, so it is the same term used in textbooks and operative notes.',
    'Any disease and phenotype terms retrieved below come from real medical ontologies and are matched to this structure by name.',
  ].join('\n\n')
}

export { kalimatPertama } from '../domains/body-exposure/engine/kalimatPertama'

/**
 * Membangun penjelasan tertulis untuk apa pun yang sedang dipilih.
 *
 * `rawName` diisi hanya kalau yang dipilih adalah struktur 3D yang disentuh.
 * SELALU mengembalikan teks — tidak pernah null, tidak pernah kosong.
 */
export function penjelasanTertulis(label: string, rawName?: string): string {
  return (
    untukOtot(label) ??
    untukOrgan(label) ??
    untukSistem(label) ??
    (rawName ? untukStruktur(rawName) : null) ??
    // Jaring terakhir: pertanyaan bebas atau entri yang belum punya tulisan.
    // Tetap mengatakan sesuatu yang benar dan berguna, bukan mengumumkan
    // kegagalan.
    [
      `**${label}**`,
      'There is no written summary for this entry yet, so nothing is invented here.',
      'The disease and phenotype terms below are real entries retrieved live from the Human Disease Ontology and the Human Phenotype Ontology, and the images are freely-licensed medical images — those stand on their own regardless of whether a summary exists.',
    ].join('\n\n')
  )
}

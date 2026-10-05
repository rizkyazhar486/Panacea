/** Nama yang boleh ditampilkan saat sebuah mesh atlas diketuk. Mesh AI tanpa nama ditolak. */
export function namaBagianAtlas(mentah: string): string {
  const spasi = mentah.replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
  if (!spasi || /^tripo[_ ]node\b/i.test(spasi)) return ''
  let n = spasi
  if (/\.l$/i.test(n)) n = `${n.slice(0, -2)} (left)`
  else if (/\.r$/i.test(n)) n = `${n.slice(0, -2)} (right)`
  return n.charAt(0).toUpperCase() + n.slice(1)
}

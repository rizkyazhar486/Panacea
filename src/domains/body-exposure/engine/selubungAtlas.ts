/** Selubung yang menempel di permukaan organ. Digambar tipis supaya tidak menutup bagian di bawahnya. */
export function selubungAtlas(nama: string): boolean {
  const n = nama.trim()
  if (!n) return false
  return /\bpleura\b/i.test(n)
}

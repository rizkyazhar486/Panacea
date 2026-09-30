export interface TabBerid {
  id: string
}

/**
 * Menentukan tab yang pantas berada di jalur primer tanpa menghapus tab lain.
 *
 * Tanpa preferensi eksplisit, perilaku HalamanTab lama dipertahankan. Dengan
 * preferensi, halaman dapat menyatakan workflow primer yang nyata. Deep-link
 * ke tab sekunder tetap terlihat sementara tanpa mengganti workflow primer.
 */
export function susunTabUtama<T extends TabBerid>(
  tabs: readonly T[],
  aktif: string,
  preferredIds: readonly string[] | undefined,
  defaultLimit = 7,
): T[] {
  if (preferredIds?.length) {
    const byId = new Map(tabs.map((tab) => [tab.id, tab] as const))
    const preferred = preferredIds
      .map((id) => byId.get(id))
      .filter((tab): tab is T => Boolean(tab))

    if (preferred.some((tab) => tab.id === aktif)) return preferred
    const current = byId.get(aktif)
    return current ? [...preferred, current] : preferred
  }

  if (tabs.length <= defaultLimit + 1) return [...tabs]
  const first = tabs.slice(0, defaultLimit)
  if (first.some((item) => item.id === aktif)) return [...first]
  const current = tabs.find((item) => item.id === aktif)
  return current ? [...first.slice(0, defaultLimit - 1), current] : [...first]
}

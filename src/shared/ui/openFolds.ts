// Membuka semua lipatan satu-kata (<details class="fold">) yang membungkus sebuah elemen, supaya
// lompatan ke jangkar (tautan dalam, tombol "lompat ke") tidak mendarat di isi yang tersembunyi.
export interface FoldHost {
  closest(selector: string): FoldHost | null
  parentElement: FoldHost | null
  open?: boolean
}

export function openFoldsAround(el: FoldHost | null | undefined): number {
  if (!el) return 0
  let opened = 0
  for (let d = el.closest('details.fold'); d; d = d.parentElement ? d.parentElement.closest('details.fold') : null) {
    if (!d.open) { d.open = true; opened += 1 }
  }
  return opened
}

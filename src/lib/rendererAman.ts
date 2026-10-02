import * as THREE from 'three'

// Membuat WebGLRenderer tanpa melempar. Konstruktor three MELEMPAR bila konteks WebGL
// tidak bisa dibuat (WebGL dimatikan, GPU diblokir, batas konteks habis); tanpa
// penjaga ini seluruh panel jatuh ke batas galat padahal isi non-3D-nya masih berguna.
export function buatRendererAman(opsi: THREE.WebGLRendererParameters): THREE.WebGLRenderer | null {
  try {
    return new THREE.WebGLRenderer(opsi)
  } catch {
    return null
  }
}

/**
 * Tanda keterangan di dalam wadah kanvas saat WebGL tidak tersedia. Mengembalikan
 * fungsi pembersih agar bisa langsung dipakai sebagai cleanup useEffect.
 */
export function tandaiTanpaWebgl(wadah: HTMLElement, pesan = '3D view unavailable on this device (WebGL could not start). The rest of this page still works.'): () => void {
  const p = document.createElement('p')
  p.setAttribute('role', 'status')
  p.dataset.tanpaWebgl = ''
  p.textContent = pesan
  p.style.cssText = 'margin:0;padding:12px;font-size:13px;line-height:1.4;color:#cbd5e1;background:#0f172a;border-radius:12px'
  wadah.appendChild(p)
  return () => p.remove()
}

/**
 * Melepas GPU renderer: sumber daya di dalam konteks DAN konteks WebGL-nya. dispose() saja tidak cukup —
 * konteks baru lepas saat kanvas di-GC, jadi tiap mount/unmount menyisakan konteks zombi dan browser
 * (batas ±16, lebih rendah di iOS) mulai membuang konteks TERTUA, sering viewer utama yang masih dipakai.
 * Pencopotan kanvas dari DOM tetap urusan pemanggil. Tidak pernah melempar: dipanggil dari cleanup efek.
 */
export function lepasRenderer(renderer: THREE.WebGLRenderer): void {
  renderer.renderLists.dispose()
  renderer.dispose()
  try { renderer.forceContextLoss() } catch { /* konteks sudah hilang */ }
}

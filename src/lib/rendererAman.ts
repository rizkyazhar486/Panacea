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

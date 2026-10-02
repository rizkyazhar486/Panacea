// Lingkungan pencahayaan (IBL) yang dapat dipulihkan setelah konteks WebGL hilang.
//
// Mengapa ada: isi render target hasil PMREM TIDAK dikembalikan three.js ketika
// browser memulihkan konteks (hanya buffer/tekstur yang berasal dari CPU yang di-upload
// ulang). Akibatnya anatomi tampak lebih gelap dan datar sampai halaman dimuat ulang,
// tanpa galat apa pun. Mesin ini murni dan memakai injeksi `build`/`install` agar jalur
// pemulihan dan gagal-tertutupnya bisa diuji tanpa GPU.

export interface EnvironmentHandle {
  dispose: () => void
}

export interface RestorableEnvironmentOptions<T extends EnvironmentHandle> {
  /** Membangun lingkungan baru di konteks yang sedang hidup. Boleh melempar bila konteks tidak tersedia. */
  build: () => T
  /** Memasang lingkungan ke tempat renderer membacanya; `null` berarti tanpa lingkungan. */
  install: (environment: T | null) => void
}

export interface RebuildOptions {
  /**
   * Benar saat konteks sebelumnya sudah hilang: sumber daya GPU lama ikut mati bersamanya, jadi
   * dispose()-nya hanya menghasilkan galat GL "object does not belong to this context".
   */
  previousContextLost?: boolean
}

export interface RestorableEnvironment {
  /** Membuang yang lama lalu membangun & memasang yang baru. `false` bila gagal atau sudah di-dispose. */
  rebuild: (options?: RebuildOptions) => boolean
  dispose: () => void
  /** Naik hanya saat build berhasil; dipakai QA untuk membuktikan pemulihan terjadi. */
  generation: () => number
  isActive: () => boolean
}

export function createRestorableEnvironment<T extends EnvironmentHandle>(
  options: RestorableEnvironmentOptions<T>,
): RestorableEnvironment {
  let current: T | null = null
  let generation = 0
  let disposed = false

  // Handle lama bisa milik konteks yang sudah hilang; membuangnya tidak boleh menggagalkan pemulihan.
  const release = (skipDispose = false) => {
    const old = current
    current = null
    if (skipDispose) return
    try { old?.dispose() } catch { /* handle milik konteks yang hilang */ }
  }

  const rebuild = (rebuildOptions?: RebuildOptions) => {
    if (disposed) return false
    release(rebuildOptions?.previousContextLost === true)
    try {
      current = options.build()
    } catch {
      // Gagal tertutup: lebih baik tanpa IBL daripada lingkungan basi/hitam yang tak terlihat salahnya.
      options.install(null)
      return false
    }
    generation += 1
    options.install(current)
    return true
  }

  const dispose = () => {
    if (disposed) return
    disposed = true
    release()
    options.install(null)
  }

  return { rebuild, dispose, generation: () => generation, isActive: () => current !== null }
}

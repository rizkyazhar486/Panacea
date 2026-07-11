// Permanent media upload via Cloudinary (unsigned). Pre-wired to the project's
// cloud; you only need to create ONE unsigned upload preset named "panaceamed"
// in the Cloudinary dashboard (Settings → Upload → Add upload preset → Unsigned).
//
// Overridable via Vite env: VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_PRESET.
// If upload fails or isn't configured, callers fall back to a local data/object
// URL so the app keeps working offline.

const CLOUD = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined) || 'do7rwbj88'
const PRESET = (import.meta.env.VITE_CLOUDINARY_PRESET as string | undefined) || 'panaceamed'

export const cloudinaryConfigured = Boolean(CLOUD && PRESET)

/**
 * Downscale & re-encode an image before upload — caps the longest edge and
 * re-compresses to JPEG. Cuts payload/storage (and localStorage quota) a lot.
 * Videos and non-images pass through untouched. Falls back to the original
 * file if anything goes wrong (e.g. unsupported format).
 */
export async function compressImage(file: File, maxEdge = 1600, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    // Already small enough and not huge → keep as-is.
    if (scale === 1 && file.size < 600_000) {
      bitmap.close()
      return file
    }
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}

/** Upload a file to Cloudinary; returns a permanent https URL, or null on failure. */
export async function uploadMedia(file: File, timeoutMs = 20_000): Promise<string | null> {
  if (!cloudinaryConfigured) return null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const form = new FormData()
    form.append('file', file)
    form.append('upload_preset', PRESET)
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/auto/upload`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    })
    if (!res.ok) return null
    const data = (await res.json()) as { secure_url?: string }
    return data.secure_url ?? null
  } catch {
    // Includes the abort from a slow/flaky connection — caller falls back
    // to a local data URL instead of hanging the UI forever.
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** Read a file as a local data URL (fallback when Cloudinary isn't available). */
export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.readAsDataURL(file)
  })
}

/** Compress images, then upload to Cloudinary, falling back to a local data URL. */
export async function uploadOrLocal(file: File): Promise<string> {
  const optimized = await compressImage(file)
  return (await uploadMedia(optimized)) ?? (await readAsDataUrl(optimized))
}

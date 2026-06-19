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

/** Upload a file to Cloudinary; returns a permanent https URL, or null on failure. */
export async function uploadMedia(file: File): Promise<string | null> {
  if (!cloudinaryConfigured) return null
  try {
    const form = new FormData()
    form.append('file', file)
    form.append('upload_preset', PRESET)
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/auto/upload`, {
      method: 'POST',
      body: form,
    })
    if (!res.ok) return null
    const data = (await res.json()) as { secure_url?: string }
    return data.secure_url ?? null
  } catch {
    return null
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

/** Upload to Cloudinary, falling back to a local data URL. */
export async function uploadOrLocal(file: File): Promise<string> {
  return (await uploadMedia(file)) ?? (await readAsDataUrl(file))
}

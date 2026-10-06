/** Read one file once; stale operations cannot publish or initiate recognition. */
export async function readPersonalHealthFile<T>(
  file: File,
  current: () => boolean,
  parseText: (name: string, text: string) => T,
  readImage: (file: File, current: () => boolean) => Promise<T>,
): Promise<{ values: T; text: string; image: boolean } | null> {
  if (!current()) return null
  const image = /^image\//.test(file.type) || /\.(jpe?g|png|webp|heic)$/i.test(file.name)
  if (image) {
    const values = await readImage(file, current)
    return current() ? { values, text: '', image } : null
  }
  const text = await file.text()
  if (!current()) return null
  const values = parseText(file.name, text)
  return current() ? { values, text, image } : null
}

export async function readPersonalHealthImage(
  file: File,
  current: () => boolean,
  recognize: (dataUrl: string) => Promise<string>,
): Promise<string | null> {
  if (!current()) return null
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('read_failed'))
    reader.readAsDataURL(file)
  })
  if (!current()) return null
  const text = await recognize(dataUrl)
  return current() ? text : null
}

export type PersonalBodyShareResult = 'shared' | 'downloaded'

function safeFileName(value: string) {
  const clean = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return clean || 'my-body'
}

export async function sharePersonalBodyCanvas(
  root: HTMLElement,
  options: { title?: string; fileName?: string } = {},
): Promise<PersonalBodyShareResult> {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas[data-personal-avatar-canvas="true"]')
  if (!canvas) throw new Error('Personal body canvas is not ready yet.')

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Could not export the personal body render.')), 'image/png', 1)
  })

  const fileName = `${safeFileName(options.fileName ?? options.title ?? 'my-body')}.png`
  const file = new File([blob], fileName, { type: 'image/png' })
  const title = options.title ?? 'My Body · Panaceamed'

  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title,
      text: 'My Body from Panaceamed',
      files: [file],
    })
    return 'shared'
  }

  const url = URL.createObjectURL(blob)
  try {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    anchor.rel = 'noopener'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 1500)
  }
  return 'downloaded'
}

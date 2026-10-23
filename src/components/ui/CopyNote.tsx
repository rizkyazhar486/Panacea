import { useState } from 'react'

// One-tap "copy for note" — formats a calculator result as a single EMR-ready
// line (score, inputs, interpretation, citation) and puts it on the clipboard,
// so documenting a score doesn't mean retyping it.

export function CopyNote({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Older/locked-down browsers: fall back to a hidden textarea.
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch { /* give up silently */ }
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className={`mt-3 w-full rounded-xl border-2 py-2 text-sm font-bold transition ${copied ? 'border-brand bg-brand/10 text-brand-dark' : 'border-neutral-200 text-neutral-500 hover:border-brand hover:text-brand-dark dark:border-white/15 dark:text-neutral-300'}`}
    >
      {copied ? '✓ Copied to clipboard' : '📋 Copy result for note'}
    </button>
  )
}

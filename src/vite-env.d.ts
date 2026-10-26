/// <reference types="vite/client" />

declare module 'html2canvas-pro' {
  export interface Html2CanvasOptions {
    backgroundColor?: string | null
    scale?: number
    useCORS?: boolean
    onclone?: (doc: Document, element: HTMLElement) => void
    [key: string]: unknown
  }
  const html2canvas: (element: HTMLElement, options?: Html2CanvasOptions) => Promise<HTMLCanvasElement>
  export default html2canvas
}

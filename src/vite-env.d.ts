/// <reference types="vite/client" />

declare module 'html2canvas-pro' {
  const html2canvas: (element: HTMLElement, options?: any) => Promise<HTMLCanvasElement>
  export default html2canvas
}

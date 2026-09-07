// Anggaran resolusi Body Exposure.
//
// Tujuannya bukan menurunkan kualitas ponsel secara membabi buta. Viewer 390 px
// tetap boleh memakai DPR 2 agar garis tulang/saraf tajam di Retina, sedangkan
// kanvas desktop yang jauh lebih besar menurunkan supersampling sebelum fill-rate
// GPU menjadi sumber panas/crash. DPR tidak pernah dipaksa di bawah 1, sehingga
// layar CSS 4K tetap dirender minimal pada native 4K.
export const BODY3D_MAX_DPR = 2
export const BODY3D_MAX_RENDER_PIXELS = 4_500_000

export function body3dPixelRatio(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
): number {
  const width = Number.isFinite(cssWidth) && cssWidth > 0 ? cssWidth : 1
  const height = Number.isFinite(cssHeight) && cssHeight > 0 ? cssHeight : 1
  const dpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1
  const pixelBudgetRatio = Math.sqrt(BODY3D_MAX_RENDER_PIXELS / (width * height))
  return Math.min(dpr, BODY3D_MAX_DPR, Math.max(1, pixelBudgetRatio))
}

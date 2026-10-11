// Harga unit materi Marketplace (PNC). Fail-closed: harga bukan bilangan bulat >= 0
// ditolak, tidak dipaksa jadi 0 — materi "gratis" harus keputusan eksplisit penulis.
export type MaterialPriceResult = { ok: true; priceTokens: number } | { ok: false; problem: string }

export function validateMaterialPrice(price: number): MaterialPriceResult {
  if (!Number.isFinite(price) || !Number.isInteger(price) || price < 0) {
    return { ok: false, problem: 'Price must be a whole number of 0 PNC or more' }
  }
  return { ok: true, priceTokens: price }
}

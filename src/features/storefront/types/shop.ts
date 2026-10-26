import type { HealthCategory } from '../data/products'

export type VaultDraft = {
  name: string
  categories: HealthCategory[]
  routine: 'Morning' | 'Evening' | 'Flexible'
  size: 'essential' | 'complete'
  productIds: string[]
}

export type SavedVault = VaultDraft & {
  id: string
  createdAt: string
}

export type CartItem = {
  key: string
  kind: 'product' | 'vault'
  name: string
  quantity: number
  unitPrice: number
  originalUnitPrice?: number
  productId?: string
  productIds?: string[]
}

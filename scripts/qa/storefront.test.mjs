import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { products, productById, formatPrice, categories, testimonials } from '../../src/features/storefront/data/products.ts'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const rootDir = join(__dirname, '..', '..')

test('Storefront Catalog Data Integrity', async (t) => {
  await t.test('all 4 targeted formulas are registered with valid details', () => {
    assert.equal(products.length, 4, 'Expected exactly 4 precision formulas')
    const ids = products.map((p) => p.id)
    assert.deepEqual(ids, ['aminosyn-9', 'immunefix', 'probiotics', 'curcumin-plus'])

    for (const p of products) {
      assert.ok(p.name.length > 3, `Product ${p.id} must have a descriptive name`)
      assert.ok(p.code.includes('/'), `Product ${p.id} code must have category/code slash format`)
      assert.ok(p.price > 0, `Product ${p.id} must have a positive price`)
      assert.ok(p.servings > 0, `Product ${p.id} must specify servings`)
      assert.ok(p.formulaNotes.length >= 3, `Product ${p.id} must provide at least 3 formula notes`)
      assert.ok(p.description.length > 20, `Product ${p.id} must have a detailed description`)
      assert.ok(p.usage.length > 10, `Product ${p.id} must have usage guidance`)
    }
  })

  await t.test('productById resolves existing products and returns undefined for unknown', () => {
    const amino = productById('aminosyn-9')
    assert.ok(amino)
    assert.equal(amino.name, 'AMINOSYN 9')
    assert.equal(amino.price, 52)

    const unknown = productById('unknown-99')
    assert.equal(unknown, undefined)
  })

  await t.test('formatPrice correctly renders currency strings', () => {
    assert.equal(formatPrice(52), '$52')
    assert.equal(formatPrice(125.5), '$125.50')
    assert.equal(formatPrice(0), '$0')
  })

  await t.test('categories and testimonials contain valid entries', () => {
    assert.ok(categories.includes('All formulas'))
    assert.ok(categories.includes('Immunity'))
    assert.ok(categories.includes('Gut Health'))
    assert.ok(categories.includes('Recovery'))
    assert.ok(categories.includes('Inflammation'))

    assert.ok(testimonials.length >= 3, 'Must have at least 3 testimonials')
    for (const item of testimonials) {
      assert.ok(item.quote.length > 10)
      assert.ok(item.name.length > 2)
      assert.ok(item.detail.length > 5)
    }
  })
})

test('Storefront Vault Economics & Discount Logic', async (t) => {
  await t.test('Private Vault 20% discount calculation is mathematically exact', () => {
    // Test Essential Vault (2 formulas: aminosyn-9 ($52) + immunefix ($44))
    const essentialIds = ['aminosyn-9', 'immunefix']
    const essentialProducts = essentialIds.map(productById)
    const essentialOriginal = essentialProducts.reduce((sum, p) => sum + (p?.price ?? 0), 0)
    const essentialDiscounted = essentialOriginal * 0.8
    const essentialSaving = essentialOriginal - essentialDiscounted

    assert.equal(essentialOriginal, 52 + 44) // 96
    assert.ok(Math.abs(essentialDiscounted - (96 * 0.8)) < 0.001) // 76.8
    assert.ok(Math.abs(essentialSaving - 19.2) < 0.001) // 19.2

    // Test Complete Vault (4 formulas: 52 + 44 + 46 + 38 = 180)
    const completeOriginal = products.reduce((sum, p) => sum + p.price, 0)
    const completeDiscounted = completeOriginal * 0.8
    const completeSaving = completeOriginal - completeDiscounted

    assert.equal(completeOriginal, 180)
    assert.ok(Math.abs(completeDiscounted - 144) < 0.001) // 144
    assert.ok(Math.abs(completeSaving - 36) < 0.001)
  })
})

test('Storefront Static Assets & Dark Surface Compliance', async (t) => {
  await t.test('all 4 optimized WebP imagery assets exist in public/images', () => {
    const requiredImages = [
      'hero-products.webp',
      'manufacturing.webp',
      'product-jar.webp',
      'sourcing.webp',
    ]

    for (const img of requiredImages) {
      const imgPath = join(rootDir, 'public', 'images', img)
      assert.ok(existsSync(imgPath), `Image asset missing: ${img}`)
    }
  })

  await t.test('dark surfaces in Storefront components include .dark marker class', () => {
    const promoFile = readFileSync(join(rootDir, 'src', 'features', 'storefront', 'components', 'VaultPromo.tsx'), 'utf8')
    assert.ok(promoFile.includes('vault-promo dark'), 'VaultPromo must have .dark marker')

    const builderFile = readFileSync(join(rootDir, 'src', 'features', 'storefront', 'components', 'VaultBuilder.tsx'), 'utf8')
    assert.ok(builderFile.includes('vault-shell__aside dark'), 'VaultBuilder aside must have .dark marker')

    const pageFile = readFileSync(join(rootDir, 'src', 'features', 'storefront', 'StorefrontPage.tsx'), 'utf8')
    assert.ok(pageFile.includes('footer dark'), 'Storefront footer must have .dark marker')
  })
})

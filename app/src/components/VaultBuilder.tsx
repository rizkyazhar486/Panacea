import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Edit3, ShieldCheck, Sparkles, Trash2 } from 'lucide-react'
import type { HealthCategory } from '@/data/products'
import { formatPrice, productById, products } from '@/data/products'
import type { SavedVault, VaultDraft } from '@/types/shop'
import { ProductJar } from '@/components/ProductJar'

const healthCategories: Array<{ name: HealthCategory; description: string }> = [
  { name: 'Immunity', description: 'Daily immune-system support' },
  { name: 'Gut Health', description: 'A considered microbiome ritual' },
  { name: 'Recovery', description: 'Support for demanding days' },
  { name: 'Inflammation', description: 'Everyday balance and recovery' },
]

const emptyDraft: VaultDraft = {
  name: '',
  categories: [],
  routine: 'Flexible',
  size: 'essential',
  productIds: [],
}

export function VaultBuilder({
  savedVault,
  onSave,
  onDeleteSaved,
  onAddToCart,
}: {
  savedVault: SavedVault | null
  onSave: (vault: SavedVault) => void
  onDeleteSaved: () => void
  onAddToCart: (vault: SavedVault) => void
}) {
  const reduceMotion = useReducedMotion()
  const [draft, setDraft] = useState<VaultDraft>(emptyDraft)
  const [step, setStep] = useState(1)
  const [showResult, setShowResult] = useState(false)
  const [error, setError] = useState('')

  const selectedProducts = useMemo(
    () => draft.productIds.map(productById).filter((product): product is NonNullable<typeof product> => Boolean(product)),
    [draft.productIds],
  )
  const originalTotal = selectedProducts.reduce((sum, product) => sum + product.price, 0)
  const discountedTotal = originalTotal * 0.8
  const limit = draft.size === 'essential' ? 2 : 4

  const makeVault = (): SavedVault => ({
    ...draft,
    name: draft.name.trim(),
    id: globalThis.crypto?.randomUUID?.() ?? `vault-${Date.now()}`,
    createdAt: new Date().toISOString(),
  })

  const goToRoutine = () => {
    if (draft.name.trim().length < 2) {
      setError('Give your Vault a name using at least two characters.')
      return
    }
    if (draft.categories.length === 0) {
      setError('Choose at least one area you would like to support.')
      return
    }
    setError('')
    setStep(2)
  }

  const goToProducts = () => {
    const recommended = products
      .filter((product) => draft.categories.includes(product.category) || product.additionalCategories?.some((category) => draft.categories.includes(category)))
      .map((product) => product.id)
    setDraft((current) => ({ ...current, productIds: recommended.slice(0, limit) }))
    setError('')
    setStep(3)
  }

  const toggleCategory = (category: HealthCategory) => {
    setDraft((current) => ({
      ...current,
      categories: current.categories.includes(category)
        ? current.categories.filter((item) => item !== category)
        : [...current.categories, category],
    }))
    setError('')
  }

  const toggleProduct = (productId: string) => {
    if (!draft.productIds.includes(productId) && draft.productIds.length >= limit) {
      setError(`Your ${draft.size === 'essential' ? 'Essential' : 'Complete'} Vault can hold ${limit} formulas. Remove one or choose a different Vault size.`)
      return
    }
    setDraft((current) => ({
      ...current,
      productIds: current.productIds.includes(productId)
        ? current.productIds.filter((id) => id !== productId)
        : [...current.productIds, productId],
    }))
    setError('')
  }

  const generate = () => {
    if (draft.productIds.length === 0) {
      setError('Select at least one formula for your Private Vault.')
      return
    }
    setError('')
    setShowResult(true)
  }

  const loadSaved = () => {
    if (!savedVault) return
    setDraft({
      name: savedVault.name,
      categories: savedVault.categories,
      routine: savedVault.routine,
      size: savedVault.size,
      productIds: savedVault.productIds,
    })
    setShowResult(true)
    setStep(3)
    setError('')
  }

  const reset = () => {
    setDraft(emptyDraft)
    setStep(1)
    setShowResult(false)
    setError('')
  }

  const transition = reduceMotion ? { duration: 0 } : { duration: 0.22, ease: 'easeOut' as const }

  return (
    <section className="vault-section" id="vault-builder">
      <div className="page-shell">
        <div className="section-heading section-heading--split">
          <div><p className="eyebrow">The Private Vault</p><h2>Your routine.<br /><em>Your edit.</em></h2></div>
          <p>Choose what matters to you. We’ll suggest a focused starting collection, then give you complete control. Every Private Vault saves 20%.</p>
        </div>

        <div className="vault-shell">
          <aside className="vault-shell__aside">
            <div>
              <span className="vault-shell__monogram" aria-hidden="true">V</span>
              <p className="eyebrow">Personalized, not prescribed</p>
              <h3>A collection as individual as you are.</h3>
              <p>Build around your preferences, edit every formula, and return to your saved collection in this browser.</p>
            </div>
            <div className="vault-shell__saving"><strong>20%</strong><span>saved on your<br />entire Private Vault</span></div>
            <ul><li><Check size={16} />No subscription required</li><li><Check size={16} />Edit before adding to cart</li><li><Check size={16} />Your choices stay in this browser</li></ul>
          </aside>

          <div className="vault-shell__main">
            {savedVault && !showResult && (
              <div className="saved-vault-bar">
                <div><span>SAVED IN THIS BROWSER</span><strong>{savedVault.name}</strong></div>
                <button type="button" className="text-link" onClick={loadSaved}>View vault <ArrowRight size={15} /></button>
                <button type="button" className="icon-button" onClick={onDeleteSaved} aria-label={`Delete saved vault ${savedVault.name}`}><Trash2 size={16} /></button>
              </div>
            )}

            {!showResult ? (
              <>
                <ol className="vault-steps" aria-label="Vault creation progress">
                  {['Your focus', 'Your routine', 'Your formulas'].map((label, index) => (
                    <li key={label} className={step === index + 1 ? 'is-current' : step > index + 1 ? 'is-complete' : ''} aria-current={step === index + 1 ? 'step' : undefined}>
                      <span>{step > index + 1 ? <Check size={13} /> : `0${index + 1}`}</span>{label}
                    </li>
                  ))}
                </ol>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={step} initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -8 }} transition={transition}>
                    {step === 1 && (
                      <form onSubmit={(event) => { event.preventDefault(); goToRoutine() }} className="vault-form">
                        <div className="vault-form__heading"><span>STEP ONE</span><h3>What should we call your collection?</h3><p>A name and a focus are enough to begin.</p></div>
                        <label className="field-label" htmlFor="vault-name">Vault name</label>
                        <input
                          id="vault-name"
                          className="text-input"
                          value={draft.name}
                          onChange={(event) => { setDraft({ ...draft, name: event.target.value.slice(0, 40) }); setError('') }}
                          placeholder="e.g. Amelia’s daily reset"
                          autoComplete="off"
                          maxLength={40}
                          aria-describedby="vault-name-hint"
                        />
                        <div className="field-hint" id="vault-name-hint"><span>Make it personal.</span><span>{draft.name.length}/40</span></div>
                        <fieldset className="vault-fieldset"><legend>What would you like to support? <small>Select all that apply.</small></legend>
                          <div className="category-options">
                            {healthCategories.map((category) => (
                              <label key={category.name} className={`choice-card ${draft.categories.includes(category.name) ? 'is-selected' : ''}`}>
                                <input type="checkbox" checked={draft.categories.includes(category.name)} onChange={() => toggleCategory(category.name)} />
                                <span className="choice-card__check"><Check size={14} /></span>
                                <strong>{category.name}</strong><small>{category.description}</small>
                              </label>
                            ))}
                          </div>
                        </fieldset>
                        {error && <p className="form-error" role="alert">{error}</p>}
                        <div className="vault-form__actions"><span /><button type="submit" className="button button--orange">Continue <ArrowRight size={17} /></button></div>
                      </form>
                    )}

                    {step === 2 && (
                      <form onSubmit={(event) => { event.preventDefault(); goToProducts() }} className="vault-form">
                        <div className="vault-form__heading"><span>STEP TWO</span><h3>Make it fit the way you live.</h3><p>Your routine helps shape the collection—not a rigid schedule.</p></div>
                        <fieldset className="vault-fieldset"><legend>When do you prefer to take your supplements?</legend>
                          <div className="routine-options">
                            {(['Morning', 'Evening', 'Flexible'] as const).map((routine) => (
                              <label key={routine} className={`radio-option ${draft.routine === routine ? 'is-selected' : ''}`}>
                                <input type="radio" name="routine" value={routine} checked={draft.routine === routine} onChange={() => setDraft({ ...draft, routine })} />
                                <span>{routine}</span><small>{routine === 'Morning' ? 'Begin with intention' : routine === 'Evening' ? 'Wind down with care' : 'Keep your options open'}</small>
                              </label>
                            ))}
                          </div>
                        </fieldset>
                        <fieldset className="vault-fieldset"><legend>How edited should your Vault be?</legend>
                          <div className="size-options">
                            <label className={`size-option ${draft.size === 'essential' ? 'is-selected' : ''}`}>
                              <input type="radio" name="size" checked={draft.size === 'essential'} onChange={() => setDraft({ ...draft, size: 'essential', productIds: [] })} />
                              <span className="size-option__radio" /><strong>Essential</strong><p>A tightly edited pair.</p><small>Up to 2 formulas</small>
                            </label>
                            <label className={`size-option ${draft.size === 'complete' ? 'is-selected' : ''}`}>
                              <input type="radio" name="size" checked={draft.size === 'complete'} onChange={() => setDraft({ ...draft, size: 'complete', productIds: [] })} />
                              <span className="size-option__radio" /><strong>Complete</strong><p>Room for a broader ritual.</p><small>Up to 4 formulas</small>
                            </label>
                          </div>
                        </fieldset>
                        {error && <p className="form-error" role="alert">{error}</p>}
                        <div className="vault-form__actions"><button type="button" className="text-link" onClick={() => { setStep(1); setError('') }}><ArrowLeft size={16} /> Back</button><button type="submit" className="button button--orange">See recommendations <Sparkles size={16} /></button></div>
                      </form>
                    )}

                    {step === 3 && (
                      <form onSubmit={(event) => { event.preventDefault(); generate() }} className="vault-form">
                        <div className="vault-form__heading"><span>STEP THREE</span><h3>Your suggested formulas.</h3><p>We preselected a starting point from your focus. Keep, remove, or swap any formula.</p></div>
                        <div className="vault-selection-count"><span>{draft.productIds.length} of {limit} selected</span><span>{draft.routine} routine</span></div>
                        <div className="vault-product-options">
                          {products.map((product) => {
                            const selected = draft.productIds.includes(product.id)
                            return (
                              <label key={product.id} className={`vault-product-option ${selected ? 'is-selected' : ''}`}>
                                <input type="checkbox" checked={selected} onChange={() => toggleProduct(product.id)} />
                                <span className="vault-product-option__check"><Check size={14} /></span>
                                <ProductJar product={product} />
                                <span className="vault-product-option__copy"><strong>{product.name}</strong><small>{product.subtitle}</small><b>{formatPrice(product.price)}</b></span>
                              </label>
                            )
                          })}
                        </div>
                        {error && <p className="form-error" role="alert">{error}</p>}
                        <div className="vault-form__actions"><button type="button" className="text-link" onClick={() => { setStep(2); setError('') }}><ArrowLeft size={16} /> Back</button><button type="submit" className="button button--orange">Generate my vault <ArrowRight size={17} /></button></div>
                      </form>
                    )}
                  </motion.div>
                </AnimatePresence>
              </>
            ) : (
              <motion.div className="vault-result" initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={transition}>
                <div className="vault-result__heading"><span><CheckCircle2 size={17} /> YOUR PRIVATE VAULT</span><h3>{draft.name}</h3><p>{draft.routine} routine · {draft.categories.join(' + ')}</p></div>
                <div className="vault-result__products">
                  {selectedProducts.map((product) => (
                    <div className="vault-result__product" key={product.id}>
                      <ProductJar product={product} />
                      <div><strong>{product.name}</strong><span>{product.subtitle}</span><small>{product.servings} servings</small></div>
                      <b>{formatPrice(product.price)}</b>
                    </div>
                  ))}
                </div>
                <div className="vault-result__totals">
                  <div><span>Collection value</span><span>{formatPrice(originalTotal)}</span></div>
                  <div className="vault-result__discount"><span>Private Vault saving · 20%</span><span>−{formatPrice(originalTotal * 0.2)}</span></div>
                  <div className="vault-result__total"><span>Your Vault</span><strong>{formatPrice(discountedTotal)}</strong></div>
                </div>
                <div className="vault-result__actions"><button type="button" className="button button--orange" onClick={() => onAddToCart(makeVault())}>Add vault to cart <ArrowRight size={17} /></button><button type="button" className="button button--outline" onClick={() => onSave(makeVault())}>Save to my vault <Check size={16} /></button></div>
                <div className="vault-result__edit"><button type="button" className="text-link" onClick={() => { setShowResult(false); setStep(3) }}><Edit3 size={15} /> Edit formulas</button><button type="button" className="text-link" onClick={reset}>Start a new vault</button></div>
              </motion.div>
            )}

            <div className="vault-disclaimer"><ShieldCheck size={18} aria-hidden="true" /><p><strong>A note on care.</strong> These statements have not been evaluated by the Food and Drug Administration. These products are not intended to diagnose, treat, cure, or prevent any disease. Vault suggestions reflect your shopping preferences, not medical advice. Consult a qualified healthcare professional about your individual needs.</p></div>
          </div>
        </div>
      </div>
    </section>
  )
}

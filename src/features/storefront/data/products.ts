export type HealthCategory = 'Immunity' | 'Gut Health' | 'Recovery' | 'Inflammation'

export type Product = {
  id: string
  name: string
  subtitle: string
  category: HealthCategory
  additionalCategories?: HealthCategory[]
  price: number
  servings: number
  code: string
  shortDescription: string
  description: string
  formulaNotes: string[]
  usage: string
  tone: 'sage' | 'chalk' | 'clay' | 'mist'
}

export const products: Product[] = [
  {
    id: 'aminosyn-9',
    name: 'AMINOSYN 9',
    subtitle: 'Essential Amino Acids',
    category: 'Recovery',
    price: 52,
    servings: 30,
    code: 'RECOVERY / 01',
    shortDescription: 'Nine essential amino acids. One precise daily ritual.',
    description:
      'A complete essential amino acid formula for training days, demanding schedules, and everything between. AMINOSYN 9 keeps a complex nutritional decision beautifully straightforward.',
    formulaNotes: ['All nine essential amino acids', '30-serving format', 'Designed for daily routines'],
    usage:
      'Use only as directed on the product label. A qualified healthcare professional can help you decide whether an amino acid supplement is appropriate for your needs.',
    tone: 'sage',
  },
  {
    id: 'immunefix',
    name: 'IMMUNEFIX',
    subtitle: 'Advanced Immune Support',
    category: 'Immunity',
    price: 44,
    servings: 30,
    code: 'IMMUNITY / 02',
    shortDescription: 'Considered daily support for your immune routine.',
    description:
      'IMMUNEFIX is designed for people who want a consistent, uncomplicated approach to daily immune-system support—without turning wellness into a full-time project.',
    formulaNotes: ['Daily immune-system support', '30-serving format', 'Simple, consistent routine'],
    usage:
      'Use only as directed on the product label. If you are pregnant, nursing, taking medication, or managing a health condition, consult a qualified healthcare professional first.',
    tone: 'chalk',
  },
  {
    id: 'probiotics',
    name: 'PROBIOTICS',
    subtitle: 'Complete Microbiome Support',
    category: 'Gut Health',
    price: 46,
    servings: 30,
    code: 'GUT HEALTH / 03',
    shortDescription: 'A thoughtful addition to your daily digestive ritual.',
    description:
      'PROBIOTICS makes microbiome support feel clear and approachable. A daily formula designed to sit naturally alongside the food, movement, and sleep habits that matter too.',
    formulaNotes: ['Daily microbiome support', '30-serving format', 'Routine-friendly formulation'],
    usage:
      'Use only as directed on the product label. Seek professional guidance before use if you are immunocompromised, managing a health condition, or taking medication.',
    tone: 'mist',
  },
  {
    id: 'curcumin-plus',
    name: 'CURCUMIN+',
    subtitle: 'Bioavailable Curcumin Complex',
    category: 'Inflammation',
    additionalCategories: ['Recovery'],
    price: 38,
    servings: 30,
    code: 'BALANCE / 04',
    shortDescription: 'Curcumin, thoughtfully formulated with absorption in mind.',
    description:
      'CURCUMIN+ is a focused botanical formula created for everyday balance and recovery routines. It brings one well-known ingredient into a clear, considered format.',
    formulaNotes: ['Curcumin-focused formula', 'Designed with absorption in mind', '30-serving format'],
    usage:
      'Use only as directed on the product label. Curcumin may not be appropriate for everyone; consult a qualified healthcare professional if you take medication or have a health condition.',
    tone: 'clay',
  },
]

export const categories: Array<'All formulas' | HealthCategory> = [
  'All formulas',
  'Immunity',
  'Gut Health',
  'Recovery',
  'Inflammation',
]

export const testimonials = [
  {
    quote: 'The Private Vault made a complicated choice feel remarkably clear. Everything feels considered.',
    name: 'Amelia R.',
    detail: 'Private Vault member',
  },
  {
    quote: 'Beautifully packaged, easy to understand, and refreshingly restrained. My routine finally feels consistent.',
    name: 'Daniel K.',
    detail: 'AMINOSYN 9 customer',
  },
  {
    quote: 'I came for one formula and stayed for the clarity. The bundle saving was a welcome bonus.',
    name: 'Sofia M.',
    detail: 'Private Vault member',
  },
]

export const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value)

export const productById = (id: string) => products.find((product) => product.id === id)

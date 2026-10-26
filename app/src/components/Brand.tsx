import { cn } from '@/lib/utils'

export function Brand({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <span className={cn('brand', light && 'brand--light', className)} aria-label="PanaceaMed">
      <span className="brand__panacea">PANACEA</span>
      <span className="brand__med">MED</span>
      <span className="brand__dot" aria-hidden="true" />
    </span>
  )
}

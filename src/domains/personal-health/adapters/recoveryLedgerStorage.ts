/**
 * Scoped persistence adapter for PanaceaMed's Biometric Holistic Recovery Ledger.
 * Follows the exact same session account ownership convention as `lab.ts` /
 * `workoutStore.ts` so each signed-in account sees only its own recovery sessions.
 */

import { allowsPersonalHealthStorageScope, parsePersonalHealthStorageScope } from '../../../shared/kernel/personalHealthStorageScope.ts'
import type { RecoveryLedgerTransaction } from '../engine/holisticRecoveryProtocol.ts'

const LEDGER_PREFIX = 'panacea.recovery_ledger.v1:'

function ledgerKey(): { readonly key: string; readonly accountId?: string; readonly subjectId?: string } | null {
  if (typeof localStorage === 'undefined') return null
  const scope = parsePersonalHealthStorageScope(localStorage.getItem('panaceamed.session.v1'), Date.now())
  if (!allowsPersonalHealthStorageScope(scope) || scope.kind === 'invalid') return null
  if (scope.kind === 'account') {
    return { key: `${LEDGER_PREFIX}${scope.token}`, accountId: scope.accountId, subjectId: scope.subjectId }
  }
  return { key: `${LEDGER_PREFIX}anonymous` }
}

export function readRecoveryLedger(): RecoveryLedgerTransaction[] {
  const ctx = ledgerKey()
  if (!ctx) return []
  try {
    const parsed = JSON.parse(localStorage.getItem(ctx.key) || 'null') as {
      ownerAccountId?: string
      subjectId?: string
      items?: RecoveryLedgerTransaction[]
    } | null
    if (!parsed || !Array.isArray(parsed.items)) return []
    if (ctx.accountId && (parsed.ownerAccountId !== ctx.accountId || parsed.subjectId !== ctx.subjectId)) return []
    return parsed.items.filter((x) => x && typeof x.id === 'string' && typeof x.at === 'string')
  } catch {
    return []
  }
}

export function appendRecoveryLedgerEntry(tx: RecoveryLedgerTransaction): RecoveryLedgerTransaction[] {
  const ctx = ledgerKey()
  if (!ctx) return []
  const existing = readRecoveryLedger().filter((x) => x.id !== tx.id)
  const next = [tx, ...existing].slice(0, 120)
  try {
    localStorage.setItem(
      ctx.key,
      JSON.stringify({
        version: 1,
        ownerAccountId: ctx.accountId,
        subjectId: ctx.subjectId,
        items: next,
      }),
    )
    try {
      window.dispatchEvent(new Event('panacea:health-updated'))
    } catch {
      /* ignore SSR */
    }
  } catch {
    /* ignore storage quota */
  }
  return next
}

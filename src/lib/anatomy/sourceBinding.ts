import type { AnatomySourceNodeBundle } from '../anatomySourceNodeRegistry'

export interface AnatomyBindingNode {
  id: string
  label: string
  aliases: readonly string[]
  sourceNodeAliases: readonly string[]
}

export interface AnatomySourceBinding {
  nodeId: string
  file: string
  sourceName: string
  matchedAlias: string
  status: 'bound'
}

export interface AnatomyAmbiguousSourceBinding {
  file: string
  sourceName: string
  claimantNodeIds: string[]
  status: 'ambiguous'
}

export interface AnatomySourceBindingReport {
  bindings: AnatomySourceBinding[]
  ambiguous: AnatomyAmbiguousSourceBinding[]
  unboundNodeIds: string[]
}

export function normalizeExactAnatomyName(value: string): string {
  return value
    .normalize('NFKD')
    .toLocaleLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function bindingAliases(node: AnatomyBindingNode) {
  return [node.id, node.label, ...node.aliases, ...node.sourceNodeAliases]
    .map((raw) => ({ raw, normalized: normalizeExactAnatomyName(raw) }))
    .filter((entry) => entry.normalized)
}

/**
 * Bind reviewed atlas graph nodes to exact GLB/source-node names.
 * Fuzzy/stem matching remains useful for interactive discovery, but a render
 * binding becomes part of asset/provenance identity and therefore fails closed.
 */
export function bindAnatomyNodesToSourceSnapshot(
  nodes: readonly AnatomyBindingNode[],
  sourceBundles: readonly AnatomySourceNodeBundle[],
): AnatomySourceBindingReport {
  const nodeById = new Map<string, AnatomyBindingNode>()
  for (const node of nodes) {
    if (!node.id.trim()) throw new Error('Anatomy binding node id must not be blank.')
    if (nodeById.has(node.id)) throw new Error(`Duplicate anatomy binding node id: ${node.id}.`)
    nodeById.set(node.id, node)
  }

  const claims = new Map<string, { file: string; sourceName: string; nodeId: string; matchedAlias: string }[]>()
  for (const bundle of [...sourceBundles].sort((a, b) => a.file.localeCompare(b.file))) {
    const seenNames = new Set<string>()
    for (const sourceName of [...bundle.names].sort((a, b) => a.localeCompare(b))) {
      const normalizedSource = normalizeExactAnatomyName(sourceName)
      if (!normalizedSource || seenNames.has(normalizedSource)) continue
      seenNames.add(normalizedSource)
      const sourceKey = `${bundle.file}\u0000${normalizedSource}`

      for (const node of nodes) {
        const alias = bindingAliases(node).find((entry) => entry.normalized === normalizedSource)
        if (!alias) continue
        const current = claims.get(sourceKey) ?? []
        current.push({ file: bundle.file, sourceName, nodeId: node.id, matchedAlias: alias.raw })
        claims.set(sourceKey, current)
      }
    }
  }

  const bindings: AnatomySourceBinding[] = []
  const ambiguous: AnatomyAmbiguousSourceBinding[] = []
  const boundNodes = new Set<string>()

  for (const [, rawClaims] of [...claims.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const uniqueByNode = new Map(rawClaims.map((claim) => [claim.nodeId, claim] as const))
    const claimants = [...uniqueByNode.values()].sort((a, b) => a.nodeId.localeCompare(b.nodeId))
    if (claimants.length !== 1) {
      const first = claimants[0]
      ambiguous.push({
        file: first.file,
        sourceName: first.sourceName,
        claimantNodeIds: claimants.map((claim) => claim.nodeId),
        status: 'ambiguous',
      })
      continue
    }

    const claim = claimants[0]
    bindings.push({
      nodeId: claim.nodeId,
      file: claim.file,
      sourceName: claim.sourceName,
      matchedAlias: claim.matchedAlias,
      status: 'bound',
    })
    boundNodes.add(claim.nodeId)
  }

  bindings.sort((a, b) => a.nodeId.localeCompare(b.nodeId) || a.file.localeCompare(b.file) || a.sourceName.localeCompare(b.sourceName))
  ambiguous.sort((a, b) => a.file.localeCompare(b.file) || a.sourceName.localeCompare(b.sourceName))
  const unboundNodeIds = nodes.map((node) => node.id).filter((id) => !boundNodes.has(id)).sort()

  return { bindings, ambiguous, unboundNodeIds }
}

export function sourceBindingsForNode(report: AnatomySourceBindingReport, nodeId: string) {
  return report.bindings.filter((binding) => binding.nodeId === nodeId)
}

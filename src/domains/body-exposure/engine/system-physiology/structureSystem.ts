// Which body system a picked atlas structure belongs to, so selecting it in 3D can open that system's physiology.
// Pure: no I/O, no clock, no randomness.
//
// The canonical system targets (data/bodySystems.ts) already say which shipped file holds each system and which
// names identify it. This reads them; it does not add hints, because other surfaces resolve those same targets.
// Order of rules:
//   1. a name containing a hint of a system whose target lives in the structure's file — the longest hint wins
//      (so "optic nerve" beats "nerve", "gallbladder" beats "bladder"); an exact tie keeps every tied system;
//   2. a few named structures the hints miss in the nervous file belong to the eye and ear (sensory / ENT);
//   3. a file that is one system's own bundle (muscles, nerves) gives that system to its other structures;
//   4. a file only one system uses gives that system;
//   5. otherwise nothing: an unmapped structure says so instead of borrowing a neighbour's system.

import { BODY_SYSTEM_SOURCE_WAVE, type BodySystemId } from '../../data/bodySystems.ts'
import { ATLAS_LAYERS } from '../atlasHomeConfig.ts'
import type { AtlasLayerId } from '../atlas-stage/stageLayers.ts'

export type StructureSystemBasis = 'hint' | 'named-exception' | 'file-default' | 'single-owner' | 'unmatched'

export type StructureSystemResult =
  | { ok: true; systems: readonly BodySystemId[]; basis: StructureSystemBasis }
  | { ok: false; reason: 'invalid-name' | 'unknown-layer' }

/** Longer than any structure name in the shipped index (the longest is under 80 characters). */
export const MAX_STRUCTURE_NAME_LENGTH = 200

/**
 * Named structures of the nervous file that no hint covers and that belong to the eye or the ear: the lacrimal
 * apparatus (eye adnexa) and the auditory (pharyngotympanic) tube.
 */
const NERVOUS_FILE_SENSORY_NAMES: readonly string[] = ['lacrimal', 'auditory tube']

/** Files that are one system's own bundle: a structure there with no other claim belongs to that system. */
const FILE_DEFAULT: Readonly<Record<string, BodySystemId>> = {
  'muscular.glb': 'musculoskeletal',
  'nervous.glb': 'nervous',
}

const LAYER_FILE = new Map<AtlasLayerId, string>(ATLAS_LAYERS.map((layer) => [layer.id, layer.file]))

const normalise = (name: string) => name.toLowerCase().replace(/\s+/g, ' ').trim()

/** Every system that has a target in the file, in canonical order. */
function ownersOf(file: string): BodySystemId[] {
  return BODY_SYSTEM_SOURCE_WAVE.filter((system) => system.targets.some((target) => target.file === file)).map((system) => system.id)
}

export function systemsForStructure(name: unknown, layer: unknown): StructureSystemResult {
  if (typeof name !== 'string' || name.length > MAX_STRUCTURE_NAME_LENGTH) return { ok: false, reason: 'invalid-name' }
  const text = normalise(name)
  if (!text) return { ok: false, reason: 'invalid-name' }
  const file = typeof layer === 'string' ? LAYER_FILE.get(layer as AtlasLayerId) : undefined
  if (!file) return { ok: false, reason: 'unknown-layer' }

  let best = 0
  let systems: BodySystemId[] = []
  for (const system of BODY_SYSTEM_SOURCE_WAVE) {
    for (const target of system.targets) {
      if (target.file !== file || target.allSourceNodes) continue
      for (const hint of target.hints) {
        if (!text.includes(hint)) continue
        if (hint.length > best) {
          best = hint.length
          systems = [system.id]
        } else if (hint.length === best && !systems.includes(system.id)) {
          systems.push(system.id)
        }
      }
    }
  }
  if (systems.length > 0) return { ok: true, systems, basis: 'hint' }

  if (file === 'nervous.glb' && NERVOUS_FILE_SENSORY_NAMES.some((part) => text.includes(part))) {
    return { ok: true, systems: ['sensory-ent'], basis: 'named-exception' }
  }
  const fileDefault = FILE_DEFAULT[file]
  if (fileDefault) return { ok: true, systems: [fileDefault], basis: 'file-default' }
  const owners = ownersOf(file)
  if (owners.length === 1) return { ok: true, systems: owners, basis: 'single-owner' }
  return { ok: true, systems: [], basis: 'unmatched' }
}

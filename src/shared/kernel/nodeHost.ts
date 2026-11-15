// The one door from src/ to Node's file system and environment, for the few Node-run tools and tests that live
// in this tree (repository-artifact checks, research preregistration). It returns null anywhere else — in the
// browser there is no `process` — so a caller there fails closed instead of crashing on a missing module, and
// the frontend program needs no Node type definitions. New code should take its data as input instead.

/** The parts of node:fs the callers use. */
export interface NodeFsSubset {
  existsSync(path: string): boolean
  readFileSync(path: string, encoding: 'utf8'): string
  writeFileSync(path: string, data: string, encoding: 'utf8'): void
  mkdirSync(path: string, options: { recursive: true }): unknown
}

/** The parts of node:path the callers use. */
export interface NodePathSubset {
  join(...parts: string[]): string
  dirname(path: string): string
}

export interface NodeHost {
  fs: NodeFsSubset
  path: NodePathSubset
  cwd(): string
  env: Readonly<Record<string, string | undefined>>
}

interface ProcessLike {
  getBuiltinModule?: (id: string) => unknown
  cwd?: () => string
  env?: Record<string, string | undefined>
}

/** Node's host capabilities, or null when not running under Node (≥ 20.16 / 22.3, which have getBuiltinModule). */
export function nodeHost(scope: unknown = globalThis): NodeHost | null {
  const proc = (scope as { process?: ProcessLike } | null | undefined)?.process
  if (!proc || typeof proc.getBuiltinModule !== 'function' || typeof proc.cwd !== 'function') return null
  const fs = proc.getBuiltinModule('node:fs') as Partial<NodeFsSubset> | undefined
  const path = proc.getBuiltinModule('node:path') as Partial<NodePathSubset> | undefined
  if (typeof fs?.existsSync !== 'function' || typeof fs.readFileSync !== 'function' || typeof path?.join !== 'function') return null
  const cwd = proc.cwd.bind(proc)
  return { fs: fs as NodeFsSubset, path: path as NodePathSubset, cwd, env: proc.env ?? {} }
}

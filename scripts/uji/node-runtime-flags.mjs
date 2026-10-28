// Native TypeScript stripping is default in Node 25+; Node 26 removes the
// legacy transform flag entirely. Keep Node 22/23/24 support for existing
// repository tests that still use transformable TypeScript syntax.
// Do not infer scientific/test acceptance from selecting a valid runtime flag.
export function typeScriptRunnerArgs(nodeVersion = process.versions.node) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(nodeVersion)
  if (!match) throw new TypeError(`Invalid Node version: ${nodeVersion}`)
  const major = Number(match[1])
  const minor = Number(match[2])
  if (major < 22 || (major === 22 && minor < 18)) {
    throw new RangeError('The Panacea TypeScript test runner requires Node >= 22.18')
  }
  return major < 25 ? ['--experimental-transform-types'] : []
}

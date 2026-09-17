import process from 'node:process'
import { loadCapabilityOs, validateCapabilityOs } from './lib/capability-os.mjs'

try {
  const { manifest, schema } = await loadCapabilityOs({})
  const errors = validateCapabilityOs(manifest, schema)

  if (errors.length > 0) {
    console.error(`Capability OS validation failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`)
    errors.forEach((error) => console.error(`- ${error}`))
    process.exitCode = 1
  } else {
    console.log(`Capability OS validation passed (${manifest.capabilities.length} capabilities).`)
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}

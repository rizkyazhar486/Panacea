import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

const matchesType = (value, type) => {
  switch (type) {
    case 'null':
      return value === null
    case 'array':
      return Array.isArray(value)
    case 'object':
      return isPlainObject(value)
    case 'integer':
      return Number.isInteger(value)
    case 'number':
      return typeof value === 'number' && Number.isFinite(value)
    default:
      return typeof value === type
  }
}

function validateAgainstSchema(value, schema, location = '$') {
  const errors = []

  if (schema.type !== undefined) {
    const allowed = Array.isArray(schema.type) ? schema.type : [schema.type]
    if (!allowed.some((type) => matchesType(value, type))) {
      errors.push(`${location}: expected type ${allowed.join(' | ')}`)
      return errors
    }
  }

  if (Array.isArray(schema.enum) && !schema.enum.some((entry) => Object.is(entry, value))) {
    errors.push(`${location}: value ${JSON.stringify(value)} is not in enum`)
  }

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${location}: string is shorter than minLength ${schema.minLength}`)
    }
    if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${location}: string does not match pattern ${schema.pattern}`)
    }
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${location}: array has fewer than ${schema.minItems} items`)
    }
    if (schema.uniqueItems) {
      const serialized = value.map((item) => JSON.stringify(item))
      if (new Set(serialized).size !== serialized.length) {
        errors.push(`${location}: array items must be unique`)
      }
    }
    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(...validateAgainstSchema(item, schema.items, `${location}[${index}]`))
      })
    }
  }

  if (isPlainObject(value)) {
    const properties = schema.properties ?? {}
    for (const required of schema.required ?? []) {
      if (!Object.prototype.hasOwnProperty.call(value, required)) {
        errors.push(`${location}: missing required property ${required}`)
      }
    }

    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.prototype.hasOwnProperty.call(properties, key)) {
          errors.push(`${location}.${key}: additional property is not allowed`)
        }
      }
    }

    for (const [key, childSchema] of Object.entries(properties)) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        errors.push(...validateAgainstSchema(value[key], childSchema, `${location}.${key}`))
      }
    }
  }

  return errors
}

function semanticErrors(manifest) {
  const errors = []
  const seenIds = new Set()

  if (!Array.isArray(manifest?.capabilities)) return errors

  for (const entry of manifest.capabilities) {
    if (!isPlainObject(entry)) continue
    const id = typeof entry.id === 'string' ? entry.id : '<unknown>'

    if (typeof entry.id === 'string') {
      if (seenIds.has(entry.id)) errors.push(`duplicate capability id ${entry.id}`)
      seenIds.add(entry.id)
    }

    if (
      isPlainObject(entry.executors) &&
      typeof entry.executors.preferred === 'string' &&
      Array.isArray(entry.executors.supported) &&
      !entry.executors.supported.includes(entry.executors.preferred)
    ) {
      errors.push(`${id}: preferred executor must be included in supported executors`)
    }

    if (typeof entry.primary === 'string' && Array.isArray(entry.fallbacks)) {
      if (entry.fallbacks.includes(entry.primary)) {
        errors.push(`${id}: primary provider must not be repeated in fallbacks`)
      }
      if (new Set(entry.fallbacks).size !== entry.fallbacks.length) {
        errors.push(`${id}: fallback providers must be unique`)
      }
    }

    if (entry.sideEffects === 'read-only' && entry.writeAuthority !== 'none') {
      errors.push(`${id}: read-only capability requires write authority none`)
    }
  }

  return errors
}

export function validateCapabilityOs(manifest, schema) {
  return [...validateAgainstSchema(manifest, schema), ...semanticErrors(manifest)]
}

export async function loadCapabilityOs({ manifestPath, schemaPath } = {}) {
  const resolvedManifest = path.resolve(
    process.cwd(),
    manifestPath ?? process.env.PANACEA_CAPABILITY_OS_MANIFEST ?? 'config/capability-os.json',
  )
  const resolvedSchema = path.resolve(
    process.cwd(),
    schemaPath ?? process.env.PANACEA_CAPABILITY_OS_SCHEMA ?? 'config/capability-os.schema.json',
  )

  const [manifestRaw, schemaRaw] = await Promise.all([
    readFile(resolvedManifest, 'utf8'),
    readFile(resolvedSchema, 'utf8'),
  ])

  return {
    manifest: JSON.parse(manifestRaw),
    schema: JSON.parse(schemaRaw),
  }
}

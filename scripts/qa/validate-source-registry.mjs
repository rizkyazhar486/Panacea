import { existsSync, realpathSync, statSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const REPO_ROOT = realpathSync(process.cwd());
const ROOT = path.resolve(process.env.PANACEA_SOURCE_REGISTRY_ROOT || 'data/source-registry');
const SCHEMA_PATH = path.join(ROOT, 'source.schema.json');

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const matchesType = (value, type) => {
  switch (type) {
    case 'null':
      return value === null;
    case 'array':
      return Array.isArray(value);
    case 'object':
      return isPlainObject(value);
    case 'integer':
      return Number.isInteger(value);
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    default:
      return typeof value === type;
  }
};

const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const isValidUri = (value) => {
  try {
    const url = new URL(value);
    return Boolean(url.protocol);
  } catch {
    return false;
  }
};

const isValidWebUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

function validate(value, schema, location = '$') {
  const errors = [];

  if (Array.isArray(schema.oneOf)) {
    const attempts = schema.oneOf.map((candidate) => validate(value, candidate, location));
    const matched = attempts.filter((candidateErrors) => candidateErrors.length === 0).length;
    if (matched !== 1) {
      errors.push(`${location}: must match exactly one schema in oneOf (matched ${matched})`);
      return errors;
    }
  }

  if (schema.type !== undefined) {
    const allowed = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!allowed.some((type) => matchesType(value, type))) {
      errors.push(`${location}: expected type ${allowed.join(' | ')}`);
      return errors;
    }
  }

  if (Array.isArray(schema.enum) && !schema.enum.some((entry) => Object.is(entry, value))) {
    errors.push(`${location}: value ${JSON.stringify(value)} is not in enum`);
  }

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${location}: string is shorter than minLength ${schema.minLength}`);
    }
    if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${location}: string does not match pattern ${schema.pattern}`);
    }
    if (schema.format === 'uri' && !isValidUri(value)) {
      errors.push(`${location}: invalid URI`);
    }
    if (schema.format === 'date' && !isValidDate(value)) {
      errors.push(`${location}: invalid RFC3339 full-date`);
    }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${location}: value is below minimum ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(`${location}: value is above maximum ${schema.maximum}`);
    }
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${location}: array has fewer than ${schema.minItems} items`);
    }
    if (schema.uniqueItems) {
      const serialized = value.map((item) => JSON.stringify(item));
      if (new Set(serialized).size !== serialized.length) {
        errors.push(`${location}: array items must be unique`);
      }
    }
    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(...validate(item, schema.items, `${location}[${index}]`));
      });
    }
  }

  if (isPlainObject(value)) {
    const properties = schema.properties ?? {};
    for (const required of schema.required ?? []) {
      if (!Object.prototype.hasOwnProperty.call(value, required)) {
        errors.push(`${location}: missing required property ${required}`);
      }
    }

    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.prototype.hasOwnProperty.call(properties, key)) {
          errors.push(`${location}.${key}: additional property is not allowed`);
        }
      }
    }

    for (const [key, childSchema] of Object.entries(properties)) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        errors.push(...validate(value[key], childSchema, `${location}.${key}`));
      }
    }
  }

  return errors;
}

async function collectJsonFiles(directory) {
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJsonFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith('.json') && !entry.name.endsWith('.schema.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

async function parseJson(filePath) {
  const raw = await readFile(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`${path.relative(process.cwd(), filePath)}: invalid JSON (${error.message})`);
  }
}

function validateActiveAdapterModule(modulePath, relativeRegistryPath) {
  const errors = [];
  if (typeof modulePath !== 'string' || !modulePath.trim()) return errors;

  if (path.isAbsolute(modulePath)) {
    errors.push(`${relativeRegistryPath}: ACTIVE adapter.module must be repository-relative`);
    return errors;
  }

  const resolved = path.resolve(REPO_ROOT, modulePath);
  const relativeToRepo = path.relative(REPO_ROOT, resolved);
  if (
    relativeToRepo === '..' ||
    relativeToRepo.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeToRepo)
  ) {
    errors.push(`${relativeRegistryPath}: ACTIVE adapter.module must stay inside the repository`);
    return errors;
  }

  if (!existsSync(resolved)) {
    errors.push(`${relativeRegistryPath}: ACTIVE adapter.module does not exist: ${JSON.stringify(modulePath)}`);
    return errors;
  }

  let realModulePath;
  try {
    realModulePath = realpathSync(resolved);
  } catch {
    errors.push(`${relativeRegistryPath}: ACTIVE adapter.module cannot be resolved: ${JSON.stringify(modulePath)}`);
    return errors;
  }

  const realRelative = path.relative(REPO_ROOT, realModulePath);
  if (
    realRelative === '..' ||
    realRelative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(realRelative)
  ) {
    errors.push(`${relativeRegistryPath}: ACTIVE adapter.module resolves outside the repository`);
    return errors;
  }

  if (!statSync(realModulePath).isFile()) {
    errors.push(`${relativeRegistryPath}: ACTIVE adapter.module must reference a file: ${JSON.stringify(modulePath)}`);
  }

  return errors;
}

function validateWebProvenanceUrls(value, relativeRegistryPath) {
  const errors = [];
  const candidates = [
    ['homepage', value.homepage],
    ['repository', value.repository],
    ['license.verificationUrl', value.license?.verificationUrl],
  ];

  for (const [field, candidate] of candidates) {
    if (typeof candidate === 'string' && !isValidWebUrl(candidate)) {
      errors.push(`${relativeRegistryPath}: ${field} must use an http or https URL`);
    }
  }

  return errors;
}

function validateSemanticIntegrity(value, filePath, seenIds) {
  const errors = [];
  const relative = path.relative(process.cwd(), filePath);
  const relativeFromRegistry = path.relative(ROOT, filePath);
  const categoryDirectory = relativeFromRegistry.split(path.sep)[0];

  if (typeof value.id === 'string') {
    const existing = seenIds.get(value.id);
    if (existing) {
      errors.push(`${relative}: duplicate source id ${JSON.stringify(value.id)}; already used by ${existing}`);
    } else {
      seenIds.set(value.id, relative);
    }
  }

  if (typeof value.category === 'string' && categoryDirectory !== value.category) {
    errors.push(
      `${relative}: category ${JSON.stringify(value.category)} must match registry directory ${JSON.stringify(categoryDirectory)}`,
    );
  }

  errors.push(...validateWebProvenanceUrls(value, relative));

  if (value.adapter?.status === 'ACTIVE') {
    if (value.provenance?.sourceIdentityRequired !== true) {
      errors.push(`${relative}: ACTIVE adapter requires provenance.sourceIdentityRequired true`);
    }
    if (!value.adapter?.module) {
      errors.push(`${relative}: ACTIVE adapter must declare a non-null adapter.module`);
    } else {
      errors.push(...validateActiveAdapterModule(value.adapter.module, relative));
    }
  }

  if (value.license?.status === 'VERIFIED') {
    if (!value.license.identifier) {
      errors.push(`${relative}: VERIFIED license must declare license.identifier`);
    }
    if (!value.license.verificationUrl) {
      errors.push(`${relative}: VERIFIED license must declare license.verificationUrl`);
    }
    if (!value.license.verifiedAt) {
      errors.push(`${relative}: VERIFIED license must declare license.verifiedAt`);
    }
  }

  if (value.license?.commercialUse === 'ALLOWED' && value.license?.status !== 'VERIFIED') {
    errors.push(`${relative}: commercialUse ALLOWED requires license.status VERIFIED`);
  }

  return errors;
}

async function main() {
  const schema = await parseJson(SCHEMA_PATH);
  const files = (await collectJsonFiles(ROOT)).sort();
  const failures = [];
  const seenIds = new Map();

  if (files.length === 0) {
    failures.push('Source registry contains no entries.');
  }

  for (const file of files) {
    const relative = path.relative(process.cwd(), file);
    let value;
    try {
      value = await parseJson(file);
    } catch (error) {
      failures.push(error.message);
      continue;
    }

    const errors = validate(value, schema);
    failures.push(...errors.map((error) => `${relative}: ${error}`));

    if (errors.length === 0) {
      failures.push(...validateSemanticIntegrity(value, file, seenIds));
    }
  }

  if (failures.length > 0) {
    console.error(`Source registry validation failed (${failures.length} issue${failures.length === 1 ? '' : 's'}):`);
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exitCode = 1;
    return;
  }

  console.log(`Source registry validation passed (${files.length} entries, ${seenIds.size} unique ids).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

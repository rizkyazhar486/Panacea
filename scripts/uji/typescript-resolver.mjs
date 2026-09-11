import { existsSync, realpathSync, statSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { dirname, extname, relative, resolve as resolvePath } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = realpathSync(resolvePath(dirname(fileURLToPath(import.meta.url)), '..', '..'))
const JS_TO_TS = new Map([
  ['.js', ['.ts', '.tsx']],
  ['.jsx', ['.tsx', '.ts']],
  ['.mjs', ['.mts', '.ts']],
  ['.cjs', ['.cts', '.ts']],
])
const APPEND_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs']
const INDEX_NAMES = ['index.ts', 'index.tsx', 'index.mts', 'index.js', 'index.mjs']
const MAX_FALLBACKS = 12

function isInsideRepo(filePath) {
  const rel = relative(ROOT, filePath)
  return rel !== '..' && !rel.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) && !rel.startsWith('../') && !rel.startsWith('..\\')
}

function existingFile(filePath) {
  if (!isInsideRepo(filePath) || !existsSync(filePath)) return null
  try {
    return statSync(filePath).isFile() ? pathToFileURL(realpathSync(filePath)).href : null
  } catch {
    return null
  }
}

function fallbackUrls(specifier, parentURL) {
  if (!parentURL || (!specifier.startsWith('./') && !specifier.startsWith('../'))) return []

  let requestedPath
  try {
    requestedPath = fileURLToPath(new URL(specifier, parentURL))
  } catch {
    return []
  }

  const candidates = []
  const ext = extname(requestedPath)
  const replacements = JS_TO_TS.get(ext)
  if (replacements) {
    const stem = requestedPath.slice(0, -ext.length)
    for (const replacement of replacements) candidates.push(`${stem}${replacement}`)
  } else if (!['.ts', '.tsx', '.mts', '.cts'].includes(ext)) {
    for (const suffix of APPEND_EXTENSIONS) candidates.push(`${requestedPath}${suffix}`)
  }

  for (const indexName of INDEX_NAMES) candidates.push(resolvePath(requestedPath, indexName))

  const urls = []
  for (const candidate of candidates.slice(0, MAX_FALLBACKS)) {
    const url = existingFile(candidate)
    if (url) urls.push(url)
  }
  return urls
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context)
    } catch (error) {
      if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error
      for (const candidate of fallbackUrls(specifier, context.parentURL)) {
        try {
          return nextResolve(candidate, context)
        } catch (candidateError) {
          if (candidateError?.code !== 'ERR_MODULE_NOT_FOUND') throw candidateError
        }
      }
      throw error
    }
  },
})

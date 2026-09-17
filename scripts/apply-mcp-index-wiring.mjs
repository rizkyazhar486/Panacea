import { readFileSync, writeFileSync } from 'node:fs'

const path = 'server/src/index.ts'
const source = readFileSync(path, 'utf8')
const globalParser = "app.use(express.json({ limit: '12mb' })) // allow base64 images for AI vision\n"
const mountAnchor = "app.use('/api', globalLimiter)\nmountHttpMcp(app)\n"

if ((source.match(/app\.use\(express\.json\(\{ limit: '12mb' \}\)\) \/\/ allow base64 images for AI vision/g) ?? []).length !== 1) {
  throw new Error('Expected exactly one global 12 MB JSON parser')
}
if (!source.includes(mountAnchor)) {
  throw new Error('Expected global limiter + MCP mount anchor')
}

let next = source.replace(globalParser, '')
next = next.replace(
  mountAnchor,
  `${mountAnchor}${globalParser}`,
)

const limiterPosition = next.indexOf("app.use('/api', globalLimiter)")
const mountPosition = next.indexOf('mountHttpMcp(app)')
const parserPosition = next.indexOf("app.use(express.json({ limit: '12mb' }))")
if (!(limiterPosition >= 0 && mountPosition > limiterPosition && parserPosition > mountPosition)) {
  throw new Error(`Unsafe MCP ordering: limiter=${limiterPosition} mount=${mountPosition} parser=${parserPosition}`)
}

writeFileSync(path, next)
console.log(`MCP ordering verified: limiter=${limiterPosition} mount=${mountPosition} parser=${parserPosition}`)

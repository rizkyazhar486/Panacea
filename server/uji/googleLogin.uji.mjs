import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as nodeModule from 'node:module'
import { createContext, runInContext } from 'node:vm'

// Execute the real handler; isolate Google, disk writes,
// outbound email and JWT signing so rejected claims cannot cause side effects.
const authSource = readFileSync(new URL('../src/auth.ts', import.meta.url), 'utf8')
// Node 20 uses the server's existing TypeScript dev dependency.
const compiler = nodeModule.stripTypeScriptTypes ? undefined : (await import('typescript')).default
const transpile = nodeModule.stripTypeScriptTypes ?? ((source) => {
  return compiler.transpileModule(source, {
    compilerOptions: { module: compiler.ModuleKind.ESNext, target: compiler.ScriptTarget.ES2022 },
  }).outputText
})
const source = transpile(authSource).replace(/^import .*$/gm, '').replace(/^export /gm, '')

const cases = [
  { name: 'missing claim', payload: { email: 'user@example.test' }, status: 401 },
  { name: 'false claim', payload: { email: 'user@example.test', email_verified: false }, status: 401 },
  { name: 'string claim', payload: { email: 'user@example.test', email_verified: 'true' }, status: 401 },
  { name: 'numeric claim', payload: { email: 'user@example.test', email_verified: 1 }, status: 401 },
  { name: 'missing email', payload: { email_verified: true }, status: 401 },
  { name: 'missing payload', payload: undefined, status: 401 },
  { name: 'verified identity', payload: { email: ' USER@example.test ', email_verified: true }, status: 200 },
]
for (const fixture of cases) {
  const effects = []
  let status = 200
  let body
  const context = createContext({
    process: { env: {} },
    config: { googleClientId: 'test-client' },
    features: { googleLive: true },
    OAuth2Client: class {
      async verifyIdToken(options) {
        assert.equal(options.idToken, 'signed-token')
        assert.equal(options.audience, 'test-client')
        return { getPayload: () => fixture.payload }
      }
    },
    getUserByEmail(email) { effects.push(['lookup', email]); return undefined },
    roleForLogin() { return 'pasien' },
    upsertUser(email) { effects.push(['write', email]); return { id: 'u', email, role: 'pasien' } },
    async sendWelcome(email) { effects.push(['welcome', email]) },
    jwt: { sign() { effects.push(['sign']); return 'session-token' } },
  })
  runInContext(source, context)
  const response = {
    status(value) { status = value; return this },
    json(value) { body = value; return this },
    cookie(name, value) { effects.push(['cookie', name, value]) },
  }
  await context.googleLogin({ body: { credential: 'signed-token' } }, response)
  assert.equal(status, fixture.status, fixture.name)
  if (fixture.status === 401) {
    assert.equal(body.error, 'invalid_token', fixture.name)
    assert.deepEqual(effects, [], fixture.name + ' must not read/write accounts, send email or issue sessions')
  } else {
    assert.equal(body.user.email, 'user@example.test')
    assert.equal(body.token, 'session-token')
    assert.equal(body.live, true)
    assert.deepEqual(effects, [
      ['lookup', 'user@example.test'], ['write', 'user@example.test'],
      ['welcome', 'user@example.test'], ['sign'], ['cookie', 'pmd_session', 'session-token'],
    ])
  }
}
console.log('Google login: seven identity cases preserve account/session boundaries.')

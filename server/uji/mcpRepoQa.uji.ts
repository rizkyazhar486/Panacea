// Uji allowlist QA lokal MCP.
// Public API menerima nama profile saja; command/args tidak pernah berasal dari caller.

import {
  buildQaInvocation,
  capQaOutput,
  buildQaEnvironment,
  type QaProfileName,
} from '../src/mcp/repoQa.js'

let lulus = 0
let gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

function throwsCode(nama: string, code: string, fn: () => unknown) {
  try {
    fn()
    ok(nama, false, 'tidak melempar error')
  } catch (error) {
    ok(
      nama,
      error instanceof Error && 'code' in error && (error as Error & { code?: string }).code === code,
      error instanceof Error ? error.message : String(error),
    )
  }
}

const root = '/workspace/Panacea'
const serverTypecheck = buildQaInvocation('server_typecheck', root)
ok('server_typecheck satu step', serverTypecheck.steps.length === 1)
ok('server_typecheck memakai npm', serverTypecheck.steps[0].executable === 'npm')
ok('server_typecheck args fixed', JSON.stringify(serverTypecheck.steps[0].args) === JSON.stringify(['run', 'typecheck']))
ok('server_typecheck cwd di server', serverTypecheck.steps[0].cwd === '/workspace/Panacea/server')
ok('shell selalu false', serverTypecheck.steps.every((step) => step.shell === false))

const validators = buildQaInvocation('root_validators', root)
ok('root_validators tiga step', validators.steps.length === 3)
ok(
  'validator sequence fixed',
  validators.steps.map((step) => step.args.join(' ')).join('|') ===
    'run validate:source-registry|run validate:feature-factory|run validate:academic-review',
)
ok('semua validator cwd root', validators.steps.every((step) => step.cwd === root))
ok('semua cwd tetap di bawah repo root', validators.steps.every((step) => step.cwd === root || step.cwd.startsWith(`${root}/`)))

throwsCode(
  'string command berbahaya tidak dapat menjadi profile',
  'qa_profile_not_allowed',
  () => buildQaInvocation('; rm -rf /' as QaProfileName, root),
)
throwsCode(
  'repo root relatif ditolak',
  'invalid_input',
  () => buildQaInvocation('server_typecheck', '../Panacea'),
)

const capped = capQaOutput('', '1234567890', 5)
ok('output dicap berdasarkan byte', capped.text === '12345')
ok('output menandai truncation', capped.truncated === true)
const cappedAgain = capQaOutput(capped.text, 'SHOULD-NOT-APPEAR', 5)
ok('output yang sudah penuh tidak tumbuh lagi', cappedAgain.text === '12345' && cappedAgain.truncated)

const env = buildQaEnvironment({
  PATH: '/usr/bin',
  HOME: '/home/runner',
  CI: 'true',
  DATABASE_URL: 'postgres://secret',
  OPENAI_API_KEY: 'secret',
  SATUSEHAT_CLIENT_SECRET: 'secret',
})
ok('PATH diteruskan ke QA child process', env.PATH === '/usr/bin')
ok('CI diteruskan ke QA child process', env.CI === 'true')
ok('database secret tidak diteruskan', !('DATABASE_URL' in env))
ok('OpenAI key tidak diteruskan', !('OPENAI_API_KEY' in env))
ok('SATUSEHAT secret tidak diteruskan', !('SATUSEHAT_CLIENT_SECRET' in env))

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)

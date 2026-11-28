import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const emrSrc = readFileSync(new URL('../../src/pages/clinical/EMR.tsx', import.meta.url), 'utf8')
assert.ok(emrSrc.includes('CodeMaxDoctorSdkConsole'), 'EMR.tsx must lazy-mount CodeMaxDoctorSdkConsole')
assert.ok(emrSrc.includes('data-emr-codemax-toggle'), 'EMR.tsx must expose on-demand CodeMax SDK console toggle')

const consoleSrc = readFileSync(new URL('../../src/components/clinical/CodeMaxDoctorSdkConsole.tsx', import.meta.url), 'utf8')
assert.ok(consoleSrc.includes('createCodeMaxDoctorSdk'), 'CodeMaxDoctorSdkConsole must instantiate canonical CodeMax Doctor SDK')
assert.ok(consoleSrc.includes('/api/ai/codemax/doctor-emr'), 'CodeMaxDoctorSdkConsole must bind to clinician-gated CodeMax server endpoint')
assert.ok(consoleSrc.includes('className="dark space-y-3'), 'CodeMaxDoctorSdkConsole must declare explicit dark surface marker')

console.log('codemax-doctor-emr-console: lazy /emr integration, CodeMax SDK transport & dark surface contract PASS')

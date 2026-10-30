import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')
const router = source('src/main.tsx')
const visit = source('src/pages/clinical/VisitOS.tsx')
const emr = source('src/pages/clinical/EMR.tsx')
const episode = source('src/pages/clinical/CareEpisode.tsx')

test('legacy Care Episode links resolve to canonical VisitOS route', () => {
  assert.match(router, /<Route path="\/visit" element=\{<Navigate to="\/visit-os" replace \/>\} \/>/)
  assert.match(router, /<Route path="\/visit-os" element=\{<VisitOS \/>\} \/>/)
  assert.match(episode, /to="\/visit"/, 'legacy links continue to resolve by redirect')
})

test('primary VisitOS action carries navigation origin without copying patient identity', () => {
  assert.match(visit, /to=\{outcomeJob\.nextAction\.href\} aria-describedby="visit-next-action-reason" state=\{\{ fromVisitOS: true \}\}/)
  assert.match(visit, /const \{ state, activePatient, setActivePatient \} = useStore\(\)/)
  assert.doesNotMatch(visit, /state=\{\{[^}]*patientId:/, 'navigation state must not become a parallel patient source')
})

test('EMR provides a contextual and accessible return without changing clinical authority', () => {
  assert.match(emr, /import \{ Link, useLocation \} from 'react-router-dom'/)
  assert.match(emr, /location\.state\?\.fromVisitOS !== true/)
  assert.match(emr, /<nav aria-label="Return to Visit OS"/)
  assert.match(emr, /<Link to="\/visit-os" className="[^"]*min-h-11[^"]*focus-visible:outline[^"]*"/)
  assert.match(emr, /<VisitOsReturn blocked=\{dirty\} \/>/, 'unsaved changes block this return path')
  assert.match(emr, /<p role="status"[^>]*>\s*Save your draft changes before returning to Visit OS\./)
  assert.match(emr, /if \(strBlocked\) return .*<VisitOsReturn \/><StrGate /)
  assert.match(emr, /if \(!draft\) return .*<VisitOsReturn \/><EmptyEMR /)
  assert.match(emr, /const \{ state, activePatient, saveRecord \} = store/, 'EMR uses the existing patient context')
})

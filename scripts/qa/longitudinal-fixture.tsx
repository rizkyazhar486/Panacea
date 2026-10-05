import { createRoot } from 'react-dom/client'
import { StoreProvider, useStore } from '../../src/lib/store'
import { LongitudinalStateProvider, useLongitudinalState } from '../../src/lib/useLongitudinalState'
import { tambahLab } from '../../src/lib/lab'
import { mergeVitals } from '../../src/lib/healthVitals'

const identities = new WeakMap<object, number>()
let identity = 0
function Consumer({ name }: { name: string }) {
  const snapshot = useLongitudinalState()
  if (!identities.has(snapshot)) identities.set(snapshot, ++identity)
  return <output data-consumer={name} data-identity={identities.get(snapshot)} data-revision={snapshot.revision} data-subject={snapshot.state?.subjectId ?? ''}>
    {JSON.stringify(Object.values(snapshot.state?.eventsById ?? {}).map(e => ({ metric: e.metric, value: e.value, subject: e.subjectId })))}
  </output>
}
function Controls() {
  const store = useStore()
  return <>
    <button onClick={() => store.updateSettings({ notifVitals: !store.state.settings.notifVitals })}>Unrelated setting</button>
    <button onClick={() => tambahLab('gdp', '2026-09-20', 110)}>Change lab</button>
    <button onClick={() => mergeVitals({ heartRate: 76, measuredAt: '2026-09-20T08:00:00.000Z', source: 'QA wearable' })}>Change vitals</button>
    <button onClick={() => store.login({ ...store.account!, email: 'second@localhost.test', patientId: 'p2', role: 'dokter' })}>Switch patient</button>
    <button onClick={() => store.logout()}>Logout</button>
    <button onClick={() => store.login({ email: 'local@localhost.test', name: 'Local QA', role: 'pasien', isSubscriber: false, loggedAt: new Date().toISOString() })}>Local patient login</button>
  </>
}
createRoot(document.getElementById('root')!).render(<StoreProvider><LongitudinalStateProvider>
  <Controls /><Consumer name="timeline" /><Consumer name="body" /><Consumer name="clinical" />
</LongitudinalStateProvider></StoreProvider>)

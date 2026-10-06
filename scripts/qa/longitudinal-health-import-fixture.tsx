import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { StoreProvider, useStore } from '../../src/lib/store'
import { HealthProfile } from '../../src/pages/HealthProfile'
function Fixture() {
  const store = useStore()
  const [show, setShow] = useState(true)
  return <>
    <button onClick={() => store.login({ id: 'qa-B', patientId: 'qa-B', email: 'b@localhost.test', name: 'Fixture B', role: 'pasien', isSubscriber: false, loggedAt: new Date().toISOString() })}>Replace owner</button>
    <button onClick={() => setShow(x => !x)}>Toggle form</button>
    <output data-owner>{store.account?.id}</output>
    {show && <HealthProfile />}
  </>
}
createRoot(document.getElementById('root')!).render(<HashRouter><StoreProvider><Fixture /></StoreProvider></HashRouter>)

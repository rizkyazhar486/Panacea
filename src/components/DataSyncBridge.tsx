import { useEffect } from 'react'
import { syncRemoteHealthData } from '../lib/remoteDataSync'

/**
 * App-wide synchronization coordinator.
 *
 * It deliberately avoids an interval: sync runs when the app starts, returns
 * online, becomes visible, or regains focus. remoteDataSync also de-duplicates
 * concurrent calls and throttles routine triggers, so StrictMode and rapid
 * focus changes do not hammer the backend or the phone.
 */
export function DataSyncBridge() {
  useEffect(() => {
    void syncRemoteHealthData('mount')

    const onFocus = () => { void syncRemoteHealthData('focus') }
    const onOnline = () => { void syncRemoteHealthData('online', true) }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void syncRemoteHealthData('visible')
    }

    window.addEventListener('focus', onFocus)
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return null
}

export default DataSyncBridge

import { DeviceQuickSyncCard } from '../components/sync/DeviceQuickSyncCard'
import { BatasKlaimKesehatan } from '../components/BatasKlaimKesehatan'

export function DeviceSyncHub() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-3 pb-10">
      <DeviceQuickSyncCard />
      <div className="flex justify-end px-1">
        <BatasKlaimKesehatan permukaan="wellness.health-profile" />
      </div>
    </div>
  )
}

export default DeviceSyncHub

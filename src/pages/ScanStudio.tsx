import { DigitalTwinScanFlow } from '../components/scan/DigitalTwinScanFlow'
import { BatasKlaimKesehatan } from '../components/BatasKlaimKesehatan'

export function ScanStudio() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-3 pb-10">
      <DigitalTwinScanFlow />
      <div className="flex justify-end px-1">
        <BatasKlaimKesehatan permukaan="body.workspace" />
      </div>
    </div>
  )
}

export default ScanStudio

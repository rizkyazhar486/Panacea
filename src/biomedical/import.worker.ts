import { importDataset } from './imports'
import type { DataKind } from './types'

self.onmessage = async (event: MessageEvent<{ name: string; kind: DataKind; buffer: ArrayBuffer }>) => {
  try {
    const result = await importDataset(event.data.name, event.data.kind, event.data.buffer)
    self.postMessage({ result })
  } catch (e) {
    self.postMessage({ error: e instanceof Error ? e.message : 'Import failed.' })
  }
}

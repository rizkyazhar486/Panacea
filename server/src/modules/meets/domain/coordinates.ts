// Koordinat meet Club Hub. Klien mengirim 0,0 (atau tidak mengirim apa pun) bila venue
// tidak berhasil di-geocode; 0,0 adalah penanda "tidak dapat dipetakan" yang dibaca ClubHub.
// Nilai yang dikirim tetapi bukan angka terbatas dalam rentang bumi ditolak, bukan dipaksa ke 0.
export type MeetCoordinates =
  | { ok: true; lat: number; lng: number }
  | { ok: false; error: 'invalid_coordinates' }

const absent = (v: unknown) => v === undefined || v === null

export function parseMeetCoordinates(lat: unknown, lng: unknown): MeetCoordinates {
  if (absent(lat) && absent(lng)) return { ok: true, lat: 0, lng: 0 }
  if (typeof lat !== 'number' || typeof lng !== 'number') return { ok: false, error: 'invalid_coordinates' }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { ok: false, error: 'invalid_coordinates' }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return { ok: false, error: 'invalid_coordinates' }
  return { ok: true, lat, lng }
}

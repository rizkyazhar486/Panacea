// Sesi untuk halaman Training Physiology: sesi yang durasinya tidak diketahui TIDAK ikut dihitung.
// Dulu `durasiDetik: w.durasi` memasukkan durasi tak dikenal sebagai 0 detik, sehingga beban, pemulihan dan
// ketahanan dihitung dari sesi berdurasi nol palsu. Nol yang tercatat sungguhan tetap ikut sebagai 0.
import { workoutDurationSeconds } from '../../shared/kernel/workoutDurationEvidence'
import type { ImportedWorkout } from '../../lib/workoutImport'
import type { Sesi } from '../../lib/trainingPhysiology'

export function sesiFisiologi(workouts: ImportedWorkout[]): { sesi: Sesi[]; dikecualikan: number } {
  const sesi: Sesi[] = []
  for (const w of workouts) {
    const durasiDetik = workoutDurationSeconds(w)
    if (durasiDetik === null) continue
    sesi.push({ id: w.id, nama: w.nama, mulai: w.mulai, durasiDetik, jarakKm: w.jarakKm, avgHr: w.avgHr, maxHr: w.maxHr, hr: w.hr })
  }
  return { sesi, dikecualikan: workouts.length - sesi.length }
}

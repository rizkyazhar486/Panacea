// Target "Body Exposure super page clinical" — kebutuhan minimum dari pemilik.
//
// SUMBER: deskripsi pemilik repositori (2026-09-25) atas demo publik @CeoImed
// (Kenichi Kono, "AIで1プロンプト") dan rujukan KaloLumen (@t_itamiya). Unggahan
// X itu sendiri TIDAK dapat dibuka dari lingkungan pengembangan ini; tidak ada
// kode, aset, citra atau angka yang diambil darinya. Ini daftar kemampuan yang
// harus dimiliki Panacea, dengan status yang HARUS menunjuk kode nyata.
//
// Status:
// - 'ada': kemampuan berjalan di Panacea; `bukti` menunjuk berkas yang ada
//   (diperiksa gerbang target-imaging-klinis).
// - 'sebagian': sebagian berjalan; `celah` menyebut yang belum.
// - 'belum': belum ada. Tidak boleh disembunyikan dari layar/perencanaan.

export type StatusTarget = 'ada' | 'sebagian' | 'belum'
export interface TargetImaging {
  id: string
  kemampuan: string
  status: StatusTarget
  bukti: string[]
  celah?: string
}

export const SUMBER_TARGET = 'Owner description (2026-09-25) of public @CeoImed demos and the KaloLumen reference; the posts themselves were not accessible to the build environment.'

export const TARGET_IMAGING_KLINIS: readonly TargetImaging[] = [
  { id: 'mpr-sinkron', kemampuan: 'Axial / coronal / sagittal MPR with synchronized crosshair from the loaded study', status: 'ada', bukti: ['src/pages/Radiology.tsx', 'src/lib/dicomMpr.ts'] },
  { id: 'windowing', kemampuan: 'Real-time window width / level', status: 'ada', bukti: ['src/pages/Radiology.tsx'] },
  { id: 'ukur-jarak', kemampuan: 'Distance measurement in mm on every plane, fail-closed without Pixel Spacing', status: 'ada', bukti: ['src/lib/ukurMpr.ts', 'scripts/uji/ukur-mpr.mts'] },
  { id: 'volume-3d', kemampuan: '3D volume / surface rendering from real CT/MRI', status: 'ada', bukti: ['src/components/VolumeDicom3D.tsx'] },
  { id: 'lapisan', kemampuan: 'Layer toggle (several tissues at once, own range/colour/opacity)', status: 'ada', bukti: ['src/lib/lapisanVolume.ts', 'scripts/uji/lapisan-volume.mts'] },
  { id: 'potong', kemampuan: 'Movable cross-section / clipping plane', status: 'ada', bukti: ['src/lib/bidangPotong.ts', 'scripts/uji/bidang-potong.mts', 'src/components/VolumeDicom3D.tsx'] },
  { id: 'reproduksi', kemampuan: 'Reproducible research: saved render recipe with file fingerprints', status: 'ada', bukti: ['src/lib/resepRender.ts', 'scripts/uji/resep-render.mts'] },
  { id: 'satu-halaman', kemampuan: 'One super page: 3D + three MPR planes together, dark clinical multi-panel', status: 'sebagian', bukti: ['src/components/DicomCrossplanes3D.tsx'], celah: 'MPR + cross-planes live in /radiology; layered 3D lives in Body Exposure > Imaging. Not yet one synchronized layout.' },
  { id: 'endoskopi-pasien', kemampuan: 'Virtual endoscopy / fly-through inside the patient’s own lumen (bronchus, colon)', status: 'sebagian', bukti: ['src/pages/bodyhub/VirtualEndoscopyWorkbench.tsx'], celah: 'Workbench exists on atlas context; fly-through from a loaded CT airway/colon is not built.' },
  { id: 'biopsi', kemampuan: 'Biopsy simulation (bronchoscopic / gastroscopic) with sample counter', status: 'belum', bukti: [] },
  { id: 'pungsi-usg', kemampuan: 'Ultrasound-guided central venous puncture (compression, needle guidance)', status: 'belum', bukti: [] },
  { id: 'klip-anastomosis', kemampuan: 'Aneurysm clipping / microvascular anastomosis training', status: 'sebagian', bukti: ['src/pages/bodyhub/SurgicalSimulatorPanel.tsx'], celah: 'Procedure state-machine scaffold exists; no clipping or anastomosis procedure yet.' },
  { id: 'gerak-mata', kemampuan: 'Extraocular muscle / eye movement by innervation', status: 'ada', bukti: ['src/components/digital-twin/OcularMotility4D.tsx', 'src/components/digital-twin/OcularGazeSimulator.tsx'] },
  { id: 'ukuran-nyata', kemampuan: 'Real-size anatomy from real data (physical mm proportions)', status: 'ada', bukti: ['src/lib/volumeTekstur.ts'] },
]

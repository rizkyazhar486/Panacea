/**
 * @file src/domains/body-exposure/ui/uhd5k4dVitalityScrollingUxEngine.ts
 * @description PanaceaMed Frontend UHD 5K 4D Visceral Bio-Mirroring, Single-Score Progressive
 * Disclosure, and 3-Card Interactive Vitality Scrolling (Hormonal Engagement Loop) Engine.
 * Zero unsafe DOM sinks (never uses innerHTML).
 */

export type VisceralBioMirrorStateId = "STRESS_SLEEP_GLYCEMIC_SPIKE" | "HEALING_VAGAL_RECOVERY";

export interface Uhd5k4dCanvasState {
  readonly nativeWidthPx: 5120;
  readonly nativeHeightPx: 2880;
  readonly devicePixelRatio: number;
  readonly effectiveWidthPx: number;
  readonly effectiveHeightPx: number;
  readonly peelStage: 0 | 1 | 2 | 3 | 4;
  readonly bioMirrorMode: VisceralBioMirrorStateId;
  readonly primaryVesselHex: "#F43F5E" | "#38BDF8";
  readonly secondaryAuraHex: "#F59E0B" | "#10B981";
  readonly arterialPwvMps: number;
  readonly particleCount: 2048;
  readonly bioSymphony432HzActive: boolean;
}

export interface VitalityScrollingCardDescriptor {
  readonly cardIndex: 1 | 2 | 3;
  readonly domId: "vitality-card-1-wearables" | "vitality-card-2-chronofs-4d" | "vitality-card-3-emv-qr-action";
  readonly badge: string;
  readonly title: string;
  readonly subtitle: string;
}

export function computeUhd5k4dVisceralBioMirrorState(input?: {
  readonly devicePixelRatio?: number;
  readonly peelStage?: 0 | 1 | 2 | 3 | 4;
  readonly bioMirrorMode?: VisceralBioMirrorStateId;
}): Uhd5k4dCanvasState {
  const dpr = Math.max(1.0, Math.min(3.0, input?.devicePixelRatio ?? 2.0));
  const stage = input?.peelStage ?? 3;
  const mode = input?.bioMirrorMode ?? "HEALING_VAGAL_RECOVERY";
  const isStress = mode === "STRESS_SLEEP_GLYCEMIC_SPIKE";

  return Object.freeze({
    nativeWidthPx: 5120,
    nativeHeightPx: 2880,
    devicePixelRatio: dpr,
    effectiveWidthPx: Math.round(2560 * dpr),
    effectiveHeightPx: Math.round(1440 * dpr),
    peelStage: stage,
    bioMirrorMode: mode,
    primaryVesselHex: isStress ? "#F43F5E" : "#38BDF8",
    secondaryAuraHex: isStress ? "#F59E0B" : "#10B981",
    arterialPwvMps: isStress ? 8.24 : 6.08,
    particleCount: 2048,
    bioSymphony432HzActive: !isStress
  });
}

export function buildVitalityScrollingThreeCards(): readonly VitalityScrollingCardDescriptor[] {
  return Object.freeze([
    Object.freeze({
      cardIndex: 1,
      domId: "vitality-card-1-wearables",
      badge: "KARTU 1 · 25 WEARABLES BLUETOOTH & WI-FI AKTIF",
      title: "Skor Kesiapan Harian 91.4/100 — Ring, Watch, Band, CGM, Tensi & Scale Sinkron",
      subtitle: "Semua perangkat kesehatan Bluetooth & Wi-Fi Anda diolah otomatis menjadi 1 Skor Utama & 1 Rekomendasi Tindakan."
    }),
    Object.freeze({
      cardIndex: 2,
      domId: "vitality-card-2-chronofs-4d",
      badge: "KARTU 2 · CERMIN TUBUH 4D HARI INI VS +10 TAHUN (CHRONOFS)",
      title: "Hemat 4.0 Tahun Usia Biologis & Pertahankan Elastisitas Pembuluh Darah",
      subtitle: "Geser waktu 10 tahun ke depan untuk melihat dampak nyata tidur cukup, gerak harian, dan hidrasi pada organ 4D Anda."
    }),
    Object.freeze({
      cardIndex: 3,
      domId: "vitality-card-3-emv-qr-action",
      badge: "KARTU 3 · KARTU IDENTITAS EMV QR/BARCODE DINAMIS & AKSI 1-KLIK",
      title: "EMVCo Tokenized 2D QR + Code-128 Barcode Berputar Otomatis",
      subtitle: "1-Klik untuk Panduan P3K/Obat Keluarga atau Auto-SOAP/SBAR & Koding JKN bagi Dokter."
    })
  ]);
}

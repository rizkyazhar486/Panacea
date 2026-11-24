/**
 * External Referral Checklist & Referral/Discharge Lifecycle Engine (Part VI).
 * Models the configurable pre-departure referral bundle checklist ("Checklist Berkas
 * Rujukan Eksternal"), multi-stage transfer lifecycle, and honest manual SISRUTE boundary.
 */

export type ReferralLifecycleStage =
  | 'Draft'
  | 'Submitted'
  | 'Awaiting Acceptance'
  | 'Accepted'
  | 'Preparation'
  | 'Ready for Transfer'
  | 'In Transit'
  | 'Arrived'
  | 'Handover'
  | 'Closed'
  | 'Rejected'
  | 'Cancelled'
  | 'Returned'
  | 'Escalated'

export type SisruteVerificationMode =
  | 'api_not_configured_manual_required'
  | 'pending_manual_check'
  | 'verified_manually'

export interface ReferralChecklistItem {
  readonly id: string
  readonly label: string
  readonly copyBadge: string
  readonly required: boolean
  readonly checked: boolean
  readonly checkedBy?: string
  readonly checkedAtIso?: string
  readonly exceptionReason?: string
  readonly attachmentRef?: string
}

export interface ExternalReferralState {
  readonly patientId: string
  readonly encounterId: string
  readonly destinationFacility: string
  readonly transportMode: string
  readonly lifecycleStage: ReferralLifecycleStage
  readonly sisruteStatus: SisruteVerificationMode
  readonly sisruteReferenceNo?: string
  readonly items: readonly ReferralChecklistItem[]
  readonly updatedAtIso: string
}

export const DEFAULT_EXTERNAL_REFERRAL_ITEMS: readonly Omit<
  ReferralChecklistItem,
  'checked' | 'checkedBy' | 'checkedAtIso'
>[] = [
  {
    id: 'ref-sisrute-recheck',
    label: 'Cek ulang status Sisrute tepat sebelum berangkat (pastikan sudah diterima & tidak di-cancel)',
    copyBadge: 'SISRUTE',
    required: true,
  },
  {
    id: 'ref-sisrute-proof',
    label: 'Cetakan bukti diterima di Sisrute / cetak chat WA konfirmasi penerimaan',
    copyBadge: '1 Rangkap',
    required: true,
  },
  {
    id: 'ref-intro-letter',
    label: 'Surat Pengantar Rujukan',
    copyBadge: '2 Rangkap',
    required: true,
  },
  {
    id: 'ref-clinical-resume',
    label: 'Resume Klinis Pasien Rujukan',
    copyBadge: '2 Rangkap',
    required: true,
  },
  {
    id: 'ref-discharge-summary',
    label: 'Ringkasan Pasien Pulang',
    copyBadge: '1 Rangkap',
    required: true,
  },
  {
    id: 'ref-external-transfer-form',
    label: 'Formulir Transfer Eksternal (Saat pulang, 1 lembar wajib dibawa balik ke faskes asal setelah diisi SOAP di kotaknya!)',
    copyBadge: '2 Rangkap',
    required: true,
  },
  {
    id: 'ref-serial-ekg',
    label: 'EKG Serial pasien selama dirawat',
    copyBadge: '1 Set',
    required: false,
  },
  {
    id: 'ref-echo-xray',
    label: 'Hasil Echocardiography (bila ada) & Foto Rontgen',
    copyBadge: '1 Set',
    required: false,
  },
  {
    id: 'ref-labs-meds',
    label: 'Hasil Laboratorium lengkap + cetak catatan obat sendiri untuk pegangan saat transfer',
    copyBadge: '1 Set',
    required: true,
  },
]

export function createReferralChecklistState(params: {
  readonly patientId: string
  readonly encounterId: string
  readonly destinationFacility?: string
  readonly nowIso: string
}): ExternalReferralState {
  return {
    patientId: params.patientId,
    encounterId: params.encounterId,
    destinationFacility: params.destinationFacility ?? '',
    transportMode: 'Ambulans Gawat Darurat + Perawat Pendamping',
    lifecycleStage: 'Draft',
    sisruteStatus: 'api_not_configured_manual_required',
    items: DEFAULT_EXTERNAL_REFERRAL_ITEMS.map((item) => ({ ...item, checked: false })),
    updatedAtIso: params.nowIso,
  }
}

export function toggleChecklistItem(
  state: ExternalReferralState,
  itemId: string,
  meta: {
    readonly actorName: string
    readonly nowIso: string
    readonly exceptionReason?: string
    readonly attachmentRef?: string
  },
): ExternalReferralState {
  return {
    ...state,
    updatedAtIso: meta.nowIso,
    items: state.items.map((item) => {
      if (item.id !== itemId) return item
      const nextChecked = !item.checked
      return {
        ...item,
        checked: nextChecked,
        checkedBy: nextChecked ? meta.actorName : undefined,
        checkedAtIso: nextChecked ? meta.nowIso : undefined,
        exceptionReason: meta.exceptionReason ?? item.exceptionReason,
        attachmentRef: meta.attachmentRef ?? item.attachmentRef,
      }
    }),
  }
}

export function updateChecklistItemConfig(
  state: ExternalReferralState,
  itemId: string,
  patch: {
    readonly label?: string
    readonly copyBadge?: string
    readonly required?: boolean
    readonly exceptionReason?: string
  },
  nowIso: string,
): ExternalReferralState {
  return {
    ...state,
    updatedAtIso: nowIso,
    items: state.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
  }
}

export function addChecklistItem(
  state: ExternalReferralState,
  newItem: { readonly label: string; readonly copyBadge: string; readonly required: boolean },
  nowIso: string,
): ExternalReferralState {
  const label = newItem.label.trim()
  if (!label) return state
  return {
    ...state,
    updatedAtIso: nowIso,
    items: [
      ...state.items,
      {
        id: `ref-custom-${state.items.length + 1}`,
        label,
        copyBadge: newItem.copyBadge.trim() || '1 Rangkap',
        required: newItem.required,
        checked: false,
      },
    ],
  }
}

export function resetReferralChecklist(state: ExternalReferralState, nowIso: string): ExternalReferralState {
  return {
    ...state,
    updatedAtIso: nowIso,
    items: state.items.map((item) => ({
      ...item,
      checked: false,
      checkedBy: undefined,
      checkedAtIso: undefined,
      exceptionReason: undefined,
    })),
  }
}

export function computeChecklistProgress(state: ExternalReferralState): {
  readonly done: number
  readonly total: number
  readonly percent: number
  readonly requiredMissingCount: number
  readonly readyForDeparture: boolean
} {
  const total = state.items.length
  const done = state.items.filter((i) => i.checked).length
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  const requiredMissingCount = state.items.filter((i) => i.required && !i.checked && !(i.exceptionReason ?? '').trim()).length
  const sisruteOk = state.sisruteStatus === 'verified_manually'
  return {
    done,
    total,
    percent,
    requiredMissingCount,
    readyForDeparture: requiredMissingCount === 0 && sisruteOk,
  }
}

export function transitionReferralLifecycle(
  state: ExternalReferralState,
  nextStage: ReferralLifecycleStage,
  options: {
    readonly nowIso: string
    readonly manualSisruteConfirmed?: boolean
    readonly sisruteReferenceNo?: string
  },
): { readonly ok: true; readonly state: ExternalReferralState } | { readonly ok: false; readonly reason: string } {
  const sisruteStatus: SisruteVerificationMode = options.manualSisruteConfirmed
    ? 'verified_manually'
    : state.sisruteStatus === 'verified_manually'
      ? 'verified_manually'
      : 'api_not_configured_manual_required'

  if ((nextStage === 'Ready for Transfer' || nextStage === 'In Transit') && sisruteStatus !== 'verified_manually') {
    return {
      ok: false,
      reason: 'Integrasi API SISRUTE live belum aktif: konfirmasi manual penerimaan SISRUTE wajib dicentang sebelum berangkat.',
    }
  }
  const progress = computeChecklistProgress({ ...state, sisruteStatus })
  if ((nextStage === 'Ready for Transfer' || nextStage === 'In Transit') && progress.requiredMissingCount > 0) {
    return {
      ok: false,
      reason: `Masih ada ${progress.requiredMissingCount} berkas wajib rujukan yang belum dicentang atau diberi alasan pengecualian.`,
    }
  }
  return {
    ok: true,
    state: {
      ...state,
      lifecycleStage: nextStage,
      sisruteStatus,
      sisruteReferenceNo: options.sisruteReferenceNo ?? state.sisruteReferenceNo,
      updatedAtIso: options.nowIso,
    },
  }
}

export function buildDischargeResumeDraft(input: {
  readonly patientNameOrCode: string
  readonly primaryDiagnosis: string
  readonly summaryClinicalCourse: string
  readonly dischargeMedications: readonly string[]
  readonly followUpDate?: string
  readonly redFlags: readonly string[]
}): {
  readonly draftOnly: true
  readonly clinically_reviewed: false
  readonly text: string
} {
  return {
    draftOnly: true,
    clinically_reviewed: false,
    text: [
      '=== DRAF RESUME MEDIS / RINGKASAN PULANG (clinically_reviewed = false) ===',
      `Pasien: ${input.patientNameOrCode || 'belum diisi'}`,
      `Diagnosis Kerja / Utama: ${input.primaryDiagnosis || 'belum dikaji'}`,
      `Ringkasan Perawatan: ${input.summaryClinicalCourse || 'belum dikaji'}`,
      `Obat Pulang: ${input.dischargeMedications.length ? input.dischargeMedications.join('; ') : 'belum ada'}`,
      `Tanda Bahaya (segera ke IGD): ${input.redFlags.length ? input.redFlags.join('; ') : 'sesak, nyeri hebat, demam tinggi, penurunan kesadaran'}`,
      `Jadwal Kontrol: ${input.followUpDate || 'belum dijadwalkan (hubungkan via Calendar OS)'}`,
    ].join('\n'),
  }
}

// Definisi siklus hidup hasil lab dan rujukan (data murni di atas mesin generik).
import type { ActorRole, Lifecycle } from './lifecycle.js'

export const RESULT_STATUSES = ['received', 'pending_review', 'reviewed', 'communicated', 'closed'] as const
export type ResultStatus = (typeof RESULT_STATUSES)[number]

// Tinjauan hanya oleh klinisi terotorisasi; komunikasi dan penutupan hanya oleh orang (bukan sistem).
export const resultLifecycle: Lifecycle<ResultStatus> = {
  initial: 'received',
  edges: { received: ['pending_review'], pending_review: ['reviewed'], reviewed: ['communicated'], communicated: ['closed'], closed: [] },
  roles: {
    pending_review: ['lab-staff', 'nurse', 'clinician', 'admin', 'system'],
    reviewed: ['clinician'],
    communicated: ['clinician', 'nurse'],
    closed: ['clinician', 'nurse'],
  },
  needsAuthorizedClinician: ['reviewed'],
}

export const REFERRAL_STATUSES = ['requested', 'accepted', 'scheduled', 'completed', 'result_returned', 'closed', 'declined', 'cancelled'] as const
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number]

// Siklus rujukan terpisah dari hasil: bercabang (tolak/batal) dan berakhir di closed/declined/cancelled.
export const referralLifecycle: Lifecycle<ReferralStatus> = {
  initial: 'requested',
  edges: {
    requested: ['accepted', 'declined', 'cancelled'],
    accepted: ['scheduled', 'cancelled'],
    scheduled: ['completed', 'cancelled'],
    completed: ['result_returned'],
    result_returned: ['closed'],
    closed: [], declined: [], cancelled: [],
  },
  roles: {
    accepted: ['clinician', 'admin'],
    declined: ['clinician', 'admin'],
    scheduled: ['clinician', 'nurse', 'admin'],
    completed: ['clinician'],
    result_returned: ['clinician', 'nurse'],
    closed: ['clinician'],
    cancelled: ['clinician', 'admin'],
  },
  needsAuthorizedClinician: ['completed', 'closed'],
}

/** Peran yang boleh membaca hasil/rujukan bila di tenant yang sama (pasien dinilai terpisah). */
export const STAFF_READ_ROLES: readonly ActorRole[] = ['clinician', 'nurse', 'lab-staff', 'admin']

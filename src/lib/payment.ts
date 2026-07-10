// Single source of truth for the platform's only payment path: manual bank
// transfer to the owner's Mandiri account, verified by photo proof (see
// Billing's ManualBankTransfer + ProofVerification). No QRIS/VA/card gateway
// is wired up — every price shown in the app settles through this account.
export const MANUAL_BANK = {
  bank: 'Bank Mandiri',
  number: '1260007276065',
  holder: 'RIZKY MUHAMMAD AZRIS',
  waNumber: '6282261143040', // E.164 without "+"
  waLabel: '+62 822-6114-3040',
}

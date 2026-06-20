// Midtrans Iris — automatic bank disbursement (payout) for PNC withdrawals.
//
// When IRIS_API_KEY is configured the withdraw endpoint disburses the rupiah
// equivalent straight to the user's bank account. Without a key it runs in
// "manual" mode: the balance is still deducted and the request is logged for
// the owner to settle by hand — so the product works either way.
import { config } from './config.js'

const IS_PROD = process.env.IRIS_IS_PRODUCTION === 'true'
const BASE = IS_PROD
  ? 'https://app.midtrans.com/iris/api/v1'
  : 'https://app.sandbox.midtrans.com/iris/api/v1'

// Iris (creator) API key — used as Basic-auth username, blank password.
const CREATOR_KEY = process.env.IRIS_API_KEY || process.env.IRIS_CREATOR_KEY || ''
// Optional approver key, only needed when the account requires a 2nd approval.
const APPROVER_KEY = process.env.IRIS_APPROVER_KEY || ''

export const irisLive = Boolean(CREATOR_KEY)

// Map common Indonesian bank display names to Iris bank codes.
const BANK_CODES: Record<string, string> = {
  mandiri: 'mandiri', bca: 'bca', bni: 'bni', bri: 'bri', btn: 'btn',
  cimb: 'cimb', 'cimb niaga': 'cimb', permata: 'permata', danamon: 'danamon',
  bsi: 'bsi', 'bank syariah indonesia': 'bsi', mega: 'mega', panin: 'panin',
  ocbc: 'ocbc', 'ocbc nisp': 'ocbc', maybank: 'maybank', sinarmas: 'sinarmas',
  jago: 'bank_jago', 'bank jago': 'bank_jago', seabank: 'seabank',
  gopay: 'gopay', ovo: 'ovo', dana: 'dana', shopeepay: 'shopeepay',
}

export function bankCode(name: string): string {
  const k = name.trim().toLowerCase()
  return BANK_CODES[k] || k.replace(/\s+/g, '_')
}

function authHeader(key: string): string {
  return 'Basic ' + Buffer.from(key + ':').toString('base64')
}

export interface PayoutResult {
  live: boolean
  status: 'queued' | 'processed' | 'manual'
  referenceNo?: string
  detail?: string
}

// Disburse `amountIdr` to a bank account. Returns a result describing whether it
// went out automatically (Iris) or was queued for manual settlement.
export async function disburse(args: {
  amountIdr: number
  bank: string
  accountNumber: string
  accountHolder: string
  email: string
}): Promise<PayoutResult> {
  if (!irisLive) {
    return { live: false, status: 'manual', detail: 'Iris belum dikonfigurasi — penarikan diproses manual oleh tim.' }
  }
  // 1) Create the payout request.
  const createRes = await fetch(`${BASE}/payouts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Accept: 'application/json', Authorization: authHeader(CREATOR_KEY) },
    body: JSON.stringify({
      payouts: [
        {
          beneficiary_name: args.accountHolder,
          beneficiary_account: args.accountNumber,
          beneficiary_bank: bankCode(args.bank),
          beneficiary_email: args.email,
          amount: String(Math.round(args.amountIdr)),
          notes: 'Penarikan saldo Panaceamed',
        },
      ],
    }),
  })
  const createData = (await createRes.json().catch(() => ({}))) as any
  if (!createRes.ok) {
    throw new Error(`iris_create_${createRes.status}:${JSON.stringify(createData).slice(0, 200)}`)
  }
  const ref: string | undefined = createData?.payouts?.[0]?.reference_no
  if (!ref) throw new Error('iris_no_reference')

  // 2) Approve it (required before funds move). Uses the approver key when set,
  // otherwise the creator key for accounts with auto/self-approval.
  const approveRes = await fetch(`${BASE}/payouts/approve`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Accept: 'application/json', Authorization: authHeader(APPROVER_KEY || CREATOR_KEY) },
    body: JSON.stringify({ reference_nos: [ref], otp: '' }),
  })
  if (!approveRes.ok) {
    // Created but not yet approved — still leaves the platform; flag as queued.
    return { live: true, status: 'queued', referenceNo: ref, detail: 'Payout dibuat, menunggu persetujuan.' }
  }
  return { live: true, status: 'processed', referenceNo: ref }
}

// Account-level Iris balance (handy for the owner dashboard / preflight checks).
export async function irisBalance(): Promise<number | null> {
  if (!irisLive) return null
  try {
    const r = await fetch(`${BASE}/balance`, { headers: { Authorization: authHeader(CREATOR_KEY), Accept: 'application/json' } })
    const d = (await r.json()) as any
    return r.ok ? Number(d.balance) : null
  } catch {
    return null
  }
}

void config

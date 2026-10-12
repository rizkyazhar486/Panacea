// Identitas untuk baris log. Surel adalah data pribadi dan tidak boleh masuk log; support tetap perlu mengaitkan beberapa baris
// milik akun yang sama, jadi surel diganti penanda tak-bermakna yang stabil (HMAC dengan rahasia server, tidak dapat dibalik).
// Murni: tanpa DOM/jaringan; rahasia disuntikkan.
import { createHmac } from 'node:crypto'

export function penandaLog(rahasia: string, email: string): string {
  return 'u:' + createHmac('sha256', rahasia).update(`log\n${email.trim().toLowerCase()}`).digest('hex').slice(0, 10)
}

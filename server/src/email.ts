import { config } from './config.js'

// Transactional email via Resend (https://resend.com) — fetch-based, no extra
// dependency. No-ops unless RESEND_API_KEY is set, so the app runs without it.
const RESEND_URL = 'https://api.resend.com/emails'

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key || !to) return false
  try {
    const r = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: config.emailFrom, to, subject, html }),
    })
    return r.ok
  } catch {
    return false
  }
}

function shell(title: string, inner: string): string {
  return `<div style="font-family:'Segoe UI',Roboto,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0c1410">
    <div style="font-weight:800;font-size:20px;color:#0b7a4b">Panacea<span style="color:#00BF63">med</span><span style="color:#FF3131">.id</span></div>
    <h1 style="font-size:20px;margin:18px 0 8px">${title}</h1>
    ${inner}
    <hr style="border:none;border-top:1px solid #e6ece8;margin:22px 0"/>
    <p style="font-size:11px;color:#869586">⚕️ AI mendukung, bukan menggantikan, klinisi berlisensi. Data Anda dilindungi sesuai UU PDP.</p>
  </div>`
}

export function sendWelcome(to: string, name: string, role: string) {
  return sendEmail(
    to,
    'Selamat datang di Panaceamed.id',
    shell(
      `Halo, ${name} 👋`,
      `<p style="font-size:14px;line-height:1.6;color:#3c4a3e">Akun Anda sebagai <b>${role}</b> telah aktif. Anda kini dapat memakai AI co-physician, edukasi kesehatan, konsultasi, apotek, dan pemantauan longevity — semuanya diverifikasi klinisi berlisensi.</p>
       <p style="font-size:14px;line-height:1.6;color:#3c4a3e">Mulai dari dashboard Anda dan jaga healthspan Anda hari ini.</p>`,
    ),
  )
}

export function sendOtpCode(to: string, code: string) {
  return sendEmail(
    to,
    `Kode masuk Panaceamed.id: ${code}`,
    shell(
      'Kode verifikasi masuk',
      `<p style="font-size:14px;line-height:1.6;color:#3c4a3e">Gunakan kode berikut untuk masuk. Berlaku 10 menit dan jangan dibagikan ke siapa pun.</p>
       <div style="font-size:34px;font-weight:800;letter-spacing:8px;color:#0b7a4b;text-align:center;background:#e6f9ef;border-radius:12px;padding:16px;margin:14px 0">${code}</div>
       <p style="font-size:12px;color:#869586">Jika Anda tidak meminta kode ini, abaikan email ini.</p>`,
    ),
  )
}

export function sendReceipt(to: string, name: string, pnc: number, idr: number, method: string) {
  return sendEmail(
    to,
    `Struk Pembayaran — ${pnc} PanaceaToken`,
    shell(
      'Pembayaran berhasil ✅',
      `<p style="font-size:14px;line-height:1.6;color:#3c4a3e">Halo ${name}, top-up Anda berhasil diproses.</p>
       <table style="font-size:14px;width:100%;border-collapse:collapse">
         <tr><td style="padding:6px 0;color:#869586">Jumlah</td><td style="text-align:right;font-weight:700">${pnc} PNC</td></tr>
         <tr><td style="padding:6px 0;color:#869586">Nilai</td><td style="text-align:right;font-weight:700">Rp${idr.toLocaleString('id-ID')}</td></tr>
         <tr><td style="padding:6px 0;color:#869586">Metode</td><td style="text-align:right;font-weight:700">${method}</td></tr>
       </table>`,
    ),
  )
}

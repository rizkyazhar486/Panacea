import 'dotenv/config'

export const config = {
  port: Number(process.env.PORT) || 8787,
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-secret',
  ownerEmail: (process.env.OWNER_EMAIL || 'rizkyazhar486@gmail.com').toLowerCase(),
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  midtrans: {
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  },
  tokenToIdr: Number(process.env.TOKEN_TO_IDR) || 1000,
  aiConsultPnc: Number(process.env.AI_CONSULT_PNC) || 25,
  creatorSubPnc: Number(process.env.CREATOR_SUB_PNC) || 100, // monthly creator subscription
  creatorSubAdminPnc: Number(process.env.CREATOR_SUB_ADMIN_PNC) || 25, // platform cut
  vapid: {
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
    subject: process.env.VAPID_SUBJECT || 'mailto:admin@panaceamed.id',
  },
  emailFrom: process.env.EMAIL_FROM || 'Panaceamed.id <onboarding@resend.dev>',
}

// Feature is "live" only when its credentials are present; otherwise mock mode.
export const features = {
  googleLive: Boolean(config.googleClientId),
  paymentsLive: Boolean(config.midtrans.serverKey),
  aiLive: Boolean(process.env.ANTHROPIC_API_KEY || process.env.OPENROUTER_API_KEY),
  pushLive: Boolean(config.vapid.publicKey && config.vapid.privateKey),
  emailLive: Boolean(process.env.RESEND_API_KEY),
  payoutLive: Boolean(process.env.IRIS_API_KEY || process.env.IRIS_CREATOR_KEY),
  otpLive: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID),
}

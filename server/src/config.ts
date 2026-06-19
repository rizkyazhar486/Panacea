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
}

// Feature is "live" only when its credentials are present; otherwise mock mode.
export const features = {
  googleLive: Boolean(config.googleClientId),
  paymentsLive: Boolean(config.midtrans.serverKey),
  aiLive: Boolean(process.env.ANTHROPIC_API_KEY),
}

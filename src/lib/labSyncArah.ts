// Keputusan sinkronisasi lab, terpisah agar dapat diuji tanpa lingkungan Vite.
/** Keputusan murni: tarik, dorong, atau diam. */
export function arahSinkron(capLokal: string | null, capServer: string | null, adaIsiLokal: boolean): 'tarik' | 'dorong' | 'diam' {
  if (!capServer) return adaIsiLokal ? 'dorong' : 'diam'
  if (!capLokal) return 'tarik'
  const l = Date.parse(capLokal), s = Date.parse(capServer)
  return s > l ? 'tarik' : l > s ? 'dorong' : 'diam'
}


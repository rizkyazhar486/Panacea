// DIHASILKAN OLEH scripts/gen-bundle-digests.mjs — jangan disunting tangan.
//
// Sidik jari bundel geometri yang benar-benar dikirim. Dipakai supaya klaim
// provenans bisa diperiksa terhadap bit, bukan hanya terhadap niat.
//
// Perbarui dengan: node scripts/gen-bundle-digests.mjs --write

export interface SidikJariBundel {
  file: string
  bytes: number
  sha256: string
  /** Jumlah simpul di chunk JSON glTF, atau null bila tidak terbaca. */
  nodes: number | null
}

export const SIDIK_JARI_BUNDEL: readonly SidikJariBundel[] = [
  { file: 'cardiovascular.glb', bytes: 12344948, sha256: '7656915445e555d3a47a3d7fdbe7186b93ecc5774c944d79f10ddcf67f4accf2', nodes: 920 },
  { file: 'lymphoid.glb', bytes: 652008, sha256: '450ef35d72ee6bfa8781ca1f930b25f816693326a66ebff2c8bc0e742918ee2a', nodes: 169 },
  { file: 'muscular.glb', bytes: 5636668, sha256: '2b1caca412726894decbaf07f34cb7838fcd1edfe8922053348497ab11468f1d', nodes: 523 },
  { file: 'nervous.glb', bytes: 7785940, sha256: '2e82e4024d89f3ed32ad7431333ca01796aceb24d90aeb71237fd6f6f239636e', nodes: 677 },
  { file: 'skeletal.glb', bytes: 2653500, sha256: 'cd81466d30e9ec283bcc4f55db1953291fe4f1d40f73a0bfe5f6be205ae98413', nodes: 282 },
  { file: 'surface.glb', bytes: 998480, sha256: 'f1e2db4ff3082199ae758cbe151ea4964754633f32c8ad7e327c03dafbf4352b', nodes: 290 },
  { file: 'visceral.glb', bytes: 3682364, sha256: 'd9507e6d1596d37fb018202a9efb6e8914bde2a568ff7981f8d5443b96106ba7', nodes: 431 },
]

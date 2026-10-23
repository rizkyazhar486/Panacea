// Menulis build.json di hasil build: commit sumber bundel ini, agar verifikasi deploy (E7) bisa membandingkannya dengan main.
// Hanya SHA 40 heksadesimal yang diterima; selain itu null ("tidak diketahui", bukan karangan).
export function commitDariEnv(env) {
  for (const k of ['VERCEL_GIT_COMMIT_SHA', 'GITHUB_SHA']) {
    const v = env[k]
    if (typeof v === 'string' && /^[0-9a-f]{40}$/i.test(v.trim())) return v.trim().toLowerCase()
  }
  return null
}

export function buildMarker(env = process.env) {
  return {
    name: 'panacea-build-marker',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'build.json', source: `${JSON.stringify({ commit: commitDariEnv(env) })}\n` })
    },
  }
}

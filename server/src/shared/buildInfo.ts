// Menautkan proses yang berjalan ke commit sumbernya, supaya smoke pasca-deploy
// dapat membuktikan "versi yang diharapkan sedang melayani", bukan sekadar "hidup".
// Fail closed: nilai yang bukan SHA git valid dilaporkan null (tidak diketahui), tidak ditebak.
const SHA = /^[0-9a-f]{40}$/

export function readBuildCommit(env: Record<string, string | undefined>): string | null {
  const raw = env.RENDER_GIT_COMMIT?.trim().toLowerCase()
  return raw && SHA.test(raw) ? raw : null
}

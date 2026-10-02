// PreToolUse hook (Bash): tegakkan CLAUDE.md §5 — tanpa commit/push langsung ke main dan tanpa force-push.
// Exit 2 = blokir; pesan stderr dibaca agent. Uji: scripts/qa/blokir-main-hook.test.mjs
import { execSync } from 'node:child_process';

// Buang heredoc & isi kutipan agar teks pesan commit/PR tidak dianggap perintah, lalu periksa per pernyataan.
function pernyataan(cmd) {
  return cmd
    .replace(/<<-?\s*['"]?(\w+)['"]?[\s\S]*?\n\s*\1\b/g, ' ')
    .replace(/"(?:[^"\\]|\\.)*"|'[^']*'/g, '""')
    .split(/&&|\|\||;|\n|\|/)
    .map((x) => x.trim().replace(/\s+/g, ' '));
}

export function periksa(cmd, cabang) {
  const diMain = /^(main|master)$/.test(cabang);
  for (const c of pernyataan(cmd)) {
    if (/^git (?:-\S+ )*commit\b/.test(c) && diMain)
      return 'Dilarang commit di main. Buat branch: git switch -c feat/<scope>-<deskripsi> (CLAUDE.md §5).';
    if (/^git (?:-\S+ )*push\b/.test(c)) {
      if (/(\s|^)(--force\S*|-f)(\s|$)/.test(c)) return 'Dilarang force-push (CLAUDE.md §5).';
      if (/(\s|:)(main|master)(\s|$)/.test(c)) return 'Dilarang push ke main. Push branch fitur lalu buka PR (CLAUDE.md §5–§6).';
      if (diMain && !/push \S+ \S+/.test(c)) return 'Sedang di main: push ditolak. Pindah ke branch fitur.';
    }
  }
  return null;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let raw = '';
  for await (const d of process.stdin) raw += d;
  let cmd = '';
  try { cmd = JSON.parse(raw).tool_input?.command ?? ''; } catch { process.exit(0); }
  let cabang = '';
  try { cabang = execSync('git branch --show-current', { encoding: 'utf8' }).trim(); } catch {}
  const alasan = periksa(cmd, cabang);
  if (alasan) { console.error(alasan); process.exit(2); }
}

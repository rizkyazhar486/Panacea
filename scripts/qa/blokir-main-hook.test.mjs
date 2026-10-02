import test from 'node:test'; import assert from 'node:assert/strict';
import { periksa } from '../hooks/blokir-main.mjs';

// positif: alur sah lolos
test('positif: commit di branch fitur diizinkan', () => assert.equal(periksa('git commit -m x', 'feat/a-b'), null));
test('positif: push branch fitur diizinkan', () => assert.equal(periksa('git push -u origin HEAD', 'feat/a-b'), null));
test('positif: push origin feat/x diizinkan walau berisi kata main di nama lain', () => assert.equal(periksa('git push origin feat/main-menu', 'feat/main-menu'), null));
test('positif: perintah non-git diabaikan', () => assert.equal(periksa('npm run build', 'main'), null));
// negatif: pelanggaran ditolak
test('negatif: commit di main ditolak', () => assert.match(periksa('git commit -m x', 'main'), /commit di main/));
test('negatif: push ke main eksplisit ditolak', () => assert.match(periksa('git push origin main', 'feat/a'), /push ke main/));
test('negatif: push HEAD:main ditolak', () => assert.match(periksa('git push origin HEAD:main', 'feat/a'), /push ke main/));
test('negatif: force-push ditolak', () => assert.match(periksa('git push --force origin feat/a', 'feat/a'), /force-push/));
test('negatif: -f ditolak', () => assert.match(periksa('git push -f', 'feat/a'), /force-push/));
test('negatif: push polos saat di main ditolak', () => assert.match(periksa('git push', 'main'), /main/));
// false positive: teks di pesan/heredoc bukan perintah
test('positif: teks perintah terlarang di dalam pesan commit tidak memblokir', () =>
  assert.equal(periksa('git commit -m "docs: jangan git push origin main"', 'feat/a'), null));
test('positif: heredoc body PR yang menyebut push ke main tidak memblokir', () =>
  assert.equal(periksa("gh pr create --base main --body \"$(cat <<'EOF'\nDilarang git push origin main\nEOF\n)\"", 'feat/a'), null));
test('negatif: pelanggaran di tengah rantai && tetap ditolak', () =>
  assert.match(periksa('npm test && git push origin main', 'feat/a'), /push ke main/));
// batas: pasangan (hanya beda pada kondisi yang diuji)
test('batas: commit identik lolos di branch lain, ditolak di main', () => {
  assert.equal(periksa('git commit -m x', 'chore/z'), null);
  assert.notEqual(periksa('git commit -m x', 'main'), null);
});

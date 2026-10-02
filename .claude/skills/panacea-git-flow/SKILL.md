---
name: panacea-git-flow
description: Use for ANY git work in Panacea — starting a feature/fix, creating a branch, committing, pushing, opening or updating a pull request, or preparing a change for merge. Enforces branch naming, Conventional Commits, rebase, local gates and the PR template. Never commit or push directly to main.
---

# Panacea git flow (aturan: CLAUDE.md §4–§6)

Jalankan berurutan. Berhenti dan lapor bila ada langkah gagal; jangan melewati gate.

## 1. Mulai
```bash
git switch main && git pull --ff-only
gh pr list --state open --search "<area/berkas yang akan disentuh>"   # cek tumpang tindih
git switch -c <tipe>/<scope>-<deskripsi-kebab>                        # ≤50 char
```
Tipe: `feat fix refactor test docs chore hotfix`. Satu branch = satu tujuan logis. Jangan pakai prefix lama (`chatgpt/ codex/ claude/ panacea-maturity/`).

## 2. Kerja & commit
- Commit kecil, koheren, bisa dibangun. Format: `tipe(scope): ringkasan imperatif`; badan menjelaskan *kenapa* dan deviasi dari arahan lama.
- Akhiri dengan baris atribusi yang diberikan harness (Co-Authored-By).
- Kode baru → ikuti skill `panacea-architecture`; logika baru → skill `panacea-testing`.

## 3. Sebelum push (semua wajib hijau)
```bash
git fetch origin && git rebase origin/main     # hanya branch sendiri
npm run lint:arsitektur                        # bila skrip ada
npm run build && npm run uji
(cd server && npm run typecheck)               # bila menyentuh server/
```
Gate merah = perbaiki akar masalah. Dilarang melemahkan/skip tes, gate akademik, cek biomedis, atau kontrol keamanan.

## 4. Push & PR
```bash
git push -u origin HEAD
gh pr create --base main --title "<tipe(scope): ringkasan>" --body-file <berkas>
```
Isi PR (akhiri dengan `🤖 Generated with [Claude Code](https://claude.com/claude-code)`):

```markdown
## Ringkasan
<1–3 kalimat: apa & kenapa>

## Perubahan
- …

## Validasi
- [ ] `npm run build` hijau
- [ ] `npm run uji` hijau
- [ ] Uji baru/diperbarui: <path> (positif + negatif + batas)
- [ ] Server typecheck (bila menyentuh `server/`)
- [ ] Smoke UI/mobile 390×844 (bila menyentuh UI/3D)

## Risiko & batas
<keselamatan/privasi/provenance/klinis; deviasi dari arahan lama>

## Catatan reviewer
<hal penting; tumpang tindih PR lain>
```

## 5. Setelah PR dibuka
`gh pr checks <nomor>` — laporkan SHA/nomor PR, hasil uji, status CI, blocker. **Jangan merge sendiri** kecuali pemilik memintanya secara eksplisit. Jika main maju: rebase branch sendiri, jangan menimpa pekerjaan yang sudah masuk.

## Terlarang
Commit/push langsung ke `main`, force-push, rewrite riwayat bersama, mencampur fitur + refactor besar + format ulang dalam satu PR. (Hook `scripts/hooks/blokir-main.mjs` memblokir sebagian; jangan mencari celahnya.)

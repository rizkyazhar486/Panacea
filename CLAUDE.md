# Panaceamed.id — Standar Proyek untuk AI Agent (v2)

Dokumen ini adalah **kontrak kerja singkat** untuk setiap model/agent AI yang mengembangkan Panacea. Baca seluruhnya sebelum mengubah kode. **North star produk yang tidak berubah:** [`PANACEA_ONE_OS_LONGITUDINAL_CARE_DOCTRINE.md`](PANACEA_ONE_OS_LONGITUDINAL_CARE_DOCTRINE.md) — satu patient identity/state longitudinal yang sederhana, terpadu, provenance-aware dan dipercaya lintas daily life, poli, ward, OR, ICU, serta follow-up. Aturan di sini bersifat wajib; jika ada konflik, urutan otoritas:

1. Instruksi eksplisit terbaru dari pemilik repo.
2. Batas keselamatan/keamanan/privasi/provenance di §8 (tidak boleh dilemahkan).
3. Dokumen ini → `AGENTS.md` → dokumen doktrin di §10.
4. Rencana/rekomendasi agent lama.

> Catatan migrasi: CLAUDE.md versi lama (1000+ baris, ledger arahan pemilik) dipindahkan utuh ke [`PANACEA_OWNER_DIRECTIVES.md`](PANACEA_OWNER_DIRECTIVES.md). Isinya tetap berlaku sebagai arahan produk/domain, **kecuali** aturan shipping "direct-to-main" yang kini digantikan oleh §5–§6 di bawah.

---

## 1. Gambaran proyek

Panaceamed adalah platform kesehatan berbasis **satu model manusia longitudinal** (Computational Human Platform): AI-EMR, Clinical, Your Body, Body Exposure (proyektor simulasi 3D), sport/performance, dan Visit OS berbagi kontrak & state yang sama — bukan kumpulan halaman terpisah.

| Bagian | Stack |
|---|---|
| Frontend | React + TypeScript + Vite (`src/`) |
| Backend | Node + TypeScript (`server/`, dijalankan `tsx`) |
| Deploy | Vercel (frontend), Render (`render.yaml`, server) |
| CI | GitHub Actions (`.github/workflows/`) |

Bahasa: **UI berbahasa Inggris dulu** lalu diterjemahkan (`src/locales`). Komentar kode boleh Bahasa Indonesia (konvensi repo). Identifier/route key/storage key adalah data, bukan teks UI.

---

## 2. Arsitektur — Clean Architecture

### 2.1 Aturan ketergantungan (satu arah, ke dalam)

```
pages/  →  components/  →  lib/ (logika murni)  →  data/ (konstanta, korpus)
   ↓
 lib/api.ts (satu-satunya pintu HTTP)  →  server/src (routes → service → store)
```

- **Dalam tidak boleh mengimpor luar.** `lib/` tidak boleh impor `components/` atau `pages/`. `data/` tidak boleh impor apa pun dari `lib/` yang berefek samping.
- **`lib/` = domain + use-case, murni & deterministik**: tanpa React, tanpa DOM, tanpa `fetch` langsung, tanpa `Date.now()`/`Math.random()` tersembunyi (injeksikan `now`/seed sebagai parameter). Ini yang membuatnya bisa diuji offline.
- **`components/` = presentasi**. Tidak berisi rumus, aturan klinis, atau parsing. Hanya memanggil `lib/` lalu merender.
- **`pages/` = komposisi** (routing, lazy-load, menggabungkan komponen). Tanpa logika domain.
- **Server**: `routes/handler` (validasi input + auth) → `service` (aturan bisnis) → `store/adapter` (DB, FHIR, API eksternal). Handler tidak berisi bisnis; service tidak tahu HTTP.

### 2.2 Struktur tree kanonik (target)

Struktur dikelompokkan **per bounded context (domain)**, bukan per jenis file. Di dalam tiap domain, layer dipisah. Kondisi saat ini: `src/lib` datar (~513 berkas + 15 subfolder) — arah migrasinya di §2.4.

```
Panacea/
├─ src/
│  ├─ app/                      # composition root: main.tsx, router, providers, lazy-route map
│  ├─ shared/                   # lintas-domain, TANPA logika domain
│  │  ├─ ui/                    # primitif UI reusable (Button, Disclosure, Chart, Sheet)
│  │  ├─ hooks/                 # hook generik (useMedia, useDebounce)
│  │  ├─ kernel/                # tipe inti: TruthClass, Provenance, Unit, Result, Clock
│  │  ├─ styles/                # token & tema
│  │  └─ i18n/                  # locales EN-sumber
│  ├─ domains/                  # satu folder = satu bounded context
│  │  ├─ physiology/
│  │  │  ├─ model/              # ENTITAS/tipe + invariants (murni)
│  │  │  ├─ engine/             # USE-CASE/rumus/simulasi (murni, deterministik)
│  │  │  ├─ data/               # konstanta, korpus, registry statis
│  │  │  ├─ adapters/           # boundary: API/sensor/device → model (satu-satunya tempat I/O)
│  │  │  ├─ ui/                 # komponen khusus domain (presentasi)
│  │  │  └─ index.ts            # PUBLIC API domain (satu-satunya pintu impor dari luar)
│  │  ├─ anatomy/  emr/  clinical/  body-exposure/  sport/  visit/  devices/  environment/  ...
│  ├─ features/                 # komposisi lintas-domain per skenario pengguna (opsional, tipis)
│  └─ pages/                    # layar/super-page: merangkai features + domains, tanpa logika
├─ server/src/
│  ├─ app/                      # bootstrap, wiring DI, middleware, config
│  ├─ shared/                   # auth, audit, error, logger, kernel tipe
│  └─ modules/<domain>/         # satu modul per bounded context
│     ├─ http/                  # routes + validasi input (zod/skema) + mapping DTO
│     ├─ service/               # use-case / aturan bisnis (tanpa HTTP, tanpa SQL)
│     ├─ domain/                # entitas + kebijakan murni
│     ├─ repo/                  # port (interface) + implementasi DB/FHIR/vendor
│     └─ index.ts
├─ scripts/  uji/ qa/ bangun/   # uji deterministik, smoke, pembangun aset
├─ governance/  DOCS/  docs/    # registry, ADR, desain
└─ .github/workflows/
```

**Aturan dependensi (ditegakkan mesin, bukan niat baik):**

```
pages → features → domains/* (via index.ts) → shared
                    domains/A  ✗→  domains/B/internal   (hanya lewat index.ts B, dan hanya bila ada alasan tertulis)
model ← engine ← adapters ← ui        (panah = "boleh mengimpor"; model tidak tahu siapa pun)
```

- `model` & `engine`: tanpa React/DOM/fetch/`Date.now()`/`Math.random()` (injeksi `clock`/`rng`).
- I/O hanya di `adapters/` (frontend) dan `repo/` (server).
- Antar-domain berkomunikasi lewat **kontrak tipe di `shared/kernel`** atau public API `index.ts`, bukan mengimpor internal.
- Data sumber statis besar (mis. korpus catatan penyakit puluhan ribu baris) hidup di `data/` dan **di-`import()` dinamis**, tidak masuk bundle awal.

### 2.3 Penegakan otomatis (wajib ditambahkan)

Aturan yang hanya ada di dokumen akan luntur. Tegakkan di CI:
1. **Boundary lint** (`dependency-cruiser` atau `eslint-plugin-boundaries`) yang menggagalkan build bila `lib/model/engine` mengimpor `components/pages`, atau domain mengimpor internal domain lain.
2. **Path alias** di `tsconfig.json`/`vite.config.ts`: `@shared/*`, `@domains/*`, `@app/*` — hapus impor `../../..`.
3. **Uji kemurnian**: skrip `scripts/qa` yang gagal bila `engine/`/`model/` memuat `fetch(`, `Date.now(`, `Math.random(`, `document.`, `window.`.
4. **Ratchet**: pelanggaran yang sudah ada dicatat di baseline; CI hanya menolak pelanggaran **baru** dan jumlah baseline harus turun, tidak naik.

### 2.4 Prinsip desain inti & jalur migrasi

- **Satu sumber kebenaran per konsep** (state pasien, konstanta fisiologi, renderer 3D, registry). Sebelum membuat sesuatu, **cari yang sudah ada** (`git grep`, lihat `src/lib`). Perluas atau komposisikan; jangan buat versi kedua.
- **Kontrak dulu, implementasi kemudian**: definisikan tipe/interface stabil di `lib/`, lalu adapter untuk sumber eksternal (wearable, device, API) di *boundary*. Data eksternal divalidasi & dinormalisasi di boundary, tidak menyebar mentah ke UI.
- **Kedalaman > kebanyakan halaman.** Fitur baru butuh: pengguna bernama, masalah nyata, cara mengukur manfaat, dan alasan tidak bisa ditangani kapabilitas yang ada. Halaman sekunder dikelompokkan/disembunyikan, bukan dihapus.
- **Fail closed**: data/provenance/unit hilang → tampilkan batas "tidak diketahui", jangan diisi tebakan.

**Jalur migrasi (strangler, bukan big-bang):** dilarang memindahkan ratusan berkas dalam satu PR.
1. **Aturan baru:** semua kode baru langsung ditulis di struktur §2.2; folder `src/lib` datar dibekukan (hanya perbaikan bug, tidak ada berkas baru).
2. **Pindah saat menyentuh:** ketika berkas lama diubah substansial, pindahkan ke domainnya dalam PR terpisah bertipe `refactor/` (perilaku tidak berubah), tinggalkan re-export tipis di lokasi lama sampai semua pemanggil dimigrasi, lalu hapus.
3. **Urutan domain:** mulai dari yang sudah punya subfolder (`physiology`, `anatomy`, `multiskala`, `ecmo`, `bodyExposure`), lalu domain dengan kopling terendah.
4. **Server:** pecah `server/src/*.ts` datar (60 berkas) menjadi `modules/<domain>/` dengan cara sama; mulai dari `visits`/`visitRealtimePolicy`/`realtime*` (sudah punya batas keamanan jelas).
5. Setiap PR migrasi wajib: `build` + `uji` hijau, tanpa perubahan perilaku, tanpa perubahan uji kecuali path impor.

---

## 3. Kode efisien, tidak redundan, komponen reusable

**Sebelum menulis:** (1) apakah perlu ada? (2) sudah ada di repo? (3) stdlib/platform native? (4) dependency terpasang? Baru tulis kode minimum.

Wajib:
- **DRY nyata**: logika/konstanta yang muncul ≥2 kali dipindah ke `lib/` (satu fungsi, satu konstanta). Jangan menyalin rumus/angka klinis — impor dari registry kanonik (mis. `oxygenContentConventions.ts`).
- **Tanpa abstraksi spekulatif**: tidak ada interface dengan satu implementasi, factory untuk satu produk, atau config untuk nilai yang tak pernah berubah. Ekstrak setelah pemakaian kedua, bukan sebelum.
- **Komponen reusable**: komponen kecil, satu tanggung jawab, props bertipe, komposisi > prop-drilling/flag boolean bertumpuk. Pola berulang di ≥2 tempat → jadi komponen/hook di `components/`. State lokal tetap lokal; angkat hanya bila dibagi.
- **Performa**: engine 3D/berat di-`lazy`-load; memo hanya bila terukur perlu; hindari re-render/hitung ulang di jalur panas; muat data progresif; jaga mobile 390×844 dan fallback WebGL.
- **TypeScript ketat**: tanpa `any` baru, tanpa `@ts-ignore` tanpa alasan tertulis; gunakan union/branded type untuk unit dan truth class (measured/derived/simulated).
- **Hapus, jangan tambah**: kode mati, duplikat, dan wrapper tak berguna dihapus **hanya bila kapabilitas terjaga** atau digantikan implementasi lebih baik.
- Komentar menjelaskan *kenapa* (batasan, sumber, formula), bukan *apa*. Ikuti gaya berkas sekitar.
- Logika non-trivial (cabang, loop, parser, jalur klinis/uang/keamanan) wajib disertai uji **positif dan negatif** sesuai §3.1.

### 3.1 Standar unit test (ketat: positif + negatif wajib)

Runner: `node --test` (`scripts/qa/*.test.mjs`) atau skrip deterministik `scripts/uji/*.mts`; server di `server/uji/`. Tanpa jaringan, tanpa waktu/acak nyata (injeksikan `clock`/`rng`), tanpa urutan antar-tes.

**Kewajiban per unit (fungsi/engine/komponen/handler) yang ditambah atau diubah:**

| Kategori | Wajib ada | Contoh |
|---|---|---|
| **Positif** (happy path) | ≥1 kasus input valid → hasil persis yang diharapkan | `CO = HR×SV` dari HR/EDV/ESV valid |
| **Negatif** (invalid) | ≥1 kasus per aturan validasi: input salah tipe, kosong, `NaN`/`Infinity`, di luar rentang, unit tidak cocok, provenance hilang → **ditolak/fail-closed dengan error/hasil eksplisit**, bukan nilai tebakan | Hb negatif → error; unit salah → ditolak |
| **Batas** (boundary) | nilai tepat di batas bawah/atas, ±1 langkah di luar batas | ambang fresh/delayed/stale 30 s / 120 s |
| **Keamanan/otorisasi** (bila relevan) | akses tanpa identitas, role salah, replay, payload berlebih → ditolak | sinyal Visit dari non-anggota |
| **Regresi** | setiap bug yang diperbaiki mendapat tes yang gagal sebelum perbaikan | — |

**Aturan mutu:**
1. **Tes negatif tidak boleh sekadar "tidak melempar error".** Assert jenis penolakan (kode/pesan/`ok:false`) dan bahwa **tidak ada efek samping** (state tidak berubah, tidak ada data tertulis).
2. **Assert nilai eksak** (atau toleransi numerik yang dinyatakan) — bukan `toBeTruthy`/"tidak undefined". Rumus klinis/fisiologi diuji dengan **nilai referensi berbunyi sumber** (golden case) dan propagasi ketidakpastian bila ada.
3. **Tes berpasangan**: setiap aturan penolakan punya kasus penerima yang *hanya berbeda pada kondisi itu* (membuktikan aturan itu yang menolak, bukan hal lain).
4. **Determinisme**: dua kali jalan → hasil identik; tanpa `Date.now()`/`Math.random()`/jaringan; fixture di dalam repo.
5. **Satu perilaku per tes**, nama deskriptif: `menolak_hb_negatif`, `menerima_ef_pada_batas_atas`. Tidak ada tes yang di-skip/`.only` yang tertinggal; tidak ada `catch` yang menelan assertion.
6. **Dilarang melemahkan tes** (menghapus assert, melonggarkan toleransi, men-skip) agar hijau. Perubahan ekspektasi harus dijelaskan di PR.
7. **Komponen UI**: uji state loading, error, kosong, dan data; tombol tidak bisa dobel-submit; input tidak valid menampilkan pesan dan tidak memanggil handler.
8. **Kode klinis/keamanan/privasi**: cakupan cabang penuh untuk jalur keputusan (setiap `if`/`switch` punya kasus positif *dan* negatif); jalur fail-closed wajib diuji secara eksplisit.
9. **Mock hanya di boundary** (adapter/repo). Logika murni diuji tanpa mock.
10. Modul baru di `lib`/`domains/*/engine` tanpa berkas uji = PR ditolak.

Prosedur, matriks kasus, dan kerangka kode ada di skill **`panacea-testing`**.

---

## 4. Konvensi penamaan & commit

- File `lib`: `camelCase.ts`; komponen: `PascalCase.tsx`; uji: `nama-modul.test.mjs` / `nama-modul.mts`.
- Commit **Conventional Commits**: `feat(scope): …`, `fix(scope): …`, `test(scope): …`, `refactor(scope): …`, `docs(scope): …`, `chore(scope): …`. Satu commit = satu perubahan koheren yang bisa dibangun.
- Badan commit menjelaskan *kenapa*, menyebut deviasi material dari arahan lama.
- Akhiri commit dengan baris atribusi yang diberikan harness (Co-Authored-By).

---

## 5. Git Flow — branching

`main` = selalu deployable, dilindungi. **Dilarang commit/push langsung ke `main`** (menggantikan aturan direct-to-main lama). Tidak pernah force-push/rewrite riwayat bersama.

### 5.1 Nama branch

`<tipe>/<scope>-<deskripsi-singkat-kebab>`, huruf kecil, ≤ 50 karakter.

| Tipe | Untuk | Contoh |
|---|---|---|
| `feat/` | fitur/kapabilitas baru | `feat/care-encrypted-outbox` |
| `fix/` | perbaikan bug | `fix/visit-replay-guard` |
| `refactor/` | ubah struktur tanpa ubah perilaku | `refactor/lib-oxygen-constants` |
| `test/` | uji saja | `test/fhir-observation-golden` |
| `docs/` | dokumentasi | `docs/claude-standard-v2` |
| `chore/` | tooling, CI, dependensi | `chore/ci-node-24` |
| `hotfix/` | perbaikan produksi mendesak (dari `main`) | `hotfix/auth-token-expiry` |

Prefix agent lama (`chatgpt/`, `codex/`, `claude/`, `panacea-maturity/`) tidak dipakai lagi untuk pekerjaan baru; pakai tipe di atas.

### 5.2 Alur kerja

```
git switch main && git pull --ff-only         # 1. mulai dari main terbaru
git switch -c feat/<scope>-<deskripsi>        # 2. satu branch = satu tujuan
# ... commit kecil & koheren ...
git fetch origin && git rebase origin/main    # 3. sinkron sebelum PR (rebase branch SENDIRI saja)
npm run build && npm run uji                  # 4. gate lokal (+ cd server && npm run typecheck bila menyentuh server)
git push -u origin HEAD                       # 5. push branch
gh pr create --base main                      # 6. buka PR (lihat §6)
```

Aturan:
- Satu branch/PR = **satu perubahan logis**. Jangan campur fitur, refactor besar, dan format ulang.
- Umur branch pendek (idealnya < 3 hari); besar → pecah jadi PR berurutan.
- Branch sudah di-merge dihapus. Jangan pakai ulang.
- Sebelum menyentuh berkas bersama (ClinicalHub, UnifiedBodyWorkspace, BodyExposure, EMR, ForYouHub), periksa PR/branch terbuka yang tumpang tindih (`gh pr list`) dan rekonsiliasi, jangan timpa.
- Agent **tidak** merge PR sendiri kecuali diminta pemilik secara eksplisit.

---

## 6. Mekanisme Pull Request

**Setiap perubahan masuk `main` lewat PR.** Judul mengikuti Conventional Commits.

### 6.1 Template deskripsi PR

Bagian wajib: **Ringkasan · Perubahan · Validasi (checklist) · Risiko & batas · Catatan reviewer**, diakhiri baris atribusi harness. Template lengkap dan perintah langkah demi langkah ada di skill **`panacea-git-flow`** (`.claude/skills/`), yang dimuat otomatis saat bekerja dengan git/PR.

### 6.2 Syarat merge

1. CI `Validate changes` (`build` + `uji` + server-validate) **hijau pada SHA terakhir**. Gate merah = tugas perbaikan berikutnya; **dilarang** melemahkan/mematikan uji, gate akademik, cek biomedis, atau kontrol keamanan agar hijau.
2. Minimal satu review (manusia pemilik atau reviewer yang ditunjuk); temuan review diselesaikan atau dijawab.
3. Tidak ada konflik dengan `main`; branch sudah rebase pada `main` terbaru.
4. Perubahan yang menyentuh area klinis/keamanan/privasi menyebut batasnya di bagian "Risiko & batas".
5. Setiap unit baru/diubah punya tes positif **dan** negatif (§3.1); reviewer menolak PR yang hanya berisi happy path.
6. Registry `governance/*.yaml` dan dokumen kontrak diperbarui bila status berubah.

Strategi merge: **squash merge** ke `main` (riwayat linear, satu commit per PR). Hotfix: PR kecil langsung dari `hotfix/*`, tetap wajib CI hijau.

### 6.3 Pelaporan

Laporan kemajuan konkret: SHA/nomor PR, kapabilitas yang berubah, hasil uji, status CI, blocker tersisa. Jangan klaim build/test/CI/deploy/validasi klinis tanpa bukti. Bedakan "berfungsi secara teknis" / "ditinjau klinis" / "tervalidasi klinis".

---

## 7. Checklist sebelum membuka PR

- [ ] Sudah cek apakah kapabilitas ini ada di repo (tidak duplikat).
- [ ] Dependensi arah §2.1 dipatuhi (tidak ada `lib` → `components`).
- [ ] Tidak ada logika/konstanta yang disalin; komponen berulang diekstrak.
- [ ] Input dari boundary divalidasi; error/loading/empty state tertangani; tidak ada tombol mati.
- [ ] Uji positif **dan** negatif (+ batas/otorisasi bila relevan) untuk logika baru; tidak ada tes dilemahkan/di-skip; `build` + `uji` lokal hijau.
- [ ] String UI baru berbahasa Inggris; satu kalimat ringkas per item di scroll utama, detail di balik disclosure.
- [ ] Tanpa rahasia/kredensial/PHI di kode, log, atau commit.
- [ ] Aksesibilitas dasar (kontras, fokus, label) dan mobile 390×844 terjaga.

---

## 8. Batas keras (tidak boleh dilemahkan)

- **Keselamatan klinis**: tidak ada diagnosis, dosis, resep, order, target prosedur, atau keputusan darurat otonom dari AI/simulasi. Draf AI tetap draf sampai ditinjau klinisi teridentifikasi. Data device/live ≠ rekam medis bertanda tangan.
- **Provenance & truth class**: bedakan measured / reference / simulated / derived / unsupported. Anatomi atlas ≠ anatomi pasien. Jangan mengarang sitasi, reviewer, kredensial, geometri, atau data. Tidak tahu = tampilkan "tidak diketahui".
- **Tanpa data/angka karangan**: konstanta klinis hanya dari sumber terverifikasi; dosis hanya dari korpus terkurasi/label resmi dengan kecocokan indikasi & rute (blank lebih baik daripada salah).
- **Privasi & keamanan**: consent, audit, retensi terbatas; tanpa pelacakan diam-diam; PHI tidak masuk log/repo; jangan melonggarkan authz (owner/admin bukan alasan melewati kontrol Visit). Repo publik: jangan commit rahasia/NDA/detail paten.
- **Integritas**: tidak menghapus fitur yang berguna hanya demi "bersih"; tidak mengklaim integrasi vendor/device tanpa adapter + fixture yang teruji.
- **Gate akademik/biomedis/keamanan**: jangan diakali. Klaim "novel/first/discovery" wajib mengikuti protokol Pioneer (bukti pencarian, bukan ingatan model).

---

## 9. Produk: sederhana di luar, dalam terstruktur

Satu fokus & satu aksi utama per viewport; ≤6 pilihan utama per surface; fitur penting ≤2 interaksi dari Home; visual/data dulu, interpretasi di balik disclosure; dekorasi harus bermakna. Detail: `DOCS/RUTHLESS-SIMPLICITY.md`.

---

## 10. Skill proyek & dokumen rujukan

Skill di `.claude/skills/` dimuat otomatis sesuai tugas (aturan tetap di dokumen ini; skill berisi prosedur): **`panacea-git-flow`** (branch/commit/PR), **`panacea-architecture`** (penempatan kode, layer, migrasi), **`panacea-testing`** (tes positif/negatif), **`invictus`** (eksekusi compounding-depth berbasis `PANACEA_INVICTUS_PRINCIPLE.md`). Panggil manual dengan `/panacea-git-flow`, `/panacea-architecture`, `/panacea-testing`, atau `/invictus`. Teks pemilik **`@invictus`** adalah pemanggilan eksplisit yang ekuivalen dengan `/invictus` untuk scope tugas saat itu; tidak pernah menonaktifkan gate keselamatan, bukti, provenance, testing, review, atau Git flow.

Instruksi umum multi-agent (dimuat otomatis lewat import di bawah; bila bertentangan dengan dokumen ini, **dokumen ini menang**):

@AGENTS.md

Dokumen lain **tidak** dimuat otomatis — baca sendiri sesuai tugas:

| Bila tugasmu menyentuh… | Baca dulu |
|---|---|
| Apa pun yang luas / "lanjut" | `PANACEA_PRODUCT_MATURITY_OS.md`, `automation/AUTONOMOUS_RND_LOOP.md`, `governance/` |
| Klaim ilmiah/klinis, R&D, novelty | `PANACEA_CONSTITUTION.md`, `DOCS/ACADEMIC-ACCURACY-GATE.md` |
| Model manusia, fisiologi, simulasi, coupling | `PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md`, `PANACEA_VERTICAL_COMPUTATIONAL_HUMAN_DOCTRINE.md`, `DOCS/PHYSIOLOGICAL-RUNTIME.md` |
| Data pasien, wearable, device, EMR | `PANACEA_ONE_OS_LONGITUDINAL_CARE_DOCTRINE.md`, `PANACEA_HUMAN_OBSERVABILITY_DOCTRINE.md`, `DOCS/MEDICAL-DEVICE-FABRIC.md` |
| Body Exposure / 3D / atlas | `DOCS/BODY-3D-ASSET-PIPELINE.md`, bagian "Body Exposure" di `PANACEA_OWNER_DIRECTIVES.md` |
| Visit OS / realtime / WebRTC | bagian "Visit OS" di `PANACEA_OWNER_DIRECTIVES.md`, `server/src/visitRealtimePolicy.ts` |
| Sport / rescue / environment | `DOCS/UNIVERSAL-SPORT-OS.md`, `DOCS/SPORT-ADVENTURE-RESCUE-OS.md`, `DOCS/ENVIRONMENT-SOURCE-ADAPTER.md` |
| UI/UX & navigasi | `DOCS/RUTHLESS-SIMPLICITY.md`, `DOCS/SUPERPAGE-SEMANTIC-DEPTH.md` |
| Keputusan arsitektur | `DOCS/adr/` (mulai `0001-domain-first-clean-architecture.md`) |

Prinsip **Invictus Human Reality Principle** (arsitektur masa depan yang dapat direalisasikan): `docs/superpowers/specs/2026-09-28-invictus-human-reality-principle-design.md`, kanonik lewat `PANACEA_INVICTUS_PRINCIPLE.md`.

Arahan pemilik lengkap (ledger historis): [`PANACEA_OWNER_DIRECTIVES.md`](PANACEA_OWNER_DIRECTIVES.md) — dibaca on-demand, tidak di-import agar konteks sesi tetap ramping. Doktrin tambahan: `PANACEA_INVICTUS_PRINCIPLE.md`, `PANACEA_HUMANITY_10_CHARTER.md`.

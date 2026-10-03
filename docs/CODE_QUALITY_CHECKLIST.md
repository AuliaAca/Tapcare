# Checklist Kualitas Kode

Checklist ini dipakai **setiap kali membuka dan me-review Pull Request**. Bagian 1–9 berlaku untuk proyek software apa pun. Kolom **"Di TapCare"** menunjukkan cara proyek ini menerapkannya: alat, file konfigurasi, atau perintah yang menegakkannya otomatis.

**Legenda tingkat**

- 🔴 **Wajib**: PR tidak boleh di-merge jika tidak terpenuhi.
- 🟡 **Sebaiknya**: boleh dikecualikan, asalkan alasannya ditulis di deskripsi PR.
- 🤖 **Otomatis**: dicek oleh tooling (pre-commit hook atau CI), jadi reviewer tidak perlu memeriksanya manual.

Satu perintah untuk menjalankan semua gerbang otomatis secara lokal:

```bash
npm run check   # format → lint → typecheck → test + coverage
```

---

## 1. Coding style guide

| #   | Item                                                                                                                                                     | Tingkat | Di TapCare                                                                                                                                                           |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | Tim memakai **satu style guide resmi per bahasa** dan menautkannya di README/CONTRIBUTING                                                                | 🔴      | TypeScript: [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html), ditegakkan dengan `typescript-eslint` (preset `strict` + `stylistic`) |
| 1.2 | Formatting **tidak diperdebatkan saat review**, karena formatter otomatis yang menentukan                                                                | 🔴 🤖   | Prettier (`.prettierrc.json`), dijalankan oleh `lint-staged` saat commit dan `format:check` di CI                                                                    |
| 1.3 | Linter berjalan dengan **nol warning** (`--max-warnings=0`)                                                                                              | 🔴 🤖   | `npm run lint`                                                                                                                                                       |
| 1.4 | Pengaturan editor seragam (indentasi, akhir baris, encoding)                                                                                             | 🟡      | `.editorconfig`, `.vscode/extensions.json`                                                                                                                           |
| 1.5 | Penamaan konsisten: `camelCase` untuk variabel/fungsi, `PascalCase` untuk tipe/komponen, `UPPER_SNAKE_CASE` untuk konstanta global, nama file sesuai isi | 🔴      | Komponen `Button.tsx`, hook `useCamera.ts`, konstanta `MAX_EDGE`                                                                                                     |
| 1.6 | Nama menjelaskan **maksud**, bukan tipe (`retryAfterSeconds`, bukan `num2`)                                                                              | 🔴      |                                                                                                                                                                      |
| 1.7 | Tidak ada kode mati, kode yang dikomentari, atau `console.log` sisa debugging                                                                            | 🔴 🤖   | Aturan ESLint `no-console: error`, `noUnusedLocals`                                                                                                                  |
| 1.8 | Mode ketat compiler/type checker aktif                                                                                                                   | 🔴 🤖   | `tsconfig.base.json`: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`                                                                                     |

**Style guide untuk bahasa lain** (jika tim polyglot):

| Bahasa                | Style guide                      | Alat penegak                                                      |
| --------------------- | -------------------------------- | ----------------------------------------------------------------- |
| Python                | PEP 8 + PEP 257 (docstring)      | Ruff (lint + format) atau Black + Flake8, mypy/pyright untuk tipe |
| Java                  | Google Java Style Guide          | Checkstyle, google-java-format, SpotBugs                          |
| Kotlin                | Kotlin Coding Conventions        | ktlint, detekt                                                    |
| Go                    | Effective Go + `gofmt`           | `gofmt`, `go vet`, staticcheck                                    |
| JavaScript/TypeScript | Google TS Style Guide / Airbnb   | ESLint + Prettier                                                 |
| C#                    | .NET Coding Conventions          | `dotnet format`, Roslyn analyzers                                 |
| SQL                   | SQL Style Guide (Simon Holywell) | SQLFluff                                                          |

---

## 2. Prinsip clean code

| #    | Item                                                                                                                         | Tingkat | Di TapCare                                                                                           |
| ---- | ---------------------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| 2.1  | **Modular**: setiap file/modul punya satu tanggung jawab yang jelas                                                          | 🔴      | `config.ts`, `errors.ts`, `rate-limit.ts`, `guidance-service.ts` dipisah per tanggung jawab          |
| 2.2  | **Reusable**: komponen dan fungsi generik tidak bergantung pada konteks layar tertentu                                       | 🟡      | `Button`, `Sheet`, `Segmented`, `FrameView` dipakai di banyak layar                                  |
| 2.3  | **DRY**: aturan bisnis dan kontrak data didefinisikan **sekali**                                                             | 🔴      | Skema API di `packages/shared` dipakai server dan web                                                |
| 2.4  | **KISS**: pilih solusi paling sederhana yang memenuhi kebutuhan; jangan menambah abstraksi untuk kebutuhan hipotetis (YAGNI) | 🔴      | Routing memakai state + History API, tanpa library router; rate limiter in-memory di balik interface |
| 2.5  | Fungsi pendek dan fokus; kompleksitas siklomatik ≤ 12; nesting ≤ 3                                                           | 🟡 🤖   | Aturan ESLint `complexity: 12`, `max-depth: 3`                                                       |
| 2.6  | Tidak ada _magic number/string_; pakai konstanta bernama                                                                     | 🔴      | `MAX_IMAGE_BASE64_LENGTH`, `REQUEST_TIMEOUT_MS`                                                      |
| 2.7  | Logika murni dipisah dari efek samping (I/O, UI) supaya mudah diuji                                                          | 🟡      | Reducer `sessionReducer`, fungsi `tapButton`, `postProcess`                                          |
| 2.8  | Fail fast: validasi di batas sistem, bukan di tengah logika                                                                  | 🔴      | `loadConfig` saat startup, Zod di route                                                              |
| 2.9  | Komentar menjelaskan **mengapa**, bukan **apa**                                                                              | 🔴      | Lihat komentar di `useCamera.ts` (generation counter)                                                |
| 2.10 | Data yang ditambah tanpa mengubah kode (data-driven)                                                                         | 🟡      | Skenario latihan di `practice/scenarios.ts`                                                          |

---

## 3. Prinsip SOLID (OOP)

| Prinsip                   | Pertanyaan saat review                                                                      | Tingkat | Contoh di TapCare                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **S**ingle Responsibility | Apakah kelas/modul ini punya **satu alasan** untuk berubah?                                 | 🔴      | `GuidanceService` hanya mengorkestrasi dan memproses hasil; `ClaudeProvider` hanya berbicara dengan model; route hanya menangani HTTP |
| **O**pen/Closed           | Bisakah perilaku baru ditambah **tanpa mengubah** kode yang sudah stabil?                   | 🟡      | Vendor AI baru cukup dibuat sebagai kelas baru yang mengimplementasikan `GuidanceProvider`                                            |
| **L**iskov Substitution   | Bisakah setiap implementasi menggantikan abstraksinya tanpa kejutan?                        | 🔴      | `MockProvider` dan `ClaudeProvider` bisa saling menggantikan; test integrasi memakai keduanya                                         |
| **I**nterface Segregation | Apakah interface kecil dan spesifik, bukan "god interface"?                                 | 🟡      | `VisionModelClient` hanya punya `requestGuidance`; `RateLimiter` hanya punya `consume`                                                |
| **D**ependency Inversion  | Apakah modul tingkat tinggi bergantung pada **abstraksi**, dan dependensi disuntikkan (DI)? | 🔴      | `createApp({ config, logger, service, limiter })`; `GuidanceService(provider, clock)`                                                 |

Untuk kode fungsional/React, prinsip yang setara: komponen kecil (S), komposisi dan props daripada percabangan (O), custom hook sebagai "interface" (I/D).

---

## 4. Testing

### 4.1 Piramida dan cakupan

| #     | Item                                                                                                           | Tingkat | Di TapCare                                                                    |
| ----- | -------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------- |
| 4.1.1 | **Unit test** untuk setiap logika bisnis, utilitas, dan reducer                                                | 🔴      | `*.test.ts` di samping file sumber                                            |
| 4.1.2 | **Integration test** untuk batas antar-komponen: HTTP API, alur layar dengan state nyata                       | 🔴      | `apps/server/test/app.integration.test.ts`, `apps/web/test/app.flow.test.tsx` |
| 4.1.3 | **End-to-end test** untuk alur kritis pengguna pada build produksi                                             | 🟡      | `e2e/tapcare.spec.ts` (Playwright, kamera palsu, cek CSP)                     |
| 4.1.4 | **Accessibility test** otomatis                                                                                | 🟡      | axe-core di e2e (WCAG 2 A/AA)                                                 |
| 4.1.5 | **Coverage minimal**: line ≥ 80%, function ≥ 80%, statement ≥ 80%, branch ≥ 70%; CI gagal jika di bawah ambang | 🔴 🤖   | `vitest.config.ts` → `coverage.thresholds`                                    |
| 4.1.6 | Kode baru tidak boleh **menurunkan** coverage modul yang disentuh                                              | 🟡      | Laporan coverage diunggah sebagai artifact CI                                 |

> Coverage adalah alat ukur, bukan tujuan. Test yang baik menguji **perilaku** (input → output, interaksi pengguna), bukan detail implementasi.

### 4.2 Kualitas test

| #     | Item                                                                                                     | Tingkat |
| ----- | -------------------------------------------------------------------------------------------------------- | ------- |
| 4.2.1 | Test bersifat **deterministik**: tanpa jaringan nyata, tanpa `sleep` acak, waktu/jam disuntikkan         | 🔴      |
| 4.2.2 | Satu test menguji satu perilaku; nama test berbunyi seperti spesifikasi ("rate limits with Retry-After") | 🔴      |
| 4.2.3 | Pola Arrange–Act–Assert; tidak ada logika bercabang di dalam test                                        | 🟡      |
| 4.2.4 | Kasus negatif dan edge case diuji: input invalid, timeout, error upstream, data korup                    | 🔴      |
| 4.2.5 | Setiap bug fix disertai **regression test** yang gagal sebelum perbaikan                                 | 🔴      |
| 4.2.6 | Mock hanya di batas sistem (jaringan, perangkat keras, waktu), bukan di logika internal                  | 🟡      |
| 4.2.7 | Test UI memakai query aksesibel (`getByRole`, `getByLabelText`), bukan selector CSS                      | 🟡      |
| 4.2.8 | Dilarang men-skip, menonaktifkan, atau mengkarantina test agar CI hijau                                  | 🔴      |

---

## 5. Git workflow

### 5.1 Strategi branching

Gunakan **GitHub Flow / trunk-based development**: `main` selalu bisa di-deploy, dan semua pekerjaan dilakukan di branch berumur pendek (maksimal beberapa hari).

| #     | Item                                                                                                                | Tingkat |
| ----- | ------------------------------------------------------------------------------------------------------------------- | ------- |
| 5.1.1 | `main` diproteksi: tidak ada push langsung, wajib PR, wajib CI hijau, minimal **1 approval**                        | 🔴      |
| 5.1.2 | Format nama branch: `<tipe>/<id-issue>-<deskripsi-singkat>`                                                         | 🔴      |
| 5.1.3 | Branch selalu diperbarui dari `main` sebelum merge (rebase untuk branch pribadi, merge commit untuk branch bersama) | 🟡      |
| 5.1.4 | Satu PR untuk satu perubahan logis; usahakan < 400 baris diff                                                       | 🟡      |
| 5.1.5 | Merge memakai **squash merge** supaya riwayat `main` bersih, satu commit per fitur                                  | 🟡      |
| 5.1.6 | Rilis ditandai dengan tag SemVer (`v1.2.0`) dan CHANGELOG                                                           | 🟡      |
| 5.1.7 | Dilarang `force-push` ke branch bersama atau ke branch milik orang lain                                             | 🔴      |

Contoh nama branch: `feat/42-voice-input`, `fix/57-camera-race`, `docs/api-errors`, `chore/deps-vite-8`.

### 5.2 Konvensi pesan commit: [Conventional Commits](https://www.conventionalcommits.org/)

```
<tipe>(<scope opsional>): <ringkasan dalam mode imperatif, ≤ 72 karakter>

<body: mengapa perubahan ini perlu, bukan apa yang berubah baris per baris>

<footer: Closes #42 | BREAKING CHANGE: ...>
```

| Tipe           | Kapan dipakai                              |
| -------------- | ------------------------------------------ |
| `feat`         | Fitur baru untuk pengguna                  |
| `fix`          | Perbaikan bug                              |
| `docs`         | Dokumentasi saja                           |
| `style`        | Format saja, tanpa perubahan logika        |
| `refactor`     | Perubahan struktur tanpa mengubah perilaku |
| `perf`         | Peningkatan performa                       |
| `test`         | Menambah atau memperbaiki test             |
| `build` / `ci` | Sistem build, dependency, pipeline         |
| `chore`        | Pekerjaan pemeliharaan lain                |

Contoh yang baik:

```
fix(web): stop camera stream when capture resolves after leaving the screen

A slow getUserMedia could resolve after the user moved on, leaving the
camera light on. A generation counter now discards stale streams.

Closes #57
```

| #     | Item                                                                      | Tingkat | Di TapCare                                  |
| ----- | ------------------------------------------------------------------------- | ------- | ------------------------------------------- |
| 5.2.1 | Pesan commit mengikuti Conventional Commits                               | 🔴 🤖   | `commitlint` lewat hook `.husky/commit-msg` |
| 5.2.2 | Lint dan format berjalan otomatis sebelum commit                          | 🔴 🤖   | `.husky/pre-commit` → `lint-staged`         |
| 5.2.3 | Tidak ada file rahasia, build output, atau `node_modules` yang ter-commit | 🔴 🤖   | `.gitignore`                                |
| 5.2.4 | Setiap commit di `main` bisa di-build                                     | 🔴      |                                             |

---

## 6. Error handling & logging

### 6.1 Error handling

| #     | Item                                                                                            | Tingkat | Di TapCare                                                                                       |
| ----- | ----------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------ |
| 6.1.1 | Tidak ada error yang ditelan diam-diam (`catch {}` kosong) tanpa alasan tertulis                | 🔴      | `catch` yang sengaja diabaikan selalu diberi komentar alasan (mis. `haptics.ts`, `useCamera.ts`) |
| 6.1.2 | Error dibedakan antara **operasional** (input salah, upstream sibuk) dan **bug** (tak terduga)  | 🔴      | Hierarki `AppError` vs error lain → 500 generik                                                  |
| 6.1.3 | Error yang dikirim ke klien memakai format konsisten dengan **kode yang stabil**                | 🔴      | `{ error: { code, message, requestId } }`                                                        |
| 6.1.4 | Detail internal (stack trace, query, path) **tidak pernah** dikirim ke klien                    | 🔴      | Ada test "hides unexpected errors behind a generic 500"                                          |
| 6.1.5 | Error retryable vs non-retryable dibedakan; retry memakai backoff dan batas                     | 🔴      | 429/5xx/koneksi → 503; SDK `maxRetries: 1`; `Retry-After`                                        |
| 6.1.6 | Ada timeout di setiap panggilan jaringan                                                        | 🔴      | Server 45 detik, klien 60 detik, keduanya bisa dibatalkan (`AbortSignal`)                        |
| 6.1.7 | Pesan error untuk pengguna akhir ditulis dalam bahasa awam dan disertai **tindakan** berikutnya | 🔴      | "Tidak ada koneksi internet…" + tombol _Coba lagi_                                               |
| 6.1.8 | Konfigurasi divalidasi saat startup (fail fast)                                                 | 🔴      | `loadConfig` → `ConfigError`                                                                     |
| 6.1.9 | Proses menangani `unhandledRejection` dan shutdown dengan rapi (SIGTERM)                        | 🟡      | `apps/server/src/index.ts`                                                                       |

### 6.2 Logging

| #     | Item                                                                                                                                                                                  | Tingkat | Di TapCare                                              |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------- |
| 6.2.1 | Log **terstruktur** (JSON) di produksi, pretty print di development                                                                                                                   | 🔴      | Pino + `pino-pretty`                                    |
| 6.2.2 | Setiap request punya **correlation/request ID** yang muncul di log dan di response                                                                                                    | 🔴      | Header `X-Request-Id`                                   |
| 6.2.3 | Level log dipakai dengan benar: `error` untuk bug atau masalah operator, `warn` untuk kondisi yang diharapkan tapi tidak normal, `info` untuk peristiwa penting, `debug` untuk detail | 🔴      |                                                         |
| 6.2.4 | **Tidak ada data sensitif di log**: password, token, API key, PIN, foto, data pribadi                                                                                                 | 🔴      | Redaction Pino untuk `apiKey`, `image`, `authorization` |
| 6.2.5 | Log akses mencatat method, path, status, dan durasi                                                                                                                                   | 🟡      | Middleware log di `app.ts`                              |
| 6.2.6 | Level log bisa diatur lewat environment, tanpa rebuild                                                                                                                                | 🟡      | `LOG_LEVEL`                                             |

---

## 7. Security practices

Acuan: [OWASP Top 10](https://owasp.org/Top10/), [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/), dan [OWASP Top 10 for LLM Applications](https://genai.owasp.org/).

### 7.1 Validasi & sanitasi input

| #     | Item                                                                                                                           | Tingkat | Di TapCare                                                                                                       |
| ----- | ------------------------------------------------------------------------------------------------------------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------- |
| 7.1.1 | **Semua input eksternal divalidasi di server** dengan skema (tipe, panjang, format, enum), memakai allow-list, bukan deny-list | 🔴      | Zod `GuidanceRequestSchema`                                                                                      |
| 7.1.2 | Batas ukuran body dan file                                                                                                     | 🔴      | `bodyLimit` 2.5 MB; base64 ≤ 2 MB; dimensi 64–4096                                                               |
| 7.1.3 | Tipe file dibatasi lewat allow-list                                                                                            | 🔴      | Hanya JPEG/PNG/WebP                                                                                              |
| 7.1.4 | Output di-encode sesuai konteks (HTML, URL, SQL); tidak memakai `dangerouslySetInnerHTML` atau `eval`                          | 🔴      | React meng-escape secara default; `toTelHref` hanya menyisakan angka                                             |
| 7.1.5 | Query database memakai parameter (bukan konkatenasi string)                                                                    | 🔴      | (Belum ada database)                                                                                             |
| 7.1.6 | **LLM**: konten dari pihak ketiga diperlakukan sebagai data, bukan instruksi (prompt injection)                                | 🔴      | System prompt menyatakan teks di layar kiosk adalah data; input pengguna dibungkus tag dan karakter `<>` dibuang |
| 7.1.7 | **LLM**: output model tidak dipercaya; divalidasi dan disanitasi sebelum dipakai                                               | 🔴      | Structured output → `cleanText`, `clampBox`, aturan keamanan di `postProcess`                                    |

### 7.2 Manajemen kredensial

| #     | Item                                                                                         | Tingkat | Di TapCare                                          |
| ----- | -------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------- |
| 7.2.1 | Tidak ada secret di kode, riwayat Git, log, atau bundle frontend                             | 🔴      | API key hanya di server, dibaca dari `.env`         |
| 7.2.2 | `.env` di-ignore; `.env.example` berisi nama variabel **tanpa** nilai asli                   | 🔴      |                                                     |
| 7.2.3 | Produksi memakai secret manager (GitHub Secrets, Vault, AWS/GCP Secret Manager)              | 🔴      |                                                     |
| 7.2.4 | Prinsip least privilege: key dengan scope minimum, rotasi berkala, segera dicabut jika bocor | 🔴      |                                                     |
| 7.2.5 | Secret scanning aktif di repository                                                          | 🟡      | Aktifkan GitHub secret scanning dan push protection |

### 7.3 Hardening aplikasi

| #     | Item                                                                                                                    | Tingkat | Di TapCare                                                                         |
| ----- | ----------------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------- |
| 7.3.1 | Security header: CSP ketat, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors 'none'`, `Permissions-Policy` | 🔴      | `secureHeaders` di `app.ts`; e2e gagal jika ada pelanggaran CSP                    |
| 7.3.2 | CORS hanya untuk origin yang terdaftar                                                                                  | 🔴      | `ALLOWED_ORIGINS`                                                                  |
| 7.3.3 | Rate limiting pada endpoint yang mahal                                                                                  | 🔴      | `RATE_LIMIT_PER_MINUTE`; `X-Forwarded-For` hanya dipercaya jika `TRUST_PROXY=true` |
| 7.3.4 | HTTPS di semua lingkungan publik                                                                                        | 🔴      | Wajib, karena kamera hanya berjalan lewat HTTPS                                    |
| 7.3.5 | Dependency di-audit; tidak ada kerentanan _high/critical_                                                               | 🔴 🤖   | `npm audit --audit-level=high` di CI; aktifkan Dependabot                          |
| 7.3.6 | Container berjalan sebagai user non-root                                                                                | 🟡      | `USER node` di `Dockerfile`                                                        |
| 7.3.7 | Privasi: minimalkan data yang dikumpulkan; jangan simpan yang tidak perlu                                               | 🔴      | Foto tidak disimpan; history hanya berupa teks; kontak disimpan di perangkat       |

---

## 8. Dokumentasi

| #   | Item                                                                                                                           | Tingkat | Di TapCare                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | ------- | ----------------------------------------------------------------- |
| 8.1 | **README** menjelaskan apa proyek ini, cara menjalankan dalam < 5 menit, konfigurasi, perintah, struktur, dan deployment       | 🔴      | `README.md`                                                       |
| 8.2 | **API docs**: setiap endpoint dengan request, response, kode error, dan contoh                                                 | 🔴      | `docs/API.md`; sumber kebenarannya skema Zod di `packages/shared` |
| 8.3 | **Arsitektur dan keputusan desain** (ADR ringkas: konteks → keputusan → alasan)                                                | 🟡      | `docs/ARCHITECTURE.md`                                            |
| 8.4 | **CONTRIBUTING**: setup, workflow, standar                                                                                     | 🔴      | `CONTRIBUTING.md`                                                 |
| 8.5 | **SECURITY**: cara melaporkan kerentanan                                                                                       | 🟡      | `SECURITY.md`                                                     |
| 8.6 | Komentar inline **seperlunya**: hanya untuk "mengapa", trade-off, workaround, atau batasan eksternal; tidak mengulang isi kode | 🔴      |                                                                   |
| 8.7 | API publik (fungsi/kelas yang diekspor) diberi doc comment singkat (JSDoc/TSDoc, docstring, Javadoc)                           | 🟡      |                                                                   |
| 8.8 | Dokumentasi diperbarui **di PR yang sama** dengan perubahan perilaku                                                           | 🔴      | Ada di checklist PR template                                      |
| 8.9 | Variabel environment terdokumentasi lengkap                                                                                    | 🔴      | `.env.example` + tabel di README                                  |

---

## 9. Panduan code review

### 9.1 Sebelum meminta review (penulis)

- [ ] `npm run check` lulus di lokal; CI hijau.
- [ ] Self-review diff sendiri: hapus debug code, TODO tanpa issue, dan perubahan yang tidak terkait.
- [ ] Deskripsi PR menjawab **apa, mengapa, cara menguji**, risiko, dan cara rollback; tautkan issue.
- [ ] Sertakan screenshot atau rekaman untuk perubahan UI (mode terang dan gelap, teks "Sangat besar").
- [ ] PR kecil dan fokus. Pecah jika > 400 baris, kecuali kode hasil generate.

### 9.2 Yang dicek reviewer (berurutan dari yang paling penting)

| Urutan | Area                                 | Pertanyaan kunci                                                                                                                   |
| ------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1      | **Kebenaran**                        | Apakah kode melakukan yang dimaksud? Edge case: input kosong, null, batas maksimum, jaringan putus, race condition, double submit? |
| 2      | **Keamanan & privasi**               | Input divalidasi? Ada secret atau data pribadi yang bocor ke log, response, atau bundle? Bagian 7 terpenuhi?                       |
| 3      | **Desain**                           | Apakah perubahan di tempat yang tepat? Ada pelanggaran SOLID, kopling berlebih, atau duplikasi? Ada solusi yang lebih sederhana?   |
| 4      | **Test**                             | Apakah perilaku baru dan bug fix diuji? Apakah test akan gagal jika logikanya rusak?                                               |
| 5      | **Error handling**                   | Error ditangani dan di-log dengan benar? Pengguna mendapat pesan yang bisa ditindaklanjuti?                                        |
| 6      | **Keterbacaan**                      | Nama jelas? Fungsi pendek? Komentar menjelaskan "mengapa"?                                                                         |
| 7      | **Performa**                         | Ada loop berat, render berulang, payload besar, atau N+1 query yang tidak perlu?                                                   |
| 8      | **Aksesibilitas & i18n** (khusus UI) | Target sentuh ≥ 56px, label untuk screen reader, kontras cukup, teks ada di kedua bahasa?                                          |
| 9      | **Dokumentasi**                      | README, API docs, atau `.env.example` perlu diperbarui?                                                                            |

### 9.3 Etika review

- Review dalam **1 hari kerja**. Kritik kodenya, bukan orangnya.
- Beri label pada komentar supaya jelas mana yang memblokir:
  - **`blocker:`** wajib diperbaiki sebelum merge.
  - **`suggestion:`** usulan perbaikan; penulis boleh memutuskan.
  - **`nit:`** hal kecil atau gaya, tidak memblokir.
  - **`question:`** minta penjelasan.
- Jelaskan _mengapa_ dan, jika bisa, beri contoh kode.
- Apresiasi solusi yang baik.
- Jika diskusi lebih dari 2 putaran, lanjutkan lewat panggilan singkat, lalu tulis hasilnya di PR.

### 9.4 Definition of Done (syarat merge)

- [ ] Semua gerbang CI hijau: format, lint, typecheck, test + coverage, build, audit, e2e.
- [ ] Minimal 1 approval dari reviewer selain penulis.
- [ ] Semua komentar `blocker:` sudah diselesaikan; thread yang terjawab sudah di-resolve.
- [ ] Dokumentasi dan `.env.example` diperbarui jika perlu.
- [ ] Tidak ada TODO baru tanpa nomor issue.
- [ ] Squash merge dengan judul berformat Conventional Commits.

---

## Lampiran: pemetaan item ke alat otomatis

| Gerbang                     | Lokal (otomatis)                 | CI                             |
| --------------------------- | -------------------------------- | ------------------------------ |
| Format                      | `lint-staged` → Prettier         | `npm run format:check`         |
| Lint                        | `lint-staged` → ESLint           | `npm run lint`                 |
| Pesan commit                | `commitlint` (hook `commit-msg`) | (opsional) commitlint di PR    |
| Tipe                        | Editor                           | `npm run typecheck`            |
| Unit + integrasi + coverage | `npm test`                       | `npm run test:coverage`        |
| E2E + aksesibilitas + CSP   | `npm run test:e2e`               | job `e2e`                      |
| Kerentanan dependency       | `npm audit`                      | `npm audit --audit-level=high` |

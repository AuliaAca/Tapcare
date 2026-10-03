# Catatan Produk: Masukan, Perubahan, dan Roadmap

## 1. Perubahan dari prototipe sebelumnya

Prototipe awal (React + Vite, folder `frontend/`) sudah punya landing page, layar kamera, dan tampilan kiosk statis. Berikut temuan dan perubahannya.

| Temuan di prototipe                                                                                         | Dampak                                               | Yang dilakukan sekarang                                                                       |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Folder bernama `KioskSimulation.jsx/`, tetapi di-import sebagai `./screens/KioskSimulation/KioskSimulation` | **Build gagal** (modul tidak ditemukan)              | Struktur folder dirapikan; build diuji di CI                                                  |
| `useState('kiosk')`: layar debug menjadi layar awal                                                         | Pengguna langsung melihat kiosk palsu, bukan beranda | Navigasi dengan route yang jelas dan mendukung tombol _Back_ HP                               |
| Layar "AI Guidance" masih berupa teks placeholder                                                           | Fitur inti belum ada                                 | Loop agen penuh: foto → satu langkah → umpan balik → foto berikutnya                          |
| Tombol "How it works?" tidak punya handler                                                                  | Tombol mati                                          | Bottom sheet "Cara kerja"                                                                     |
| CSS `.ai-icon` tidak cocok dengan class `.companion-image` di JSX                                           | Gaya gambar tidak diterapkan                         | Design system berbasis token (Tailwind v4, OKLCH)                                             |
| Gambar maskot 1,8 MB PNG                                                                                    | Halaman pertama lambat di jaringan seluler           | Dikompres ke WebP 15 KB (−99%) plus ikon PWA                                                  |
| `console.error` dan error kamera generik                                                                    | Pengguna tidak tahu harus berbuat apa                | Pesan dibedakan (izin ditolak / tidak ada kamera / error) dan ada alternatif foto dari galeri |
| Kiosk simulasi hanya tampilan, tanpa interaksi                                                              | Tidak bisa dipakai berlatih                          | Mode Latihan interaktif dengan tiga skenario dan pelatih                                      |
| Tidak ada backend; API key AI nantinya harus di frontend                                                    | Key akan bocor                                       | Server Hono menyimpan key; klien tidak pernah melihatnya                                      |

Mesin kiosk tiruan dari prototipe tetap dipertahankan dan dikembangkan menjadi `PracticeKiosk`.

## 2. Fitur yang saya tambahkan, dan alasannya

1. **Satu langkah per giliran dengan verifikasi.** AI hanya memberi satu ketukan, lalu memeriksa foto berikutnya. Untuk lansia, daftar 5 langkah sekaligus mudah membuat bingung.
2. **Tombol umpan balik "Tidak ketemu" dan "Tidak ada yang berubah".** Inilah yang membuatnya _agentic_: agen menyusun ulang penjelasan atau rencananya, bukan sekadar mengulang.
3. **Sorotan pada foto (spotlight + cincin berdenyut).** Ditambah petunjuk teks ("tombol hijau, kanan bawah") jika kotak sorotan kurang akurat.
4. **Pelindung keamanan.** Layar PIN, pembayaran, data pribadi, dan penipuan memunculkan banner. Layar mencurigakan menghentikan alur. Aturan ini juga ditegakkan di kode server, bukan hanya di prompt.
5. **Mode Latihan offline.** Mengurangi rasa takut salah sebelum mencoba di depan antrean sungguhan. Ada pelajaran khusus tentang PIN.
6. **Suara (TTS) dan input suara.** Banyak lansia lebih nyaman mendengar daripada membaca. Kecepatan suara bisa diatur.
7. **Aksesibilitas sebagai default.** Teks besar, tiga ukuran, mode gelap, target sentuh besar, dan dukungan pembaca layar. Dicek otomatis dengan axe.
8. **Tombol Bantuan dan kontak tepercaya.** Bisa menelepon keluarga dengan satu ketukan; nomornya hanya disimpan di perangkat.
9. **PWA yang bisa di-install.** Tersedia dari layar utama HP tanpa perlu ke Play Store.
10. **Mode demo tanpa API key.** Seluruh aplikasi bisa dicoba dan diuji gratis.

## 3. Masukan dan ide pengembangan berikutnya

Diurutkan dari dampak terbesar.

| Prioritas | Ide                                                                                                                                   | Mengapa                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Tinggi    | **Uji dengan pengguna lansia sungguhan** (5–8 orang) di 2–3 jenis kiosk                                                               | Asumsi UX terbesar (teks, suara, alur umpan balik) perlu divalidasi; data ini juga kuat untuk portofolio dan pitch |
| Tinggi    | **Evaluasi akurasi AI**: kumpulkan 50–100 foto kiosk lokal (KRL, RS, fast food, parkir), lalu ukur ketepatan tombol dan kotak sorotan | Satu-satunya cara mengetahui apakah `effort` atau model perlu diubah, dan agar biaya terukur                       |
| Tinggi    | **Mode berkelanjutan (tanpa menekan "Lihat layar")**: deteksi otomatis saat layar berubah, lalu analisis ulang                        | Mengurangi satu ketukan per langkah; perlu pengaturan biaya dan rate limit                                         |
| Sedang    | **Overlay AR langsung** di video, bukan pada foto beku                                                                                | Lebih intuitif, tetapi perlu pelacakan posisi (mis. tracking di perangkat); lebih kompleks                         |
| Sedang    | **Bantuan jarak jauh dari keluarga**: kirim tautan supaya anak atau cucu bisa melihat langkah yang sama                               | Sangat relevan untuk lansia; perlu backend sesi dan privasi yang matang                                            |
| Sedang    | **Bahasa daerah** (Jawa, Sunda) dan suara yang lebih natural                                                                          | Jangkauan pengguna di Indonesia                                                                                    |
| Sedang    | **Paket pengetahuan kiosk** (alur umum KRL, bank, RS) sebagai konteks tambahan untuk AI                                               | Akurasi lebih tinggi untuk kiosk yang populer                                                                      |
| Rendah    | **Riwayat dan "kiosk favorit"**                                                                                                       | Pengguna rutin (mis. kontrol bulanan di RS) bisa mengulang alur yang sama                                          |
| Rendah    | **Analitik yang menghormati privasi** (tanpa foto): tingkat selesai, langkah yang sering "tidak ketemu"                               | Menemukan titik gesekan; perlu persetujuan pengguna                                                                |

## 4. Bagian yang menurut saya perlu diputuskan

- **Nama dan kalimat brand.** "TapCare" sudah bagus. Tagline Indonesia yang dipakai: "Lihat. Pahami. Tekan dengan yakin."
- **Model AI dan biaya.** Default-nya `claude-opus-5-5` dengan `effort=low` untuk kecepatan. Setelah evaluasi di poin 3, bisa dibandingkan dengan model yang lebih murah (`TAPCARE_MODEL`). Ini keputusan biaya versus kualitas, sebaiknya diambil berdasarkan data.
- **Lisensi.** Belum ditambahkan. Pilih MIT jika ingin terbuka, atau biarkan tanpa lisensi jika proyek ini komersial.

## 5. Keterbatasan yang diketahui

- Kotak sorotan dari model visi bisa meleset beberapa piksel pada layar yang padat. Karena itu UI selalu menampilkan label dan petunjuk teks.
- Speech recognition (input suara) bergantung pada browser: tersedia di Chrome Android, terbatas di iOS Safari. Jika tidak didukung, tombol mikrofon disembunyikan.
- Getaran (haptics) tidak tersedia di iOS Safari.
- Rate limiter masih in-memory, sehingga hanya cocok untuk satu instance server (lihat `docs/ARCHITECTURE.md`).
- Dockerfile sudah ditulis, tetapi belum diuji build di lingkungan pengembangan ini.

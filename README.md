# AntrianKu

Landing page dan demo sistem antrian digital untuk klinik dan usaha layanan. Pengunjung dapat mengenal alur layanan melalui landing page, lalu mencoba simulasi mengambil nomor, mengelola antrian, dan menampilkan nomor panggilan di browser.

## Latar belakang

Pengelolaan antrian secara manual dapat membuat pelanggan kesulitan mengetahui giliran, sementara petugas perlu memanggil dan mencatat status antrian secara terpisah. Demo AntrianKu memperlihatkan bagaimana alur tersebut dapat ditampilkan dalam satu antarmuka.

## Tentang proyek

Proyek ini terdiri dari landing page portfolio dan demo interaktif sisi browser. Demo menggunakan data contoh dan `localStorage`, sehingga tidak memerlukan akun atau server backend. Data tersimpan hanya di browser yang sedang digunakan.

## Fitur

### Landing page

- Ringkasan fitur, cara kerja, jenis usaha, dan contoh paket harga.
- Tautan untuk membuka demo dan menghubungi KaryaBit Studio.
- Layout responsif untuk layar ponsel dan desktop.

### Pelanggan

- Pilih layanan, seperti Poli Umum, Poli Gigi, Poli Anak, Poli Mata, dan Laboratorium.
- Isi formulir pendaftaran contoh dan ambil nomor antrian.
- Formulir hanya untuk simulasi; gunakan data bebas dan jangan masukkan data pribadi asli.

### Operator

- Lihat daftar antrian menunggu, dipanggil, dan sedang dilayani.
- Panggil dan perbarui status antrian melalui dashboard operator.

### Display dan tablet

- Display TV memperlihatkan nomor yang dipanggil dan antrian berikutnya.
- Browser dapat membacakan panggilan dengan fitur text-to-speech.
- Mode tablet menyediakan antarmuka untuk simulasi layanan mandiri.

## Teknologi

- HTML, CSS, dan JavaScript.
- Tailwind CSS melalui CDN.
- `localStorage` untuk menyimpan data demo di browser.
- Browser Speech Synthesis untuk simulasi suara panggilan.

## Menjalankan secara lokal

Tidak perlu instalasi paket. Buka `index.html` di browser atau jalankan server statis dari direktori proyek:

```bash
python -m http.server 8000
```

Buka `http://localhost:8000`. Landing page tersedia di alamat tersebut, sedangkan demo dapat dibuka melalui tombol **Coba Demo Interaktif** atau URL `http://localhost:8000/demo/`.

Tailwind CSS dimuat dari CDN, sehingga koneksi internet diperlukan untuk memuat tampilan dengan benar.

## Data demo

- Data antrian tersimpan di `localStorage` browser dan tidak tersinkron antarperangkat.
- Tombol **Reset** menghapus data demo yang tersimpan.
- Data demo direset otomatis ketika tanggal UTC berubah.
- Nama dan nomor telepon yang digunakan untuk membuat tiket tersimpan bersama data antrian di `localStorage` browser.
- Demo tidak terhubung ke backend, autentikasi, atau pengiriman WhatsApp.

## Menambah atau mengubah layanan

Daftar layanan demo berada pada konstanta `SERVICES` di `demo/js/app.js`. Setiap layanan memiliki `id`, `name`, `prefix`, dan estimasi waktu `est`. Gunakan `id` dan `prefix` yang unik agar nomor antrian tiap layanan tidak bertabrakan.

## Struktur proyek

```text
index.html       Landing page AntrianKu
demo/index.html  Antarmuka demo interaktif
demo/js/app.js   Logika dan data demo antrian
```

## Deployment

Proyek dapat dipublikasikan pada layanan hosting statis yang mendukung HTML. Unggah isi direktori proyek dengan mempertahankan struktur `demo/index.html` dan `demo/js/app.js`. Tidak ada proses build atau konfigurasi server khusus.

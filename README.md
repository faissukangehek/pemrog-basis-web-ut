# Tugas 1: Web SITTA

Tugas praktikum mata kuliah STSI4209. Semua berkas ada di dalam folder `tugas_1/`.

Halaman yang dibuat meniru alur pemesanan dan distribusi bahan ajar di Universitas Terbuka. Petugas masuk lewat halaman login, lalu dashboard menampilkan rekap bahan ajar dan progres delivery order, halaman stok menampung persediaan, dan halaman tracking melacak posisi kiriman.

Isinya masih statis. Tidak ada backend, tidak ada build step, jadi cukup buka `tugas_1/index.html` di browser atau jalankan lewat Live Server. Data contoh pengguna, bahan ajar, dan riwayat pengiriman ada di `tugas_1/js/data.js`. Setelah login, sesi disimpan di `localStorage` dengan key `sitta_user` supaya halaman lain bisa membaca pengguna yang sedang aktif.

Akun demo dari `data.js`:

| Email | Password | Role |
| --- | --- | --- |
| admin@ut.ac.id | admin123 | Administrator |
| rina@ut.ac.id | rina123 | UPBJJ-UT |
| siti@ut.ac.id | siti123 | Puslaba |
| doni@ut.ac.id | doni123 | Fakultas |
| agus@ut.ac.id | agus123 | UPBJJ-UT |

Nomor DO yang bisa dicoba di halaman tracking: `2023001234` dan `2023005678`.

## Struktur

```text
tugas_1/
├── index.html          # login, modal lupa password & pendaftaran
├── dashboard.html      # rekap bahan ajar, progres DO, histori transaksi
├── stok.html           # tabel persediaan + form tambah stok
├── tracking.html       # pencarian nomor DO + timeline pengiriman
├── css/
│   └── style.css       # seluruh gaya halaman
├── js/
│   ├── data.js         # data contoh pengguna, bahan ajar, tracking
│   └── script.js       # validasi login, render dashboard/stok/tracking
├── img/                # cover bahan ajar
│   ├── pengantar_komunikasi.jpg
│   ├── manajemen_keuangan.jpg
│   ├── kepemimpinan.jpg
│   ├── mikrobiologi.jpg
│   └── paud_perkembangan.jpeg
└── assets/             # logo dan ornamen halaman
    ├── ut-header.webp
    ├── ornament-left.png
    └── ornament-right.png
```

## Catatan tiap halaman

`index.html` memvalidasi format email dan kecocokan password terhadap `dataPengguna`, lalu menampilkan modal sebelum mengalihkan ke dashboard. Tombol lupa password dan daftar akun hanya membuka modal informasi.

`dashboard.html` menyapa pengguna sesuai jam, menampilkan ringkasan jumlah judul bahan ajar, dan menyusun tabel dari `dataBahanAjar` serta `dataTracking`.

`stok.html` menampilkan daftar persediaan dan menerima tambahan data baru lewat form di atas tabel.

`tracking.html` mencari nomor DO pada `dataTracking`, menampilkan data penerima, ekspedisi, dan riwayat perjalanan paket.

`js/script.js` membaca atribut `data-page` pada `<body>` untuk menentukan fungsi inisialisasi yang jalan, jadi satu berkas menangani keempat halaman.

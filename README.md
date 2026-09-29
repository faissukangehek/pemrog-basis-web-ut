# Tugas 1: Web SITTA

Project ini dibuat untuk memenuhi Tugas 1 mata kuliah Pemrograman Berbasis Web (MSIM4309). Semua berkas ada di dalam folder `tugas_1/`.

Yang dibangun adalah sistem pemesanan dan tracking bahan ajar UT, dengan DOM JavaScript dipakai untuk memanipulasi data yang ada. Halaman login memeriksa email dan password, dashboard menampilkan rekap bahan ajar beserta progres delivery order, halaman stok menampung persediaan, dan halaman tracking mencari kiriman berdasarkan nomor DO.

Sistem ini berjalan sepenuhnya di sisi klien dan tidak memakai server side. Semua record contoh ada di `tugas_1/js/data.js`, dan tiap halaman merender ulang record itu lewat DOM. Sesi login disimpan di `localStorage` dengan key `sitta_user`, jadi dashboard, stok, dan tracking bisa membaca pengguna yang sedang masuk.

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

## Penjelasan file

a. `index.html`, kerangka utama (core file) yang memuat formulir login. Di dalamnya ada kolom email dan password, tombol masuk, modal lupa password, dan modal pendaftaran akun. Validasi format email serta kecocokan password terhadap `dataPengguna` dijalankan lewat fungsi `initLogin` di `script.js`, dan modal konfirmasi tampil sebelum pengguna dialihkan ke dashboard. Tombol lupa password dan daftar akun hanya membuka modal informasi.

b. `dashboard.html`, halaman utama setelah pengguna login. Berisi sidebar navigasi, tiga kartu statistik untuk jumlah judul bahan ajar, total stok modul, dan delivery order aktif, lalu empat panel yang bisa dipilih dari menu, yaitu Beranda, Monitoring Progress DO, Rekap Bahan Ajar, dan Histori Transaksi. Halaman ini juga menampilkan nama dan role pengguna yang sedang masuk, beserta tombol keluar.

c. `stok.html`, halaman informasi persediaan. Ada form tambah data stok dengan enam kolom input, yaitu kode lokasi, kode modul, nama bahan ajar, jenis modul, edisi, dan jumlah stok. Tabel di bawahnya dirender dari `dataBahanAjar`, dan data baru dari form langsung muncul di tabel setelah lolos validasi.

d. `tracking.html`, halaman pelacakan kiriman. Pengguna memasukkan nomor DO, lalu sistem mencari datanya di `dataTracking` dan menampilkan nama penerima, ekspedisi, tanggal kirim, serta total biaya. Riwayat perjalanan paket ditampilkan berurutan sampai status selesai antar.

Folder `css` berisi `style.css` yang mengatur seluruh tampilan halaman. Folder `js` berisi `data.js` sebagai sumber data contoh dan `script.js` sebagai tempat logika sistem. `script.js` membaca atribut `data-page` pada `<body>` untuk menentukan fungsi inisialisasi yang jalan, jadi satu berkas itu menangani keempat halaman.

/**
 * ============================================================================
 * SITTA Universitas Terbuka — Data Service & Global Filters (api.js)
 * Tugas Praktik 3: STSI4209 Sistem Informasi Tiras & Transaksi Bahan Ajar
 * ============================================================================
 */

var DEFAULT_BAHAN_AJAR_DATA = {
  upbjjList: ["Jakarta", "Surabaya", "Makassar", "Padang", "Denpasar"],
  kategoriList: ["MK Wajib", "MK Pilihan", "Praktikum", "Problem-Based"],
  pengirimanList: [
    { kode: "REG", nama: "JNE Regular (3-5 hari)" },
    { kode: "EXP", nama: "JNE Express (1-2 hari)" }
  ],
  paket: [
    {
      kode: "PAKET-UT-001",
      nama: "PAKET IPS Dasar",
      isi: ["EKMA4116", "EKMA4115"],
      harga: 120000
    },
    {
      kode: "PAKET-UT-002",
      nama: "PAKET IPA Dasar",
      isi: ["BIOL4201", "FISIP4001"],
      harga: 140000
    }
  ],
  stok: [
    {
      kode: "EKMA4116",
      judul: "Pengantar Manajemen",
      kategori: "MK Wajib",
      upbjj: "Jakarta",
      lokasiRak: "R1-A3",
      harga: 65000,
      qty: 28,
      safety: 20,
      catatanHTML: "<em>Edisi 2024, cetak ulang</em>"
    },
    {
      kode: "EKMA4115",
      judul: "Pengantar Akuntansi",
      kategori: "MK Wajib",
      upbjj: "Jakarta",
      lokasiRak: "R1-A4",
      harga: 60000,
      qty: 7,
      safety: 15,
      catatanHTML: "<strong>Cover baru</strong>"
    },
    {
      kode: "BIOL4201",
      judul: "Biologi Umum (Praktikum)",
      kategori: "Praktikum",
      upbjj: "Surabaya",
      lokasiRak: "R3-B2",
      harga: 80000,
      qty: 12,
      safety: 10,
      catatanHTML: "Butuh <u>pendingin</u> untuk kit basah"
    },
    {
      kode: "FISIP4001",
      judul: "Dasar-Dasar Sosiologi",
      kategori: "MK Pilihan",
      upbjj: "Makassar",
      lokasiRak: "R2-C1",
      harga: 55000,
      qty: 2,
      safety: 8,
      catatanHTML: "Stok <i>menipis</i>, prioritaskan reorder"
    },
    {
      kode: "SKOM4101",
      judul: "Pengantar Ilmu Komunikasi",
      kategori: "Problem-Based",
      upbjj: "Padang",
      lokasiRak: "R4-D1",
      harga: 58000,
      qty: 0,
      safety: 12,
      catatanHTML: "<strong>Stok kosong</strong>, sedang proses cetak di Puslaba"
    }
  ],
  tracking: {
    "DO2025-0001": {
      nim: "123456789",
      nama: "Rina Wulandari",
      status: "Dalam Perjalanan",
      ekspedisi: "JNE Regular",
      tanggalKirim: "2025-08-25",
      paket: "PAKET-UT-001",
      total: 120000,
      perjalanan: [
        { waktu: "2025-08-25 10:12:20", keterangan: "Penerimaan di Loket: TANGSEL" },
        { waktu: "2025-08-25 14:07:56", keterangan: "Tiba di Hub: JAKSEL" },
        { waktu: "2025-08-26 08:44:01", keterangan: "Diteruskan ke Kantor Tujuan" }
      ]
    },
    "DO2025-0002": {
      nim: "048291034",
      nama: "Ahmad Fauzi",
      status: "Selesai / Diterima",
      ekspedisi: "JNE Express",
      tanggalKirim: "2025-08-21",
      paket: "PAKET-UT-002",
      total: 140000,
      perjalanan: [
        { waktu: "2025-08-21 09:15:00", keterangan: "Penerimaan di Loket: PUSLABA UT" },
        { waktu: "2025-08-22 13:40:12", keterangan: "Tiba di Hub Sortir Surabaya" },
        { waktu: "2025-08-23 15:10:05", keterangan: "Paket telah diterima oleh Mahasiswa (Penerima: YBS)" }
      ]
    },
    "DO2025-0003": {
      nim: "049102941",
      nama: "Dewi Lestari",
      status: "Dikemas",
      ekspedisi: "JNE Regular",
      tanggalKirim: "2025-08-28",
      paket: "PAKET-UT-001",
      total: 120000,
      perjalanan: [
        { waktu: "2025-08-28 08:30:00", keterangan: "Penerbitan Surat Jalan DO di Gudang Pusat" },
        { waktu: "2025-08-28 11:00:00", keterangan: "Bahan ajar sedang dipacking dalam kardus bersegel UT" }
      ]
    }
  }
};

var BULAN_INDONESIA = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

/**
 * Helper pemformatan global
 */
var FormatHelper = {
  rupiah: function (nominal) {
    var n = Number(nominal);
    if (isNaN(n)) n = 0;
    return "Rp " + n.toLocaleString("id-ID");
  },

  satuanBuah: function (qty) {
    var n = Number(qty);
    if (isNaN(n)) n = 0;
    return n + " buah";
  },

  tanggalIndo: function (inputDate) {
    if (!inputDate) return "-";
    var str = String(inputDate).trim();
    // Jika sudah berformat "25 Agustus 2025", kembalikan langsung
    if (/[a-zA-Z]/.test(str) && !str.includes("T")) {
      return str;
    }
    var parts = str.split("T")[0].split("-");
    if (parts.length === 3) {
      var year = parseInt(parts[0], 10);
      var month = parseInt(parts[1], 10) - 1;
      var day = parseInt(parts[2], 10);
      if (!isNaN(day) && month >= 0 && month < 12 && !isNaN(year)) {
        return day + " " + BULAN_INDONESIA[month] + " " + year;
      }
    }
    var d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.getDate() + " " + BULAN_INDONESIA[d.getMonth()] + " " + d.getFullYear();
    }
    return str;
  },

  waktuSekarang: function () {
    var now = new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, "0");
    var d = String(now.getDate()).padStart(2, "0");
    var hh = String(now.getHours()).padStart(2, "0");
    var mm = String(now.getMinutes()).padStart(2, "0");
    var ss = String(now.getSeconds()).padStart(2, "0");
    return y + "-" + m + "-" + d + " " + hh + ":" + mm + ":" + ss;
  },

  tanggalHariIniISO: function () {
    var now = new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, "0");
    var d = String(now.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }
};

/**
 * Registrasi Vue Filters (Indikator 7: Formatting data teks menggunakan konsep filter)
 */
if (typeof Vue !== "undefined") {
  // Filter Harga: Menambahkan currency (Rp) -> {{ item.harga | rupiah }}
  Vue.filter("rupiah", function (val) {
    return FormatHelper.rupiah(val);
  });

  // Filter Satuan: Menambahkan satuan (buah) -> {{ item.qty | satuanBuah }}
  Vue.filter("satuanBuah", function (val) {
    return FormatHelper.satuanBuah(val);
  });

  // Filter Tanggal: Format tanggal bulan tahun (25 Agustus 2025) -> {{ do.tanggalKirim | formatTanggal }}
  Vue.filter("formatTanggal", function (val) {
    return FormatHelper.tanggalIndo(val);
  });
}

/**
 * Data Service (ApiService) untuk menangani akses data JSON & LocalStorage
 */
var ApiService = {
  STORAGE_KEYS: {
    STOK: "sitta_stok_data_ut_v3",
    TRACKING: "sitta_tracking_data_ut_v3"
  },

  /**
   * Mengambil data dari /data/dataBahanAjar.json melalui Fetch API
   * dengan fallback ke DEFAULT_BAHAN_AJAR_DATA bila dibuka via file://
   */
  fetchDataBahanAjar: function () {
    return fetch("data/dataBahanAjar.json")
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Gagal memuat dataBahanAjar.json: " + response.status);
        }
        return response.json();
      })
      .catch(function (err) {
        console.info("Menggunakan fallback dataBahanAjar lokal:", err.message);
        return JSON.parse(JSON.stringify(DEFAULT_BAHAN_AJAR_DATA));
      });
  },

  /**
   * Memuat state lengkap (menggabungkan sumber JSON dengan perubahan di localStorage jika ada)
   */
  loadInitialState: function () {
    var self = this;
    return this.fetchDataBahanAjar().then(function (jsonData) {
      var data = JSON.parse(JSON.stringify(jsonData));

      // Cek apakah ada data stok tersimpan di LocalStorage
      try {
        var savedStok = localStorage.getItem(self.STORAGE_KEYS.STOK);
        if (savedStok) {
          var parsedStok = JSON.parse(savedStok);
          if (Array.isArray(parsedStok)) {
            data.stok = parsedStok;
          }
        }
      } catch (e) {
        console.warn("Gagal membaca localStorage stok:", e);
      }

      // Cek apakah ada data tracking tersimpan di LocalStorage
      try {
        var savedTracking = localStorage.getItem(self.STORAGE_KEYS.TRACKING);
        if (savedTracking) {
          var parsedTracking = JSON.parse(savedTracking);
          if (parsedTracking && typeof parsedTracking === "object") {
            data.tracking = parsedTracking;
          }
        }
      } catch (e) {
        console.warn("Gagal membaca localStorage tracking:", e);
      }

      return data;
    });
  },

  saveStok: function (stokList) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.STOK, JSON.stringify(stokList));
    } catch (e) {
      console.error("Gagal menyimpan stok:", e);
    }
  },

  saveTracking: function (trackingMap) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.TRACKING, JSON.stringify(trackingMap));
    } catch (e) {
      console.error("Gagal menyimpan tracking:", e);
    }
  },

  resetAllData: function () {
    localStorage.removeItem(this.STORAGE_KEYS.STOK);
    localStorage.removeItem(this.STORAGE_KEYS.TRACKING);
    return JSON.parse(JSON.stringify(DEFAULT_BAHAN_AJAR_DATA));
  }
};

window.FormatHelper = FormatHelper;
window.ApiService = ApiService;

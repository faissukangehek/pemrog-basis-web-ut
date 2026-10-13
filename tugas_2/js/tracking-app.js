/**
 * ============================================================================
 * SITTA Universitas Terbuka — Stok Bahan Ajar App (Vue.js)
 * Tugas Praktik 2: STSI4209 Sistem Informasi Tiras & Transaksi Bahan Ajar
 * Code By k1ll | Faiz
 * ============================================================================
 */

// Template Dummy Data Acuan Awal (berdasarkan dataBahanAjar.js)
var INITIAL_TRACKING_DATA = {
  "DO2025-0001": {
    nim: "123456789",
    nama: "Rina Wulandari",
    status: "Dalam Perjalanan",
    ekspedisi: "JNE",
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
    ekspedisi: "POS Indonesia",
    tanggalKirim: "2025-08-21",
    paket: "PAKET-UT-002",
    total: 140000,
    perjalanan: [
      { waktu: "2025-08-21 09:15:00", keterangan: "Penerimaan di Loket: PUSLABA UT" },
      { waktu: "2025-08-22 13:40:12", keterangan: "Tiba di Kantor Pos Surabaya" },
      { waktu: "2025-08-23 15:10:05", keterangan: "Paket telah diterima oleh Mahasiswa (Penerima: YBS)" }
    ]
  },
  "DO2025-0003": {
    nim: "049102941",
    nama: "Dewi Lestari",
    status: "Dikemas",
    ekspedisi: "JNE",
    tanggalKirim: "2025-08-28",
    paket: "PAKET-UT-001",
    total: 120000,
    perjalanan: [
      { waktu: "2025-08-28 08:30:00", keterangan: "Penerbitan Surat Jalan DO di Gudang Pusat" },
      { waktu: "2025-08-28 11:00:00", keterangan: "Bahan ajar sedang dipacking dalam kardus bersegel UT" }
    ]
  }
};

var INITIAL_PAKET_DATA = [
  { kode: "PAKET-UT-001", nama: "PAKET IPS Dasar", isi: ["EKMA4116","EKMA4115"], harga: 120000 },
  { kode: "PAKET-UT-002", nama: "PAKET IPA Dasar", isi: ["BIOL4201","FISIP4001"], harga: 140000 }
];

var INITIAL_PENGIRIMAN_DATA = [
  { kode: "REG", nama: "Reguler (3-5 hari)" },
  { kode: "EXP", nama: "Ekspres (1-2 hari)" }
];

var appTracking = new Vue({
  el: '#app',
  data: {
    // 0. User Autentikasi (Sesuai Data Pengguna SITTA UT)
    currentUser: {
      nama: "Rina Wulandari",
      role: "UPBJJ-UT",
      lokasi: "UPBJJ Jakarta"
    },

    // 1. Master Data
    pengirimanList: INITIAL_PENGIRIMAN_DATA,
    paketList: INITIAL_PAKET_DATA,
    trackingData: {},

    // 2. Pencarian State (v-model)
    inputNoDO: '',
    searchError: '',
    activeNoDO: '',
    currentDO: null,
    notFound: false,

    // 3. UI Toggles
    sidebarOpen: false,
    showFormDO: false,
    showFormCheckpoint: false,
    toastMessage: '',
    toastTimer: null,

    // 4. Form Tambah DO Baru
    formDO: {
      noDO: '',
      nim: '',
      nama: '',
      ekspedisi: 'JNE',
      jenisLayanan: 'REG',
      paket: 'PAKET-UT-001',
      tanggalKirim: '',
      total: 120000
    },
    formDOErrors: [],

    // 5. Form Tambah Checkpoint Riwayat Perjalanan
    formCheckpoint: {
      status: 'Dalam Perjalanan',
      waktu: '',
      keterangan: ''
    },
    checkpointErrors: [],

    // 6. Watcher Activity Log State
    doWatcherLog: 'Memantau input nomor Delivery Order...',
    statusWatcherLog: '',

    // 7. Modal Alert / Konfirmasi Pengganti alert() & confirm()
    modal: {
      show: false,
      title: 'Informasi',
      message: '',
      type: 'info',
      confirmLabel: 'Tutup',
      cancelLabel: 'Batal',
      onConfirm: null
    }
  },

  created: function() {
    this.loadUser();
    this.loadData();
    // Default tanggal hari ini untuk form
    var today = new Date().toISOString().split('T')[0];
    this.formDO.tanggalKirim = today;
  },

  computed: {
    /**
     * Computed Property 1: Daftar Nomor DO yang terdaftar
     */
    listNomorDO: function() {
      return Object.keys(this.trackingData);
    },

    /**
     * Computed Property 2: Total Delivery Order di sistem
     */
    totalDORegistrasi: function() {
      return this.listNomorDO.length;
    },

    /**
     * Computed Property 3: Menghitung persentase dan indeks stepper progress
     * 1 = Dikemas (25%), 2 = Dalam Perjalanan (65%), 3 = Selesai/Diterima (100%)
     */
    stepProgress: function() {
      if (!this.currentDO) return 0;
      var status = (this.currentDO.status || '').toLowerCase();
      if (status.includes('diterima') || status.includes('selesai')) {
        return 3;
      } else if (status.includes('perjalanan') || status.includes('kirim')) {
        return 2;
      } else {
        return 1;
      }
    },

    /**
     * Computed Property 4: Mencari rincian isi paket modul bahan ajar
     */
    detailPaket: function() {
      if (!this.currentDO) return null;
      var self = this;
      var p = this.paketList.find(function(item) {
        return item.kode === self.currentDO.paket;
      });
      return p || { nama: this.currentDO.paket, isi: [], harga: this.currentDO.total };
    },

    /**
     * Computed Property 5: Format Rupiah untuk total pembayaran DO saat ini
     */
    formattedTotal: function() {
      if (!this.currentDO) return "Rp 0";
      return this.formatRupiah(this.currentDO.total);
    },

    /**
     * Computed Property 6: Status Ringkasan teks untuk direktif v-text
     */
    summaryTrackingText: function() {
      if (!this.currentDO) return "Silakan masukkan nomor Delivery Order untuk melacak.";
      return "Status Terkini: " + this.currentDO.status + " • Nomor DO: " + this.activeNoDO;
    }
  },

  watch: {
    /**
     * WATCHER 1: Memantau input nomor DO (inputNoDO)
     * Otomatis mengkapitalisasi input (uppercase), membuang spasi,
     * memvalidasi hanya huruf dan angka (tanpa simbol),
     * serta mencatat log watcher secara interaktif
     */
    inputNoDO: function(newVal, oldVal) {
      if (typeof newVal === 'string') {
        var cleanVal = newVal.replace(/\s+/g, '').toUpperCase();
        if (cleanVal !== newVal) {
          this.inputNoDO = cleanVal;
        }

        if (cleanVal.trim() === '') {
          this.searchError = '';
          this.doWatcherLog = 'Input nomor DO kosong. Masukkan huruf dan angka (contoh: DO20250001)';
        } else if (/[^A-Z0-9]/.test(cleanVal)) {
          // Terdeteksi karakter simbol
          this.searchError = 'Hanya huruf dan angka yang diperbolehkan (tanpa simbol).';
          this.doWatcherLog = 'Peringatan Watcher: Terdeteksi simbol tidak diizinkan pada input!';
        } else {
          this.searchError = '';
          this.doWatcherLog = 'Input valid: "' + cleanVal + '" (' + cleanVal.length + ' karakter alfanumerik)';
        }
      }
    },

    /**
     * WATCHER 2: Memantau perubahan status DO pada objek currentDO (currentDO.status)
     * Memberikan toast notification dan log saat status pengiriman berubah
     */
    'currentDO.status': function(newStatus, oldStatus) {
      if (oldStatus && newStatus && newStatus !== oldStatus) {
        this.statusWatcherLog = 'Status pengiriman berubah dari [' + oldStatus + '] menjadi [' + newStatus + ']';
        this.showToast('Pembaruan Status: ' + newStatus);
      }
    },

    /**
     * WATCHER 3: Memantau perubahan data trackingData (Deep Watcher)
     * Secara otomatis menyinkronkan data terbaru ke LocalStorage
     */
    trackingData: {
      handler: function(newData) {
        try {
          localStorage.setItem('sitta_tracking_data_ut', JSON.stringify(newData));
        } catch (e) {
          console.error("Gagal menyimpan tracking ke localStorage:", e);
        }
      },
      deep: true
    }
  },

  methods: {
    /**
     * Memuat sesi akun pengguna dari localStorage (Data Pengguna SITTA UT)
     * Wajib login terlebih dahulu, jika belum maka redirect ke index.html
     */
    loadUser: function() {
      try {
        var u = JSON.parse(localStorage.getItem('sitta_user'));
        if (u && u.nama) {
          this.currentUser = u;
          return;
        }
      } catch (e) {
        console.warn("Gagal membaca auth user:", e);
      }
      // Wajib auth: jika belum login, tendang ke index.html
      window.location.replace('index.html');
    },

    /**
     * Buka Modal Pop-up Custom (Pengganti alert() & confirm() bawaan)
     */
    bukaModal: function(opsi) {
      this.modal.title = opsi.title || 'Informasi';
      this.modal.message = opsi.message || '';
      this.modal.type = opsi.type || 'info';
      this.modal.confirmLabel = opsi.confirmLabel || (opsi.onConfirm ? 'Ya, Lanjutkan' : 'Tutup');
      this.modal.cancelLabel = opsi.cancelLabel || 'Batal';
      this.modal.onConfirm = opsi.onConfirm || null;
      this.modal.show = true;
    },

    /**
     * Tutup Modal Pop-up
     */
    tutupModal: function() {
      this.modal.show = false;
      this.modal.onConfirm = null;
    },

    /**
     * Jalankan aksi konfirmasi dari modal lalu tutup modal
     */
    eksekusiKonfirmasiModal: function() {
      var fn = this.modal.onConfirm;
      this.tutupModal();
      if (typeof fn === 'function') {
        fn();
      }
    },

    /**
     * Logout akun pengguna dengan konfirmasi modal
     */
    logout: function() {
      var namaUser = this.currentUser ? this.currentUser.nama : 'Pengguna';
      this.bukaModal({
        title: 'Konfirmasi Keluar',
        message: 'Apakah Anda yakin ingin keluar dari akun ' + namaUser + '?',
        type: 'warning',
        confirmLabel: 'Ya, Keluar',
        cancelLabel: 'Batal',
        onConfirm: function() {
          localStorage.removeItem('sitta_user');
          window.location.replace('index.html');
        }
      });
    },

    /**
     * Buka/Tutup Sidebar Menu Responsif Mobile
     */
    toggleSidebar: function() {
      this.sidebarOpen = !this.sidebarOpen;
    },

    /**
     * Tutup Sidebar Menu Responsif
     */
    closeSidebar: function() {
      this.sidebarOpen = false;
    },

    /**
     * Memuat data tracking dari LocalStorage atau default template
     */
    loadData: function() {
      try {
        var saved = localStorage.getItem('sitta_tracking_data_ut');
        if (saved) {
          this.trackingData = JSON.parse(saved);
          return;
        }
      } catch (e) {
        console.warn("Menggunakan data default awal tracking:", e);
      }
      this.trackingData = JSON.parse(JSON.stringify(INITIAL_TRACKING_DATA));
    },

    /**
     * Format Angka ke Rupiah Indonesia
     */
    formatRupiah: function(nominal) {
      var n = Number(nominal) || 0;
      return "Rp " + n.toLocaleString("id-ID");
    },

    /**
     * Mencari nomor Delivery Order secara manual
     * Dilengkapi validasi alfanumerik ketat (simbol dilarang)
     */
    cariDO: function() {
      var query = (this.inputNoDO || '').trim().toUpperCase();
      if (!query) {
        this.bukaModal({
          title: 'Nomor DO Belum Diisi',
          message: 'Silakan masukkan nomor Delivery Order (DO) yang ingin Anda lacak.',
          type: 'warning',
          confirmLabel: 'Mengerti'
        });
        return;
      }

      // Validasi: Tidak boleh memasukkan simbol, hanya huruf dan angka
      if (/[^A-Z0-9]/.test(query)) {
        this.searchError = 'Hanya huruf dan angka yang diperbolehkan (tanpa simbol).';
        this.bukaModal({
          title: 'Format Tidak Valid',
          message: 'Nomor pengiriman tidak boleh mengandung simbol. Hanya huruf dan angka yang diperbolehkan (contoh: DO20250001).',
          type: 'error',
          confirmLabel: 'Perbaiki'
        });
        return;
      }

      this.searchError = '';

      // Pencarian fleksibel: cocokkan dengan key asli atau key alfanumerik tanpa pemisah
      var cleanQuery = query.replace(/[^A-Z0-9]/g, '');
      var foundKey = null;

      var keys = Object.keys(this.trackingData);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (k.toUpperCase() === query || k.replace(/[^A-Z0-9]/g, '').toUpperCase() === cleanQuery) {
          foundKey = k;
          break;
        }
      }

      if (foundKey && this.trackingData[foundKey]) {
        this.activeNoDO = foundKey;
        this.currentDO = this.trackingData[foundKey];
        this.notFound = false;
        this.showToast("Data pengiriman " + foundKey + " ditemukan.");
      } else {
        this.activeNoDO = query;
        this.currentDO = null;
        this.notFound = true;
      }
    },

    /**
     * Quick Select Nomor DO dari Chip / Daftar
     */
    pilihDO: function(noDO) {
      this.inputNoDO = noDO;
      this.cariDO();
    },

    /**
     * Toggle Form Buat DO Baru
     */
    toggleFormDO: function() {
      this.showFormDO = !this.showFormDO;
      if (this.showFormDO) {
        // Generate nomor DO otomatis berikutnya
        var nextId = "DO2025-000" + (this.listNomorDO.length + 1);
        this.formDO.noDO = nextId;
        this.formDOErrors = [];
      }
    },

    /**
     * Handler saat memilih paket di form baru (update total biaya otomatis)
     */
    onPaketChange: function() {
      var self = this;
      var p = this.paketList.find(function(item) {
        return item.kode === self.formDO.paket;
      });
      if (p) {
        this.formDO.total = p.harga;
      }
    },

    /**
     * Menyimpan Delivery Order Baru
     */
    simpanDOBaru: function() {
      this.formDOErrors = [];

      var no = (this.formDO.noDO || '').trim().toUpperCase();
      if (!no) {
        this.formDOErrors.push("Nomor Delivery Order (DO) wajib diisi.");
      } else if (this.trackingData[no]) {
        this.formDOErrors.push("Nomor DO '" + no + "' sudah terdaftar.");
      }

      if (!this.formDO.nim || this.formDO.nim.trim() === '') {
        this.formDOErrors.push("NIM Mahasiswa wajib diisi.");
      }

      if (!this.formDO.nama || this.formDO.nama.trim() === '') {
        this.formDOErrors.push("Nama Penerima / Mahasiswa wajib diisi.");
      }

      if (!this.formDO.tanggalKirim) {
        this.formDOErrors.push("Tanggal pengiriman wajib ditentukan.");
      }

      if (this.formDOErrors.length > 0) {
        return;
      }

      var nowStr = new Date().toLocaleString("id-ID");
      var doBaru = {
        nim: this.formDO.nim.trim(),
        nama: this.formDO.nama.trim(),
        status: "Dikemas",
        ekspedisi: this.formDO.ekspedisi,
        tanggalKirim: this.formDO.tanggalKirim,
        paket: this.formDO.paket,
        total: Number(this.formDO.total),
        perjalanan: [
          {
            waktu: this.formDO.tanggalKirim + " 08:30:00",
            keterangan: "Penerbitan DO di Loket Puslaba UT untuk NIM " + this.formDO.nim.trim()
          }
        ]
      };

      // Simpan ke reactive object trackingData
      Vue.set(this.trackingData, no, doBaru);

      this.showToast("DO baru " + no + " berhasil diterbitkan!");
      this.showFormDO = false;
      this.pilihDO(no);
    },

    /**
     * Toggle Form Tambah Checkpoint Perjalanan
     */
    toggleFormCheckpoint: function() {
      this.showFormCheckpoint = !this.showFormCheckpoint;
      if (this.showFormCheckpoint && this.currentDO) {
        this.formCheckpoint.status = this.currentDO.status;
        var now = new Date();
        var y = now.getFullYear();
        var m = String(now.getMonth() + 1).padStart(2, '0');
        var d = String(now.getDate()).padStart(2, '0');
        var hh = String(now.getHours()).padStart(2, '0');
        var mm = String(now.getMinutes()).padStart(2, '0');
        var ss = String(now.getSeconds()).padStart(2, '0');
        this.formCheckpoint.waktu = y + "-" + m + "-" + d + " " + hh + ":" + mm + ":" + ss;
        this.formCheckpoint.keterangan = "";
        this.checkpointErrors = [];
      }
    },

    /**
     * Menambahkan Titik Checkpoint Baru dan Memperbarui Status
     */
    tambahCheckpoint: function() {
      this.checkpointErrors = [];
      if (!this.formCheckpoint.keterangan || this.formCheckpoint.keterangan.trim() === '') {
        this.checkpointErrors.push("Keterangan lokasi/posisi checkpoint wajib diisi.");
        return;
      }

      if (!this.currentDO) return;

      var entry = {
        waktu: this.formCheckpoint.waktu || new Date().toLocaleString("id-ID"),
        keterangan: this.formCheckpoint.keterangan.trim()
      };

      this.currentDO.perjalanan.push(entry);
      this.currentDO.status = this.formCheckpoint.status;

      this.showToast("Riwayat perjalanan DO berhasil diperbarui.");
      this.showFormCheckpoint = false;
    },

    /**
     * Pulihkan seluruh data tracking DO ke template acuan awal
     */
    resetDataDefault: function() {
      var self = this;
      this.bukaModal({
        title: 'Pulihkan Data Pengiriman',
        message: 'Apakah Anda ingin mengembalikan seluruh data Delivery Order (DO) ke data awal acuan Puslaba UT?',
        type: 'warning',
        confirmLabel: 'Ya, Pulihkan Data',
        cancelLabel: 'Batal',
        onConfirm: function() {
          self.trackingData = JSON.parse(JSON.stringify(INITIAL_TRACKING_DATA));
          localStorage.setItem('sitta_tracking_data_ut', JSON.stringify(INITIAL_TRACKING_DATA));
          self.pilihDO('DO2025-0001');
          self.showToast("Data tracking Delivery Order berhasil dipulihkan!");
        }
      });
    },

    /**
     * Notifikasi Toast Melayang
     */
    showToast: function(pesan) {
      var self = this;
      this.toastMessage = pesan;
      if (this.toastTimer) {
        clearTimeout(this.toastTimer);
      }
      this.toastTimer = setTimeout(function() {
        self.toastMessage = '';
      }, 3500);
    }
  }
});

/**
 * ============================================================================
 * SITTA Universitas Terbuka — Root Vue Instance (js/app.js)
 * Tugas Praktik 3: STSI4209 Sistem Informasi Tiras & Transaksi Bahan Ajar
 * Code By k1ll | Faiz
 * ============================================================================
 */

var AUTH_KEY = "sitta_user";
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getGreeting(date) {
  var h = date.getHours();
  if (h < 11) return "pagi";
  if (h < 15) return "siang";
  if (h < 18) return "sore";
  return "malam";
}

function getSavedUser() {
  try {
    var u = JSON.parse(localStorage.getItem(AUTH_KEY));
    if (u && u.nama) return u;
  } catch (e) {
    return null;
  }
  return null;
}

var app = new Vue({
  el: "#app",
  data: {
    // Navigasi Tab Root: 'beranda' | 'stok' | 'tracking' | 'order'
    tab: "beranda",
    sidebarOpen: false,

    // State Autentikasi Pengguna SITTA (Wajib Login terlebih dahulu bila belum ada sesi)
    isLoggedIn: !!getSavedUser(),
    currentUser: getSavedUser() || null,

    // State Form Login & Validasi per Field (Sesuai Logika Asli)
    loginForm: {
      email: "",
      password: "",
      errEmail: "",
      errPassword: ""
    },

    // State Modal Lupa Password & Modal Daftar Akun UPBJJ-UT
    showModalLupa: false,
    emailLupa: "",
    errEmailLupa: "",
    showModalDaftar: false,

    // Informasi Tanggal Hari Ini untuk Beranda
    todayLabel: new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }),

    // State Data Utama (Diambil dari data/dataBahanAjar.json via ApiService)
    state: {
      upbjjList: DEFAULT_BAHAN_AJAR_DATA.upbjjList.slice(),
      kategoriList: DEFAULT_BAHAN_AJAR_DATA.kategoriList.slice(),
      pengirimanList: JSON.parse(JSON.stringify(DEFAULT_BAHAN_AJAR_DATA.pengirimanList)),
      paket: JSON.parse(JSON.stringify(DEFAULT_BAHAN_AJAR_DATA.paket)),
      stok: JSON.parse(JSON.stringify(DEFAULT_BAHAN_AJAR_DATA.stok)),
      tracking: JSON.parse(JSON.stringify(DEFAULT_BAHAN_AJAR_DATA.tracking))
    },

    // Feedback Toast
    toastMessage: "",
    toastTimer: null
  },

  created: function () {
    var self = this;

    // Ambil data dari /data/dataBahanAjar.json melalui service api.js
    ApiService.loadInitialState().then(function (data) {
      self.state.upbjjList = data.upbjjList || [];
      self.state.kategoriList = data.kategoriList || [];
      self.state.pengirimanList = data.pengirimanList || [];
      self.state.paket = data.paket || [];
      self.state.stok = data.stok || [];
      self.state.tracking = data.tracking || {};
    });
  },

  computed: {
    greeting: function () {
      var namaDepan =
        this.currentUser && this.currentUser.nama
          ? this.currentUser.nama.split(" ")[0]
          : "Pengguna";
      return "Selamat " + getGreeting(new Date()) + ", " + namaDepan + "!";
    },

    pageTitle: function () {
      if (this.tab === "beranda") return this.greeting;
      if (this.tab === "stok") return "Informasi Stok Bahan Ajar";
      if (this.tab === "tracking") return "Tracking Pengiriman";
      if (this.tab === "order") return "Pemesanan / Input Delivery Order Baru";
      return "SITTA Universitas Terbuka";
    },

    pageSubtitle: function () {
      if (this.tab === "beranda") return this.todayLabel;
      if (this.tab === "stok") {
        return "Kelola inventaris stok bahan ajar seluruh UT-Daerah, filter kategori dependent, dan status safety stock.";
      }
      if (this.tab === "tracking") {
        return "Lacak posisi pengiriman Delivery Order bahan ajar berdasarkan Nomor DO atau NIM.";
      }
      if (this.tab === "order") {
        return "Buat Delivery Order (DO) baru untuk pengiriman paket bahan ajar mahasiswa.";
      }
      return "";
    }
  },

  watch: {
    /**
     * Deep Watcher 1: Menyimpan perubahan daftar stok ke LocalStorage secara otomatis
     */
    "state.stok": {
      handler: function (newStok) {
        ApiService.saveStok(newStok);
      },
      deep: true
    },

    /**
     * Deep Watcher 2: Menyimpan perubahan data tracking DO ke LocalStorage secara otomatis
     */
    "state.tracking": {
      handler: function (newTracking) {
        ApiService.saveTracking(newTracking);
      },
      deep: true
    }
  },

  methods: {
    setTab: function (targetTab) {
      this.tab = targetTab;
      this.sidebarOpen = false;
    },

    toggleSidebar: function () {
      this.sidebarOpen = !this.sidebarOpen;
    },

    closeSidebar: function () {
      this.sidebarOpen = false;
    },

    /**
     * Handler saat komponen <order-form> menerbitkan DO baru (@created="handleNewDO")
     */
    handleNewDO: function (payload) {
      if (!payload || !payload.noDO) return;
      Vue.set(this.state.tracking, payload.noDO, payload.data);
      this.showToast("Delivery Order baru " + payload.noDO + " berhasil ditambahkan!");
      this.tab = "tracking";

      var self = this;
      this.$nextTick(function () {
        if (self.$refs.trackingComp && typeof self.$refs.trackingComp.pilihDO === "function") {
          self.$refs.trackingComp.pilihDO(payload.noDO);
        }
      });
    },

    /**
     * Membuka komponen <app-modal ref="modal">
     */
    openModal: function (options) {
      if (this.$refs.modal && typeof this.$refs.modal.open === "function") {
        this.$refs.modal.open(options);
      }
    },

    /**
     * Mereset seluruh data stok dan tracking ke kondisi awal dataBahanAjar.json
     */
    resetAllData: function () {
      var self = this;
      this.openModal({
        title: "Pulihkan Data Awal (Reset JSON)",
        message:
          "Apakah Anda yakin ingin mengembalikan seluruh data Stok dan Tracking DO ke data awal dari dataBahanAjar.json?",
        type: "warning",
        confirmLabel: "Ya, Pulihkan Data",
        cancelLabel: "Batal",
        onConfirm: function () {
          var fresh = ApiService.resetAllData();
          self.state.stok = fresh.stok;
          self.state.tracking = fresh.tracking;
          self.showToast("Seluruh data berhasil dipulihkan ke data awal JSON.");
        }
      });
    },

    /**
     * Menampilkan notifikasi toast
     */
    showToast: function (msg) {
      var self = this;
      this.toastMessage = msg;
      if (this.toastTimer) {
        clearTimeout(this.toastTimer);
      }
      this.toastTimer = setTimeout(function () {
        self.toastMessage = "";
      }, 3500);
    },

    /* ========================================================================
       LOGIKA LOGIN, LUPA PASSWORD, DAFTAR AKUN, & LOGOUT ASLI
       ======================================================================== */
    submitLogin: function () {
      var self = this;
      var email = (this.loginForm.email || "").trim();
      var pass = this.loginForm.password || "";
      var ok = true;

      if (!email) {
        this.loginForm.errEmail = "Email wajib diisi.";
        ok = false;
      } else if (!EMAIL_RE.test(email)) {
        this.loginForm.errEmail = "Format email tidak valid.";
        ok = false;
      } else {
        this.loginForm.errEmail = "";
      }

      if (!pass) {
        this.loginForm.errPassword = "Password wajib diisi.";
        ok = false;
      } else {
        this.loginForm.errPassword = "";
      }

      if (!ok) return;

      // Pencocokan akun dengan dataPengguna di js/data.js
      var user = (typeof dataPengguna !== "undefined" ? dataPengguna : []).find(function (u) {
        return u.email === email && u.password === pass;
      });

      if (!user) {
        this.openModal({
          title: "Login Gagal",
          message: "Email atau kata sandi yang Anda masukkan salah. Silakan coba kembali.",
          type: "danger",
          confirmLabel: "Tutup"
        });
        return;
      }

      // Simpan sesi login aman ke localStorage tanpa menyimpan password mentah
      var aman = {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        lokasi: user.lokasi
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(aman));

      this.openModal({
        title: "Login Berhasil",
        message: "Selamat datang, " + user.nama + ". Anda akan diarahkan ke dashboard.",
        type: "info",
        confirmLabel: "Lanjutkan"
      });

      setTimeout(function () {
        if (self.$refs.modal) {
          self.$refs.modal.close();
        }
        self.currentUser = aman;
        self.isLoggedIn = true;
        self.tab = "beranda";
      }, 900);
    },

    bukaModalLupa: function () {
      this.emailLupa = "";
      this.errEmailLupa = "";
      this.showModalLupa = true;
    },

    tutupModalLupa: function () {
      this.showModalLupa = false;
      this.errEmailLupa = "";
    },

    submitLupaPassword: function () {
      var email = (this.emailLupa || "").trim();

      if (!email) {
        this.errEmailLupa = "Email wajib diisi.";
        return;
      }

      if (!EMAIL_RE.test(email)) {
        this.errEmailLupa = "Format email tidak valid.";
        return;
      }

      var terdaftar = (typeof dataPengguna !== "undefined" ? dataPengguna : []).some(function (u) {
        return u.email === email;
      });

      if (!terdaftar) {
        this.errEmailLupa = "Email tidak terdaftar.";
        return;
      }

      this.errEmailLupa = "";
      this.showModalLupa = false;
      this.emailLupa = "";

      this.openModal({
        title: "Lupa Password",
        message: "Permintaan atur ulang kata sandi telah dikirim ke " + email,
        type: "info",
        confirmLabel: "Tutup"
      });
    },

    bukaModalDaftar: function () {
      this.showModalDaftar = true;
    },

    tutupModalDaftar: function () {
      this.showModalDaftar = false;
    },

    /**
     * Logout akun pengguna dengan konfirmasi modal
     */
    logout: function () {
      var self = this;
      var namaUser = this.currentUser ? this.currentUser.nama : "Pengguna";
      this.openModal({
        title: "Konfirmasi Keluar",
        message: "Apakah Anda yakin ingin keluar dari akun " + namaUser + "?",
        type: "warning",
        confirmLabel: "Ya, Keluar",
        cancelLabel: "Batal",
        onConfirm: function () {
          localStorage.removeItem(AUTH_KEY);
          self.currentUser = null;
          self.isLoggedIn = false;
          self.loginForm.email = "";
          self.loginForm.password = "";
          self.loginForm.errEmail = "";
          self.loginForm.errPassword = "";
        }
      });
    }
  }
});

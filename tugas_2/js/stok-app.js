/**
 * ============================================================================
 * SITTA Universitas Terbuka — Stok Bahan Ajar App (Vue.js)
 * Tugas Praktik 2: STSI4209 Sistem Informasi Tiras & Transaksi Bahan Ajar
 * Code By k1ll | Faiz
 * ============================================================================
 */

var INITIAL_STOK_DATA = [
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
  }
];

var appStok = new Vue({
  el: '#app',
  data: {
    // 0. User Autentikasi (Sesuai Data Pengguna SITTA UT)
    currentUser: {
      nama: "Rina Wulandari",
      role: "UPBJJ-UT",
      lokasi: "UPBJJ Jakarta"
    },

    // 1. Data Koleksi & Master
    upbjjList: ["Jakarta", "Surabaya", "Makassar", "Padang", "Denpasar"],
    kategoriList: ["MK Wajib", "MK Pilihan", "Praktikum", "Problem-Based"],
    stok: [],

    // 2. Data Filtering & Pencarian (v-model)
    searchQuery: '',
    filterKategori: '',
    filterUpbjj: '',
    filterStatus: '',
    sortBy: 'kode',
    sortOrder: 'asc',

    // 3. UI Control State
    sidebarOpen: false,
    showForm: false,
    isEdit: false,
    editIndex: -1,
    toastMessage: '',
    toastTimer: null,

    // 4. Form Model & Validation
    formData: {
      kode: '',
      judul: '',
      kategori: 'MK Wajib',
      upbjj: 'Jakarta',
      lokasiRak: '',
      harga: 50000,
      qty: 10,
      safety: 15,
      catatanHTML: ''
    },
    formErrors: [],

    // 5. State Hasil Watchers (untuk feedback visual mahasiswa/dosen)
    searchWatcherLog: 'Siap melakukan pencarian...',
    kategoriWatcherLog: '',
    qtySafetyAdvice: '',
    qtySafetyStatus: '',

    // 6. Modal Alert / Konfirmasi Pengganti alert() & confirm()
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
  },

  computed: {
    /**
     * Computed Property 1: Menyaring daftar stok secara multi-kriteria
     * (Pencarian teks, Filter Kategori, Filter UPBJJ, Filter Status Persediaan)
     */
    filteredStok: function() {
      var self = this;
      var hasil = this.stok.filter(function(item) {
        // Filter Kata Kunci (Kode, Judul, atau Lokasi Rak)
        var matchQuery = true;
        if (self.searchQuery.trim() !== '') {
          var q = self.searchQuery.toLowerCase();
          matchQuery = item.kode.toLowerCase().includes(q) ||
                       item.judul.toLowerCase().includes(q) ||
                       item.lokasiRak.toLowerCase().includes(q);
        }

        // Filter Kategori
        var matchKategori = true;
        if (self.filterKategori !== '') {
          matchKategori = item.kategori === self.filterKategori;
        }

        // Filter UPBJJ
        var matchUpbjj = true;
        if (self.filterUpbjj !== '') {
          matchUpbjj = item.upbjj === self.filterUpbjj;
        }

        // Filter Status Stok (Aman / Kritis / Habis)
        var matchStatus = true;
        if (self.filterStatus === 'habis') {
          matchStatus = Number(item.qty) <= 0;
        } else if (self.filterStatus === 'kritis') {
          matchStatus = Number(item.qty) > 0 && Number(item.qty) < Number(item.safety);
        } else if (self.filterStatus === 'aman') {
          matchStatus = Number(item.qty) >= Number(item.safety);
        }

        return matchQuery && matchKategori && matchUpbjj && matchStatus;
      });

      // Sorting
      hasil.sort(function(a, b) {
        var modifier = self.sortOrder === 'desc' ? -1 : 1;
        if (self.sortBy === 'harga' || self.sortBy === 'qty' || self.sortBy === 'safety') {
          return (Number(a[self.sortBy]) - Number(b[self.sortBy])) * modifier;
        }
        return a[self.sortBy].localeCompare(b[self.sortBy]) * modifier;
      });

      return hasil;
    },

    /**
     * Computed Property 2: Menghitung total judul buku yang ada
     */
    totalJudul: function() {
      return this.stok.length;
    },

    /**
     * Computed Property 3: Menghitung akumulasi jumlah eksemplar fisik
     */
    totalEksemplar: function() {
      return this.stok.reduce(function(total, item) {
        return total + Number(item.qty || 0);
      }, 0);
    },

    /**
     * Computed Property 4: Menghitung total valuasi nilai aset persediaan
     */
    totalNilaiAset: function() {
      return this.stok.reduce(function(total, item) {
        return total + (Number(item.qty || 0) * Number(item.harga || 0));
      }, 0);
    },

    /**
     * Computed Property 5: Daftar bahan ajar yang menipis di bawah safety stock
     */
    stokKritisList: function() {
      return this.stok.filter(function(item) {
        return Number(item.qty) < Number(item.safety);
      });
    },

    /**
     * Computed Property 6: Jumlah judul bahan ajar yang kritis
     */
    stokKritisCount: function() {
      return this.stokKritisList.length;
    },

    /**
     * Computed Property 7: Status ringkasan teks untuk direktif v-text
     */
    summaryInfoText: function() {
      return "Menampilkan " + this.filteredStok.length + " dari total " + this.totalJudul + " judul bahan ajar UT.";
    },

    /**
     * Computed Property 8: Pratinjau langsung format HTML yang aman (Live Preview v-html)
     */
    previewCatatan: function() {
      var text = this.formData.catatanHTML ? this.formData.catatanHTML.trim() : '';
      if (!text) {
        return '<span style="color: var(--myut-gray-text); font-style: italic;">(belum ada format catatan)</span>';
      }
      return this.sanitizeHTML(text);
    }
  },

  watch: {
    /**
     * WATCHER 1: Memantau perubahan kata kunci pencarian (searchQuery)
     * Memberikan log aktivitas pencarian secara responsif ke antarmuka
     */
    searchQuery: function(newVal, oldVal) {
      if (newVal.trim() === '') {
        this.searchWatcherLog = 'Pencarian direset. Menampilkan semua persediaan.';
      } else {
        this.searchWatcherLog = 'Mencari kata kunci: "' + newVal + '" (' + this.filteredStok.length + ' modul ditemukan)';
      }
    },

    /**
     * WATCHER 2: Memantau perubahan filter dropdown kategori (filterKategori)
     * Memberikan toast notifikasi saat filter kategori diaktifkan
     */
    filterKategori: function(newVal, oldVal) {
      if (newVal !== '') {
        this.kategoriWatcherLog = 'Filter Kategori aktif: ' + newVal;
        this.showToast('Menampilkan bahan ajar kategori: ' + newVal);
      } else {
        this.kategoriWatcherLog = 'Semua kategori ditampilkan.';
      }
    },

    /**
     * WATCHER 3: Memantau input Jumlah Stok (formData.qty) secara real-time
     * Membandingkan nilai Qty terhadap batas Safety Stock dan memberikan rekomendasi otomatis
     */
    'formData.qty': function(newQty) {
      var qty = Number(newQty);
      var safety = Number(this.formData.safety);
      if (isNaN(qty) || qty <= 0) {
        this.qtySafetyStatus = 'warn';
        this.qtySafetyAdvice = 'Peringatan: Stok habis atau nol. Harus segera dipesan!';
      } else if (qty < safety) {
        this.qtySafetyStatus = 'warn';
        this.qtySafetyAdvice = 'Peringatan: Jumlah stok (' + qty + ') di bawah batas safety stock (' + safety + '). Prioritas reorder!';
      } else {
        this.qtySafetyStatus = 'safe';
        this.qtySafetyAdvice = 'Aman: Jumlah stok memenuhi batas aman persediaan (' + safety + ').';
      }
    },

    /**
     * WATCHER 4: Memantau perubahan array data stok (Deep Watcher)
     * Menyimpan setiap perubahan secara otomatis ke LocalStorage
     */
    stok: {
      handler: function(newStokList) {
        try {
          localStorage.setItem('sitta_stok_data_ut', JSON.stringify(newStokList));
        } catch (e) {
          console.error("Gagal menyimpan ke localStorage:", e);
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
     * Sanitasi HTML Khusus (XSS Prevention)
     * Hanya mengizinkan whitelist tag format teks: <p>, <em>, <i>, <u>, <strong>, <b>, <small>
     * Menghapus seluruh atribut (onclick, onerror, onload, style, href, dll)
     * Menjamin bebas eksekusi JavaScript sebelum dirender via v-html
     */
    sanitizeHTML: function(rawHtml) {
      if (!rawHtml || typeof rawHtml !== 'string') return '';

      // Hapus script, style, dan komentar HTML
      var cleanStr = rawHtml
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '');

      var allowedTags = ['P', 'EM', 'I', 'U', 'STRONG', 'B', 'SMALL'];

      if (typeof DOMParser !== 'undefined') {
        try {
          var parser = new DOMParser();
          var doc = parser.parseFromString(cleanStr, 'text/html');

          var walk = function(node) {
            var children = Array.prototype.slice.call(node.childNodes);
            for (var i = 0; i < children.length; i++) {
              var child = children[i];
              if (child.nodeType === 1) { // ELEMENT_NODE
                var tag = child.tagName.toUpperCase();
                if (allowedTags.indexOf(tag) === -1) {
                  // Tag di luar whitelist: konversi menjadi text node aman
                  var textNode = doc.createTextNode(child.textContent || '');
                  node.replaceChild(textNode, child);
                } else {
                  // Tag diizinkan: bersihkan SEMUA atribut (cegah XSS event handler)
                  while (child.attributes && child.attributes.length > 0) {
                    child.removeAttribute(child.attributes[0].name);
                  }
                  walk(child);
                }
              }
            }
          };

          walk(doc.body);
          return doc.body.innerHTML;
        } catch (e) {
          console.warn("DOMParser sanitasi error, fallback ke regex:", e);
        }
      }

      // Fallback regex jika DOMParser tidak tersedia
      return cleanStr.replace(/<(\/?)(\w+)([^>]*)>/gi, function(match, slash, tag) {
        var lower = tag.toLowerCase();
        if (['p', 'em', 'i', 'u', 'strong', 'b', 'small'].indexOf(lower) !== -1) {
          return '<' + slash + lower + '>';
        }
        return '';
      });
    },

    /**
     * Terapkan tag HTML format teks ke catatan (Format Toolbar Button)
     * Membungkus teks yang diseleksi atau menyisipkan template tag bila kursor belum memilih teks
     */
    applyTag: function(tag) {
      var input = this.$refs.catatanInput;
      var text = this.formData.catatanHTML || '';
      var openTag = '<' + tag + '>';
      var closeTag = '</' + tag + '>';

      if (!input) {
        this.formData.catatanHTML = text + (text ? ' ' : '') + openTag + 'teks' + closeTag;
        return;
      }

      var start = (typeof input.selectionStart === 'number') ? input.selectionStart : text.length;
      var end = (typeof input.selectionEnd === 'number') ? input.selectionEnd : text.length;
      var selected = text.substring(start, end);

      var replacement = '';
      if (selected.length > 0) {
        // Bungkus teks yang diblok
        replacement = openTag + selected + closeTag;
      } else {
        // Sisipkan contoh teks terformat
        var samples = {
          'strong': 'teks tebal',
          'em': 'teks miring',
          'u': 'teks garis bawah',
          'p': 'paragraf baru'
        };
        replacement = openTag + (samples[tag] || 'teks') + closeTag;
      }

      var newText = text.substring(0, start) + replacement + text.substring(end);
      this.formData.catatanHTML = newText;

      this.$nextTick(function() {
        if (input && typeof input.focus === 'function') {
          input.focus();
          var newPos = start + replacement.length;
          if (typeof input.setSelectionRange === 'function') {
            input.setSelectionRange(newPos, newPos);
          }
        }
      });
    },

    /**
     * Bersihkan seluruh tag format HTML dari catatan khusus
     */
    clearFormatting: function() {
      if (!this.formData.catatanHTML) return;
      this.formData.catatanHTML = this.formData.catatanHTML.replace(/<[^>]*>/g, '').trim();
    },

    /**
     * Memuat data awal dari LocalStorage atau default template acuan
     */
    loadData: function() {
      try {
        var saved = localStorage.getItem('sitta_stok_data_ut');
        if (saved) {
          var parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            var self = this;
            this.stok = parsed.map(function(item) {
              item.catatanHTML = self.sanitizeHTML(item.catatanHTML);
              return item;
            });
            return;
          }
        }
      } catch (e) {
        console.warn("Menggunakan data default awal:", e);
      }
      // Gunakan salinan dari data dummy awal acuan dosen
      this.stok = JSON.parse(JSON.stringify(INITIAL_STOK_DATA));
      localStorage.setItem('sitta_stok_data_ut', JSON.stringify(INITIAL_STOK_DATA));
    },

    /**
     * Format Angka ke Rupiah Indonesia
     */
    formatRupiah: function(nominal) {
      var n = Number(nominal) || 0;
      return "Rp " + n.toLocaleString("id-ID");
    },

    /**
     * Toggle Buka/Tutup Form Tambah Modul
     */
    toggleForm: function() {
      this.showForm = !this.showForm;
      if (this.showForm && !this.isEdit) {
        this.resetForm();
      }
    },

    /**
     * Reset Formulir ke Kondisi Default
     */
    resetForm: function() {
      this.formData = {
        kode: '',
        judul: '',
        kategori: 'MK Wajib',
        upbjj: 'Jakarta',
        lokasiRak: 'R1-A1',
        harga: 60000,
        qty: 10,
        safety: 15,
        catatanHTML: ''
      };
      this.formErrors = [];
      this.isEdit = false;
      this.editIndex = -1;
      this.qtySafetyAdvice = '';
      this.qtySafetyStatus = '';
    },

    /**
     * Batal Form Tambah/Edit
     */
    batalForm: function() {
      this.resetForm();
      this.showForm = false;
    },

    /**
     * Validasi Formulir Input Sederhana
     */
    validasiForm: function() {
      this.formErrors = [];

      if (!this.formData.kode || this.formData.kode.trim() === '') {
        this.formErrors.push("Kode Modul wajib diisi.");
      } else {
        // Cek duplikasi kode bila bukan sedang mengedit item yang sama
        var self = this;
        var duplikat = this.stok.some(function(item, idx) {
          return item.kode.toUpperCase() === self.formData.kode.trim().toUpperCase() && idx !== self.editIndex;
        });
        if (duplikat) {
          this.formErrors.push("Kode Modul '" + this.formData.kode + "' sudah ada di dalam katalog.");
        }
      }

      if (!this.formData.judul || this.formData.judul.trim() === '') {
        this.formErrors.push("Nama / Judul Bahan Ajar wajib diisi.");
      }

      if (!this.formData.lokasiRak || this.formData.lokasiRak.trim() === '') {
        this.formErrors.push("Lokasi Rak penyimpanan wajib diisi.");
      }

      if (this.formData.harga === '' || Number(this.formData.harga) < 0) {
        this.formErrors.push("Harga harus bernilai positif.");
      }

      if (this.formData.qty === '' || Number(this.formData.qty) < 0) {
        this.formErrors.push("Jumlah Stok (Qty) tidak boleh bernilai negatif.");
      }

      if (this.formData.safety === '' || Number(this.formData.safety) < 0) {
        this.formErrors.push("Batas Safety Stock tidak boleh bernilai negatif.");
      }

      return this.formErrors.length === 0;
    },

    /**
     * Menyimpan data bahan ajar (Tambah Baru atau Update Edit)
     */
    simpanStok: function() {
      if (!this.validasiForm()) {
        return;
      }

      var rawCatatan = this.formData.catatanHTML ? this.formData.catatanHTML.trim() : '';
      var safeCatatan = this.sanitizeHTML(rawCatatan) || '<em>Tersedia</em>';

      var itemData = {
        kode: this.formData.kode.trim().toUpperCase(),
        judul: this.formData.judul.trim(),
        kategori: this.formData.kategori,
        upbjj: this.formData.upbjj,
        lokasiRak: this.formData.lokasiRak.trim().toUpperCase(),
        harga: Number(this.formData.harga),
        qty: Number(this.formData.qty),
        safety: Number(this.formData.safety),
        catatanHTML: safeCatatan
      };

      if (this.isEdit && this.editIndex >= 0) {
        // Mode Update
        Vue.set(this.stok, this.editIndex, itemData);
        this.showToast("Bahan ajar " + itemData.kode + " berhasil diperbarui!");
      } else {
        // Mode Tambah Baru
        this.stok.push(itemData);
        this.showToast("Bahan ajar " + itemData.kode + " berhasil ditambahkan ke katalog!");
      }

      this.resetForm();
      this.showForm = false;
    },

    /**
     * Mengisi formulir untuk proses Edit
     */
    editItem: function(item) {
      var idx = this.stok.findIndex(function(s) {
        return s.kode === item.kode;
      });

      if (idx !== -1) {
        this.isEdit = true;
        this.editIndex = idx;
        this.formData = {
          kode: item.kode,
          judul: item.judul,
          kategori: item.kategori,
          upbjj: item.upbjj,
          lokasiRak: item.lokasiRak,
          harga: item.harga,
          qty: item.qty,
          safety: item.safety,
          catatanHTML: item.catatanHTML
        };
        this.formErrors = [];
        this.showForm = true;

        // Scroll halus ke formulir
        window.scrollTo({ top: 120, behavior: 'smooth' });
      }
    },

    /**
     * Menghapus Bahan Ajar dengan Konfirmasi Modal
     */
    hapusItem: function(kode) {
      var self = this;
      this.bukaModal({
        title: 'Konfirmasi Hapus Modul',
        message: 'Apakah Anda yakin ingin menghapus bahan ajar "' + kode + '" dari katalog persediaan?',
        type: 'danger',
        confirmLabel: 'Ya, Hapus',
        cancelLabel: 'Batal',
        onConfirm: function() {
          var idx = self.stok.findIndex(function(s) {
            return s.kode === kode;
          });
          if (idx !== -1) {
            self.stok.splice(idx, 1);
            self.showToast("Modul " + kode + " berhasil dihapus.");
          }
        }
      });
    },

    /**
     * Shortcut Quick Filter Status Persediaan
     */
    quickFilter: function(status) {
      this.filterStatus = this.filterStatus === status ? '' : status;
    },

    /**
     * Reset Semua Filter & Pencarian
     */
    resetFilter: function() {
      this.searchQuery = '';
      this.filterKategori = '';
      this.filterUpbjj = '';
      this.filterStatus = '';
      this.sortBy = 'kode';
      this.sortOrder = 'asc';
      this.showToast("Filter pencarian telah dikosongkan.");
    },

    /**
     * Pulihkan seluruh data stok ke template acuan awal dosen
     */
    resetDataDefault: function() {
      var self = this;
      this.bukaModal({
        title: 'Pulihkan Data Persediaan',
        message: 'Apakah Anda ingin mengembalikan seluruh data bahan ajar ke contoh data awal Puslaba UT?',
        type: 'warning',
        confirmLabel: 'Ya, Pulihkan Data',
        cancelLabel: 'Batal',
        onConfirm: function() {
          self.stok = JSON.parse(JSON.stringify(INITIAL_STOK_DATA));
          localStorage.setItem('sitta_stok_data_ut', JSON.stringify(INITIAL_STOK_DATA));
          self.resetFilter();
          self.showToast("Data persediaan berhasil dipulihkan!");
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

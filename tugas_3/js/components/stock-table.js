/**
 * ============================================================================
 * Komponen Tabel Stok Bahan Ajar: <ba-stock-table> (js/components/stock-table.js)
 * Mengelola daftar stok bahan ajar, filter dependent option (UT-Daerah -> Kategori),
 * filter re-order, sorting (judul, qty, harga), tambah/edit via Enter, & hapus via modal.
 * ============================================================================
 */
Vue.component("ba-stock-table", {
  template: "#tpl-stock",
  props: {
    items: {
      type: Array,
      required: true
    },
    upbjjList: {
      type: Array,
      default: function () {
        return ["Jakarta", "Surabaya", "Makassar", "Padang", "Denpasar"];
      }
    },
    kategoriList: {
      type: Array,
      default: function () {
        return ["MK Wajib", "MK Pilihan", "Praktikum", "Problem-Based"];
      }
    }
  },
  data: function () {
    return {
      // State Filter & Sort
      searchQuery: "",
      filterUpbjj: "",
      filterKategori: "",
      filterStatus: "",
      onlyReorder: false,
      sortBy: "judul",
      sortOrder: "asc",

      // State Formulir Create / Update
      showForm: false,
      isEdit: false,
      editIndex: -1,
      formData: {
        kode: "",
        judul: "",
        kategori: "MK Wajib",
        upbjj: "Jakarta",
        lokasiRak: "R1-A1",
        harga: 60000,
        qty: 15,
        safety: 10,
        catatanHTML: ""
      },
      formErrors: [],

      // State Watcher Logs
      searchWatcherLog: "Siap memantau kata kunci...",
      upbjjWatcherLog: "",
      qtySafetyAdvice: "",
      qtySafetyStatus: "safe"
    };
  },

  computed: {
    /**
     * Computed Property 1: Dependent Options untuk Kategori Mata Kuliah
     * Menampilkan daftar kategori yang tersedia ketika UT-Daerah dipilih
     */
    dependentKategoriList: function () {
      return this.kategoriList;
    },

    /**
     * Computed Property 2: Menyaring dan mengurutkan daftar stok tanpa recompute berulang
     */
    filteredStok: function () {
      var self = this;
      var hasil = this.items.filter(function (item) {
        // 1. Filter kata kunci pencarian
        var matchQuery = true;
        if (self.searchQuery.trim() !== "") {
          var q = self.searchQuery.toLowerCase();
          matchQuery =
            item.kode.toLowerCase().includes(q) ||
            item.judul.toLowerCase().includes(q) ||
            item.lokasiRak.toLowerCase().includes(q);
        }

        // 2. Filter UT-Daerah (upbjj)
        var matchUpbjj = true;
        if (self.filterUpbjj !== "") {
          matchUpbjj = item.upbjj === self.filterUpbjj;
        }

        // 3. Filter Dependent Option: Kategori Mata Kuliah
        var matchKategori = true;
        if (self.filterUpbjj !== "" && self.filterKategori !== "") {
          matchKategori = item.kategori === self.filterKategori;
        }

        // 4. Filter Checkbox Re-Order (qty < safety atau qty == 0)
        var matchReorderCheckbox = true;
        if (self.onlyReorder) {
          matchReorderCheckbox = Number(item.qty) < Number(item.safety) || Number(item.qty) === 0;
        }

        // 5. Filter Dropdown Status Stok
        var matchStatus = true;
        var qty = Number(item.qty);
        var safety = Number(item.safety);
        if (self.filterStatus === "kosong") {
          matchStatus = qty === 0;
        } else if (self.filterStatus === "menipis") {
          matchStatus = qty > 0 && qty < safety;
        } else if (self.filterStatus === "aman") {
          matchStatus = qty >= safety;
        } else if (self.filterStatus === "reorder") {
          matchStatus = qty < safety || qty === 0;
        }

        return matchQuery && matchUpbjj && matchKategori && matchReorderCheckbox && matchStatus;
      });

      // Pengurutan (Sorting) berdasarkan judul, stock (qty), atau harga
      hasil.sort(function (a, b) {
        var mod = self.sortOrder === "desc" ? -1 : 1;
        if (self.sortBy === "harga" || self.sortBy === "qty") {
          return (Number(a[self.sortBy]) - Number(b[self.sortBy])) * mod;
        }
        return String(a[self.sortBy] || "").localeCompare(String(b[self.sortBy] || "")) * mod;
      });

      return hasil;
    },

    totalJudul: function () {
      return this.items.length;
    },

    totalEksemplar: function () {
      return this.items.reduce(function (acc, item) {
        return acc + Number(item.qty || 0);
      }, 0);
    },

    totalNilaiAset: function () {
      return this.items.reduce(function (acc, item) {
        return acc + Number(item.qty || 0) * Number(item.harga || 0);
      }, 0);
    },

    stokKritisCount: function () {
      return this.items.filter(function (item) {
        return Number(item.qty) < Number(item.safety) || Number(item.qty) === 0;
      }).length;
    },

    summaryInfoText: function () {
      return (
        "Menampilkan " +
        this.filteredStok.length +
        " dari " +
        this.totalJudul +
        " bahan ajar (Hover kolom Status untuk melihat Catatan)."
      );
    },

    previewCatatan: function () {
      var raw = this.formData.catatanHTML ? this.formData.catatanHTML.trim() : "";
      if (!raw) {
        return '<span class="muted"><em>(Belum ada catatan)</em></span>';
      }
      return this.sanitizeHTML(raw);
    }
  },

  watch: {
    /**
     * WATCHER 1: Memantau perubahan filter UT-Daerah (filterUpbjj)
     * Mengatur dependent option: mereset filterKategori saat UT-Daerah diganti/dikosongkan
     */
    filterUpbjj: function (newVal, oldVal) {
      this.filterKategori = "";
      if (newVal === "") {
        this.upbjjWatcherLog = "UT-Daerah direset, filter Kategori disembunyikan.";
      } else {
        this.upbjjWatcherLog = "UT-Daerah '" + newVal + "' dipilih -> Filter Kategori diaktifkan.";
      }
    },

    /**
     * WATCHER 2: Memantau perubahan kata kunci pencarian (searchQuery)
     */
    searchQuery: function (newVal) {
      if (newVal.trim() === "") {
        this.searchWatcherLog = "Menampilkan seluruh daftar stok.";
      } else {
        this.searchWatcherLog =
          'Kata kunci "' + newVal + '" (' + this.filteredStok.length + " hasil)";
      }
    },

    /**
     * WATCHER 3: Memantau perubahan jumlah stok (formData.qty) terhadap safety stock
     */
    "formData.qty": function (newQty) {
      this.evaluasiQtySafety(newQty, this.formData.safety);
    },

    "formData.safety": function (newSafety) {
      this.evaluasiQtySafety(this.formData.qty, newSafety);
    }
  },

  methods: {
    evaluasiQtySafety: function (qtyVal, safetyVal) {
      var qty = Number(qtyVal);
      var safety = Number(safetyVal);
      if (isNaN(qty) || qty <= 0) {
        this.qtySafetyStatus = "warn";
        this.qtySafetyAdvice = "Status Kosong (0 buah): Wajib segera dilakukan re-order!";
      } else if (qty < safety) {
        this.qtySafetyStatus = "warn";
        this.qtySafetyAdvice =
          "Status Menipis (" + qty + " < " + safety + " buah): Disarankan re-order bahan ajar.";
      } else {
        this.qtySafetyStatus = "safe";
        this.qtySafetyAdvice =
          "Status Aman (" + qty + " >= " + safety + " buah): Stok mencukupi.";
      }
    },

    toggleSortOrder: function () {
      this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc";
    },

    resetFilter: function () {
      this.searchQuery = "";
      this.filterUpbjj = "";
      this.filterKategori = "";
      this.filterStatus = "";
      this.onlyReorder = false;
      this.sortBy = "judul";
      this.sortOrder = "asc";
      this.$emit("notify", "Filter dan urutan stok telah di-reset.");
    },

    toggleForm: function () {
      this.showForm = !this.showForm;
      if (this.showForm && !this.isEdit) {
        this.resetForm();
      }
    },

    resetForm: function () {
      this.formData = {
        kode: "",
        judul: "",
        kategori: this.kategoriList[0] || "MK Wajib",
        upbjj: this.upbjjList[0] || "Jakarta",
        lokasiRak: "R1-A1",
        harga: 60000,
        qty: 15,
        safety: 10,
        catatanHTML: ""
      };
      this.formErrors = [];
      this.isEdit = false;
      this.editIndex = -1;
      this.evaluasiQtySafety(15, 10);
    },

    batalForm: function () {
      this.resetForm();
      this.showForm = false;
    },

    sanitizeHTML: function (rawHtml) {
      if (!rawHtml || typeof rawHtml !== "string") return "";
      var clean = rawHtml
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
      return clean.replace(/<(\/?)(\w+)([^>]*)>/gi, function (match, slash, tag) {
        var lower = tag.toLowerCase();
        if (["p", "em", "i", "u", "strong", "b", "small"].indexOf(lower) !== -1) {
          return "<" + slash + lower + ">";
        }
        return "";
      });
    },

    applyTag: function (tag) {
      var input = this.$refs.catatanInput;
      var text = this.formData.catatanHTML || "";
      var openTag = "<" + tag + ">";
      var closeTag = "</" + tag + ">";

      if (!input) {
        this.formData.catatanHTML = text + (text ? " " : "") + openTag + "catatan" + closeTag;
        return;
      }

      var start = typeof input.selectionStart === "number" ? input.selectionStart : text.length;
      var end = typeof input.selectionEnd === "number" ? input.selectionEnd : text.length;
      var selected = text.substring(start, end);
      var content = selected.length > 0 ? selected : "teks " + tag;
      var replacement = openTag + content + closeTag;

      this.formData.catatanHTML = text.substring(0, start) + replacement + text.substring(end);
    },

    clearFormatting: function () {
      if (!this.formData.catatanHTML) return;
      this.formData.catatanHTML = this.formData.catatanHTML.replace(/<[^>]*>/g, "").trim();
    },

    validasiForm: function () {
      this.formErrors = [];
      var self = this;

      if (!this.formData.kode || this.formData.kode.trim() === "") {
        this.formErrors.push("Kode Mata Kuliah wajib diisi.");
      } else {
        var duplikat = this.items.some(function (item, idx) {
          return (
            item.kode.toUpperCase() === self.formData.kode.trim().toUpperCase() &&
            idx !== self.editIndex
          );
        });
        if (duplikat) {
          this.formErrors.push("Kode Mata Kuliah '" + this.formData.kode + "' sudah terdaftar.");
        }
      }

      if (!this.formData.judul || this.formData.judul.trim() === "") {
        this.formErrors.push("Nama Mata Kuliah wajib diisi.");
      }

      if (!this.formData.lokasiRak || this.formData.lokasiRak.trim() === "") {
        this.formErrors.push("Lokasi Rak wajib diisi.");
      }

      if (this.formData.harga === "" || isNaN(this.formData.harga) || Number(this.formData.harga) <= 0) {
        this.formErrors.push("Harga bahan ajar harus lebih besar dari Rp 0.");
      }

      if (this.formData.qty === "" || isNaN(this.formData.qty) || Number(this.formData.qty) < 0) {
        this.formErrors.push("Jumlah Stok (qty) tidak boleh bernilai negatif.");
      }

      if (this.formData.safety === "" || isNaN(this.formData.safety) || Number(this.formData.safety) < 0) {
        this.formErrors.push("Jumlah Safety Stock tidak boleh bernilai negatif.");
      }

      return this.formErrors.length === 0;
    },

    simpanStok: function () {
      if (!this.validasiForm()) {
        return;
      }

      var rawCatatan = this.formData.catatanHTML ? this.formData.catatanHTML.trim() : "";
      var safeCatatan = this.sanitizeHTML(rawCatatan) || "<em>Tersedia di gudang UPBJJ</em>";

      var payload = {
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
        Vue.set(this.items, this.editIndex, payload);
        this.$emit("notify", "Data bahan ajar " + payload.kode + " berhasil diperbaharui!");
      } else {
        this.items.push(payload);
        this.$emit("notify", "Bahan ajar baru " + payload.kode + " berhasil ditambahkan!");
      }

      this.resetForm();
      this.showForm = false;
    },

    editItem: function (item) {
      var idx = this.items.findIndex(function (s) {
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
        this.evaluasiQtySafety(item.qty, item.safety);
      }
    },

    konfirmasiHapus: function (item) {
      var self = this;
      this.$emit("open-modal", {
        title: "Konfirmasi Hapus Bahan Ajar",
        message:
          'Apakah Anda yakin ingin menghapus bahan ajar "' +
          item.kode +
          " - " +
          item.judul +
          '" dari daftar persediaan?',
        type: "danger",
        confirmLabel: "Ya, Hapus Data",
        cancelLabel: "Batal",
        onConfirm: function () {
          var idx = self.items.findIndex(function (s) {
            return s.kode === item.kode;
          });
          if (idx !== -1) {
            self.items.splice(idx, 1);
            self.$emit("notify", "Bahan ajar " + item.kode + " telah dihapus.");
          }
        }
      });
    }
  }
});

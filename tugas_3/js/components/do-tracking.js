/**
 * ============================================================================
 * Komponen Tracking Delivery Order: <do-tracking> (js/components/do-tracking.js)
 * Fitur pencarian berdasarkan Nomor DO atau NIM (Enter untuk submit,
 * Esc untuk hapus/reset pencarian), serta penambahan progress perjalanan.
 * ============================================================================
 */
Vue.component("do-tracking", {
  template: "#tpl-tracking",
  props: {
    data: {
      type: Object,
      required: true
    },
    paketList: {
      type: Array,
      default: function () {
        return [];
      }
    },
    pengirimanList: {
      type: Array,
      default: function () {
        return [];
      }
    },
    stokList: {
      type: Array,
      default: function () {
        return [];
      }
    }
  },
  data: function () {
    return {
      searchType: "noDO",
      searchKeyword: "",
      lastSearchedKeyword: "",
      searchError: "",
      activeNoDO: "",
      currentDO: null,
      notFound: false,

      showFormProgress: false,
      formProgress: {
        status: "Dalam Perjalanan",
        waktu: "",
        keterangan: ""
      },
      progressError: ""
    };
  },

  mounted: function () {
    var self = this;
    this._onGlobalKeydown = function (e) {
      if (e.key === "Escape" && (self.searchKeyword || self.currentDO || self.notFound)) {
        self.resetPencarian();
      }
    };
    window.addEventListener("keydown", this._onGlobalKeydown);
  },

  beforeDestroy: function () {
    if (this._onGlobalKeydown) {
      window.removeEventListener("keydown", this._onGlobalKeydown);
    }
  },

  computed: {
    stepProgress: function () {
      if (!this.currentDO) return 0;
      var st = (this.currentDO.status || "").toLowerCase();
      if (st.indexOf("diterima") !== -1 || st.indexOf("selesai") !== -1) {
        return 3;
      }
      if (st.indexOf("perjalanan") !== -1 || st.indexOf("kirim") !== -1) {
        return 2;
      }
      return 1;
    },

    detailPaket: function () {
      if (!this.currentDO) return null;
      var self = this;
      var found = (this.paketList || []).find(function (p) {
        return p.kode === self.currentDO.paket;
      });
      return found || { kode: this.currentDO.paket, nama: "", isi: [] };
    }
  },

  watch: {
    /**
     * WATCHER 1: Memantau pergantian kriteria pencarian (Nomor DO / NIM)
     * Otomatis mereset kata kunci dan pesan error saat kriteria diganti
     */
    searchType: function () {
      this.searchKeyword = "";
      this.searchError = "";
      this.notFound = false;
    },

    /**
     * WATCHER 2: Memantau input pencarian secara langsung (validasi format Nomor DO / NIM)
     */
    searchKeyword: function (newVal) {
      var trimmed = (newVal || "").trim();
      if (!trimmed) {
        this.searchError = "";
        return;
      }

      if (this.searchType === "nim") {
        if (/[^0-9]/.test(trimmed)) {
          this.searchError = "NIM hanya boleh berisi angka.";
        } else {
          this.searchError = "";
        }
      } else {
        var cleanVal = trimmed.replace(/\s+/g, "").toUpperCase();
        if (/[^A-Z0-9-]/.test(cleanVal)) {
          this.searchError = "Nomor DO hanya boleh berisi huruf, angka, dan tanda hubung (-).";
        } else {
          this.searchError = "";
        }
      }
    }
  },

  methods: {
    cariDO: function () {
      var raw = (this.searchKeyword || "").trim();
      if (!raw) {
        this.searchError =
          this.searchType === "noDO"
            ? "Nomor Delivery Order wajib diisi."
            : "NIM Mahasiswa wajib diisi.";
        return;
      }

      if (this.searchError) {
        return;
      }

      var keys = Object.keys(this.data || {});
      var matchedKey = null;

      if (this.searchType === "noDO") {
        var qUpper = raw.toUpperCase();
        var qClean = qUpper.replace(/[^A-Z0-9]/g, "");
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          var keyUpper = key.toUpperCase();
          var keyClean = keyUpper.replace(/[^A-Z0-9]/g, "");
          if (
            keyUpper === qUpper ||
            keyClean === qClean ||
            keyUpper.replace("-000", "-00") === qUpper.replace("-000", "-00")
          ) {
            matchedKey = key;
            break;
          }
        }
      } else {
        for (var j = 0; j < keys.length; j++) {
          var k = keys[j];
          var item = this.data[k];
          if (String(item.nim || "").trim() === raw) {
            matchedKey = k;
            break;
          }
        }
      }

      if (matchedKey && this.data[matchedKey]) {
        this.activeNoDO = matchedKey;
        this.currentDO = this.data[matchedKey];
        this.notFound = false;
        this.lastSearchedKeyword = "";
      } else {
        this.activeNoDO = "";
        this.currentDO = null;
        this.notFound = true;
        this.lastSearchedKeyword = raw;
      }
    },

    /**
     * Menghapus / mereset pencarian saat menekan tombol Esc atau tombol Hapus
     */
    resetPencarian: function () {
      this.searchKeyword = "";
      this.searchError = "";
      this.notFound = false;
      this.lastSearchedKeyword = "";
      this.activeNoDO = "";
      this.currentDO = null;
      if (this.$refs.searchInput) {
        this.$refs.searchInput.focus();
      }
    },

    pilihDO: function (noDOKey) {
      if (this.data && this.data[noDOKey]) {
        this.activeNoDO = noDOKey;
        this.currentDO = this.data[noDOKey];
        this.searchType = "noDO";
        this.searchKeyword = noDOKey;
        this.notFound = false;
        this.searchError = "";
      }
    },

    toggleFormProgress: function () {
      this.showFormProgress = !this.showFormProgress;
      if (this.showFormProgress && this.currentDO) {
        this.formProgress.status = this.currentDO.status || "Dalam Perjalanan";
        this.refreshWaktuProgress();
        this.formProgress.keterangan = "";
        this.progressError = "";
      }
    },

    refreshWaktuProgress: function () {
      this.formProgress.waktu = FormatHelper.waktuSekarang();
    },

    tambahProgress: function () {
      this.progressError = "";
      if (!this.formProgress.keterangan || this.formProgress.keterangan.trim() === "") {
        this.progressError = "Keterangan perjalanan wajib diisi.";
        return;
      }

      if (!this.currentDO) return;

      var waktuLocal = FormatHelper.waktuSekarang();
      this.currentDO.perjalanan.push({
        waktu: waktuLocal,
        keterangan: this.formProgress.keterangan.trim()
      });
      this.currentDO.status = this.formProgress.status;

      this.formProgress.keterangan = "";
      this.showFormProgress = false;
      this.$emit("notify", "Riwayat perjalanan DO berhasil diperbarui.");
    }
  }
});

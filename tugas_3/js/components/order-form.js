/**
 * ============================================================================
 * Komponen Formulir Order DO: <order-form> (js/components/order-form.js)
 * Menangani pembuatan Delivery Order (DO) baru dengan penomoran otomatis,
 * pilihan paket beserta rincian isi modul di bawah <select>, format tanggal
 * Indonesia, dan kalkulasi total harga otomatis.
 * ============================================================================
 */
Vue.component("order-form", {
  template: "#tpl-order",
  props: {
    paket: {
      type: Array,
      default: function () {
        return [];
      }
    },
    ekspedisi: {
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
    },
    trackingData: {
      type: Object,
      default: function () {
        return {};
      }
    },
    closable: {
      type: Boolean,
      default: false
    }
  },
  data: function () {
    return {
      form: {
        noDO: "",
        nim: "",
        nama: "",
        ekspedisi: "JNE Regular (3-5 hari)",
        paket: "PAKET-UT-001",
        tanggalKirim: FormatHelper.tanggalHariIniISO(),
        total: 120000
      },
      errors: []
    };
  },

  created: function () {
    this.syncNomorDO();
    this.syncHargaPaket();
  },

  computed: {
    /**
     * Daftar opsi ekspedisi (JNE Regular / JNE Express)
     */
    ekspedisiOptions: function () {
      if (this.ekspedisi && this.ekspedisi.length > 0) {
        return this.ekspedisi.map(function (item) {
          var nama = item.nama || item.kode;
          if (nama.toLowerCase().indexOf("jne") === -1) {
            nama = "JNE " + nama;
          }
          return {
            kode: item.kode,
            label: nama
          };
        });
      }
      return [
        { kode: "REG", label: "JNE Regular (3-5 hari)" },
        { kode: "EXP", label: "JNE Express (1-2 hari)" }
      ];
    },

    /**
     * Objek paket bahan ajar yang sedang dipilih pada elemen <select>
     */
    selectedPaket: function () {
      var self = this;
      return (
        this.paket.find(function (p) {
          return p.kode === self.form.paket;
        }) || null
      );
    }
  },

  watch: {
    /**
     * WATCHER: Memantau perubahan pilihan paket bahan ajar (form.paket)
     * Secara otomatis mengambil harga dari objek paket ke form.total
     */
    "form.paket": function () {
      this.syncHargaPaket();
    },

    /**
     * WATCHER: Memantau perubahan data tracking untuk mengupdate nomor urut DO otomatis
     */
    trackingData: {
      handler: function () {
        this.syncNomorDO();
      },
      deep: true
    }
  },

  methods: {
    /**
     * Generate Nomor DO Otomatis: DO + Tahun Berjalan + Sequence Number (misal DO2025-001)
     */
    syncNomorDO: function () {
      var keys = Object.keys(this.trackingData || {});
      var year = new Date().getFullYear();
      // Cari tahun dari data awal jika semua menggunakan 2025 atau gunakan tahun berjalan
      var maxSeq = keys.length;
      keys.forEach(function (k) {
        var match = k.match(/-(\d+)$/);
        if (match) {
          var num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      });
      var nextSeq = String(maxSeq + 1).padStart(3, "0");
      this.form.noDO = "DO" + year + "-" + nextSeq;
    },

    syncHargaPaket: function () {
      if (this.selectedPaket) {
        this.form.total = Number(this.selectedPaket.harga || 0);
      } else {
        this.form.total = 0;
      }
    },

    isiTanggalLocalTime: function () {
      this.form.tanggalKirim = FormatHelper.tanggalHariIniISO();
    },

    getJudulModul: function (kodeModul) {
      var found = (this.stokList || []).find(function (s) {
        return s.kode === kodeModul;
      });
      return found ? found.judul : "";
    },

    validasiOrder: function () {
      this.errors = [];
      if (!this.form.nim || this.form.nim.trim() === "") {
        this.errors.push("NIM Mahasiswa wajib diisi.");
      } else if (!/^\d+$/.test(this.form.nim.trim())) {
        this.errors.push("NIM Mahasiswa harus berupa angka.");
      }

      if (!this.form.nama || this.form.nama.trim() === "") {
        this.errors.push("Nama Mahasiswa wajib diisi.");
      }

      if (!this.form.ekspedisi) {
        this.errors.push("Ekspedisi pengiriman wajib dipilih.");
      }

      if (!this.form.paket || !this.selectedPaket) {
        this.errors.push("Paket Bahan Ajar wajib dipilih.");
      }

      if (!this.form.tanggalKirim) {
        this.errors.push("Tanggal kirim wajib diisi.");
      }

      return this.errors.length === 0;
    },

    submitOrder: function () {
      if (!this.validasiOrder()) {
        return;
      }

      var waktuAwal = FormatHelper.waktuSekarang();
      var newDO = {
        noDO: this.form.noDO,
        data: {
          nim: this.form.nim.trim(),
          nama: this.form.nama.trim(),
          status: "Dikemas",
          ekspedisi: this.form.ekspedisi,
          tanggalKirim: this.form.tanggalKirim,
          paket: this.form.paket,
          total: Number(this.form.total),
          perjalanan: [
            {
              waktu: waktuAwal,
              keterangan:
                "Order DO diterbitkan di Puslaba UT untuk NIM " +
                this.form.nim.trim() +
                " (" +
                this.form.nama.trim() +
                ")"
            }
          ]
        }
      };

      this.$emit("created", newDO);
      this.resetForm();
    },

    resetForm: function () {
      this.syncNomorDO();
      this.form.nim = "";
      this.form.nama = "";
      this.form.ekspedisi =
        this.ekspedisiOptions.length > 0 ? this.ekspedisiOptions[0].label : "JNE Regular";
      this.form.paket = this.paket.length > 0 ? this.paket[0].kode : "PAKET-UT-001";
      this.form.tanggalKirim = FormatHelper.tanggalHariIniISO();
      this.syncHargaPaket();
      this.errors = [];
    }
  }
});

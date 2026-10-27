/**
 * ============================================================================
 * Komponen Modal Dialog: <app-modal> (js/components/app-modal.js)
 * Digunakan untuk konfirmasi hapus bahan ajar, pemulihan data, dan informasi.
 * ============================================================================
 */
Vue.component("app-modal", {
  template: "#tpl-modal",
  data: function () {
    return {
      visible: false,
      title: "Informasi",
      message: "",
      type: "info",
      confirmLabel: "Ya, Lanjutkan",
      cancelLabel: "Batal",
      showCancel: false,
      onConfirmCallback: null
    };
  },
  methods: {
    open: function (options) {
      var opts = options || {};
      this.title = opts.title || "Informasi";
      this.message = opts.message || "";
      this.type = opts.type || "info";
      this.showCancel = typeof opts.onConfirm === "function";
      this.confirmLabel = opts.confirmLabel || (this.showCancel ? "Ya, Lanjutkan" : "Tutup");
      this.cancelLabel = opts.cancelLabel || "Batal";
      this.onConfirmCallback = opts.onConfirm || null;
      this.visible = true;

      var self = this;
      this.$nextTick(function () {
        if (self.$refs.confirmBtn) {
          self.$refs.confirmBtn.focus();
        }
      });
    },
    close: function () {
      this.visible = false;
      this.onConfirmCallback = null;
    },
    confirm: function () {
      var cb = this.onConfirmCallback;
      this.close();
      if (typeof cb === "function") {
        cb();
      }
    }
  }
});

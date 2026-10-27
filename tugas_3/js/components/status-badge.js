/**
 * ============================================================================
 * Komponen Status Badge: <status-badge> (js/components/status-badge.js)
 * Menampilkan badge status stok (Aman / Menipis / Kosong) beserta
 * Tooltip/Preview catatanHTML saat mouse hover pada kolom Status.
 * ============================================================================
 */
Vue.component("status-badge", {
  template: "#tpl-badge",
  props: {
    qty: {
      type: [Number, String],
      default: 0
    },
    safety: {
      type: [Number, String],
      default: 0
    },
    catatanHtml: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      default: ""
    }
  },
  data: function () {
    return {
      showTooltip: false
    };
  },
  methods: {
    onMouseEnter: function () {
      this.showTooltip = true;
    },
    onMouseLeave: function () {
      this.showTooltip = false;
    }
  }
});

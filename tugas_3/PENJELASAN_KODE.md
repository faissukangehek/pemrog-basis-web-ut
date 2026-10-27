# Penjelasan Kode — Tugas Praktik 3 (Vue Component & Template) SITTA UT

Dokumen panduan penjelasan per bagian kode untuk rekaman video Tugas Praktik 3 (maksimal 15 menit), dengan gaya kalimat: **"Code di atas menjelaskan tentang ..."**.

---

## 1. Struktur Proyek & Arsitektur (`index.html`)

```html
<div id="app">
  ...
  <section v-show="tab === 'stok'">
    <ba-stock-table
      :items="state.stok"
      :upbjj-list="state.upbjjList"
      :kategori-list="state.kategoriList"
      @open-modal="openModal"
      @notify="showToast"
    ></ba-stock-table>
  </section>

  <section v-show="tab === 'tracking'">
    <do-tracking
      ref="trackingComp"
      :data="state.tracking"
      :paket-list="state.paket"
      :pengiriman-list="state.pengirimanList"
      :stok-list="state.stok"
      @create-do="handleNewDO"
      @notify="showToast"
    ></do-tracking>
  </section>

  <section v-show="tab === 'order'">
    <order-form
      :paket="state.paket"
      :ekspedisi="state.pengirimanList"
      :stok-list="state.stok"
      :tracking-data="state.tracking"
      @created="handleNewDO"
    ></order-form>
  </section>

  <app-modal ref="modal"></app-modal>
</div>
```

Code di atas menjelaskan tentang arsitektur utama aplikasi pada `index.html` yang dimount ke elemen `#app`. Navigasi antar halaman tidak lagi berpindah file HTML seperti pada Tugas Praktik 2, melainkan menggunakan *tab state* (`tab === 'stok'`, `'tracking'`, dan `'order'`) dengan directive `v-show` serta memanggil *custom element* Vue Component `<ba-stock-table>`, `<do-tracking>`, `<order-form>`, dan `<app-modal>`.

```html
<script src="https://cdn.jsdelivr.net/npm/vue@2.7.16/dist/vue.js"></script>
<script>window.Vue || document.write('<script src="js/vue.min.js"><\/script>')</script>
<script src="js/services/api.js"></script>
<script src="js/components/status-badge.js"></script>
<script src="js/components/app-modal.js"></script>
<script src="js/components/order-form.js"></script>
<script src="js/components/stock-table.js"></script>
<script src="js/components/do-tracking.js"></script>
<script src="js/app.js"></script>
```

Code di atas menjelaskan tentang urutan pemuatan script yang sangat penting pada Vue.js. Pertama library core Vue.js dimuat terlebih dahulu, diikuti oleh data service `api.js` (beserta global filter), lalu seluruh deklarasi *Vue Component* (`status-badge`, `app-modal`, `order-form`, `stock-table`, `do-tracking`), dan terakhir `app.js` sebagai inisialisasi Vue root.

---

## 2. Data Service & Vue Filters (`js/services/api.js` & `data/dataBahanAjar.json`)

```js
fetchDataBahanAjar: function () {
  return fetch("data/dataBahanAjar.json")
    .then(function (response) {
      if (!response.ok) throw new Error("Gagal memuat dataBahanAjar.json");
      return response.json();
    })
    .catch(function () {
      return JSON.parse(JSON.stringify(DEFAULT_BAHAN_AJAR_DATA));
    });
}
```

Code di atas menjelaskan tentang layanan akses data (`ApiService`) yang membaca data dummy dari file JSON `/data/dataBahanAjar.json` menggunakan `fetch()`. Apabila aplikasi dibuka langsung melalui protokol lokal `file://` tanpa web server, blok `catch` otomatis menyediakan data cadangan agar aplikasi tetap berjalan lancar.

```js
Vue.filter("rupiah", function (val) {
  return FormatHelper.rupiah(val); // Contoh output: "Rp 65.000"
});

Vue.filter("satuanBuah", function (val) {
  return FormatHelper.satuanBuah(val); // Contoh output: "28 buah"
});

Vue.filter("formatTanggal", function (val) {
  return FormatHelper.tanggalIndo(val); // Contoh output: "25 Agustus 2025"
});
```

Code di atas menjelaskan tentang penerapan konsep **Vue Filter** (Indikator Capaian ke-7) untuk memformat tampilan teks. Filter `rupiah` menambahkan mata uang `Rp`, filter `satuanBuah` menambahkan satuan `buah` pada jumlah stok dan safety stock, sedangkan `formatTanggal` mengubah tanggal ISO (`2025-08-25`) menjadi format tanggal bahasa Indonesia (`25 Agustus 2025`).

---

## 3. Komponen Status Badge & Hover Tooltip Catatan (`js/components/status-badge.js` & `templates/status-badge.html`)

```js
Vue.component("status-badge", {
  template: "#tpl-badge",
  props: {
    qty: { type: [Number, String], default: 0 },
    safety: { type: [Number, String], default: 0 },
    catatanHtml: { type: String, default: "" },
    status: { type: String, default: "" }
  },
  data: function () {
    return { showTooltip: false };
  },
  methods: {
    onMouseEnter: function () { this.showTooltip = true; },
    onMouseLeave: function () { this.showTooltip = false; }
  }
});
```

Code di atas menjelaskan tentang registrasi komponen `<status-badge>` dengan penamaan *kebab-case* dan properti `template: '#tpl-badge'`. Komponen ini menerima `props` berupa `qty`, `safety`, dan `catatanHtml`, serta memiliki event handler `onMouseEnter` dan `onMouseLeave` untuk menampilkan tooltip catatan saat kursor diarahkan (hover) ke kolom Status.

```html
<span v-if="Number(qty) <= 0" class="badge badge-danger status-trigger">
  <span class="status-symbol">&#9888;</span> Kosong
</span>
<span v-else-if="Number(qty) < Number(safety)" class="badge badge-warning status-trigger">
  <span class="status-symbol">&#9888;</span> Menipis
</span>
<span v-else class="badge badge-success status-trigger">
  <span class="status-symbol">&#10004;</span> Aman
</span>

<div v-show="showTooltip && catatanHtml" class="status-catatan-tooltip" role="tooltip">
  <div class="tooltip-header">Catatan Bahan Ajar:</div>
  <div class="tooltip-content" v-html="catatanHtml"></div>
</div>
```

Code di atas menjelaskan tentang penerapan directive conditional (`v-if`, `v-else-if`, `v-else`) untuk menentukan warna dan simbol status stok: merah **Kosong** jika `qty <= 0`, oranye **Menipis** jika `qty < safety`, dan hijau **Aman** jika `qty >= safety`. Di bawahnya terdapat elemen tooltip dengan `v-show` dan `v-html="catatanHtml"` yang merender catatan berformat HTML saat pengguna melakukan *mouse hover* pada kolom Status.

---

## 4. Komponen Tabel Stok Bahan Ajar (`js/components/stock-table.js` & `templates/stock-table.html`)

```html
<!-- Filter 1: UT-Daerah -->
<select id="upbjjFilter" v-model="filterUpbjj" class="input-myut">
  <option value="">Semua UT-Daerah</option>
  <option v-for="(daerah, idx) in upbjjList" :key="idx" :value="daerah">{{ daerah }}</option>
</select>

<!-- Filter 2 (Dependent Option): Hanya muncul setelah UT-Daerah dipilih -->
<div class="field" v-if="filterUpbjj !== ''">
  <select id="katFilter" v-model="filterKategori" class="input-myut">
    <option value="">Semua Kategori di {{ filterUpbjj }}</option>
    <option v-for="(kat, idx) in dependentKategoriList" :key="idx" :value="kat">{{ kat }}</option>
  </select>
</div>
```

Code di atas menjelaskan tentang fitur *dependent options* pada filter stok. Dropdown filter Kategori Mata Kuliah menggunakan `v-if="filterUpbjj !== ''"` sehingga baru dimunculkan setelah pengguna memilih filter UT-Daerah terlebih dahulu.

```js
filteredStok: function () {
  var self = this;
  var hasil = this.items.filter(function (item) {
    ...
    var matchReorderCheckbox = true;
    if (self.onlyReorder) {
      matchReorderCheckbox = Number(item.qty) < Number(item.safety) || Number(item.qty) === 0;
    }
    return matchQuery && matchUpbjj && matchKategori && matchReorderCheckbox && matchStatus;
  });

  hasil.sort(function (a, b) {
    var mod = self.sortOrder === "desc" ? -1 : 1;
    if (self.sortBy === "harga" || self.sortBy === "qty") {
      return (Number(a[self.sortBy]) - Number(b[self.sortBy])) * mod;
    }
    return String(a[self.sortBy] || "").localeCompare(String(b[self.sortBy] || "")) * mod;
  });

  return hasil;
}
```

Code di atas menjelaskan tentang penggunaan `computed` property `filteredStok` untuk menyaring dan mengurutkan data berdasarkan judul, jumlah stok (`qty`), maupun harga. Karena `computed` property di-cache oleh Vue, seluruh filter tidak akan di-*recompute* kembali selama data atau state filter yang menjadi dependensinya tidak berubah.

```html
<form @submit.prevent="simpanStok" @keyup.enter="simpanStok" novalidate>
```

Code di atas menjelaskan tentang penanganan event keyboard `Enter` (`@keyup.enter="simpanStok"`) pada formulir tambah (create) maupun edit (update) bahan ajar, sehingga ketika pengguna menekan tombol `Enter`, data langsung divalidasi dan disimpan ke tabel stok.

```html
<td>{{ item.harga | rupiah }}</td>
<td>{{ item.qty | satuanBuah }}</td>
<td>{{ item.safety | satuanBuah }}</td>
```

Code di atas menjelaskan tentang pemanggilan Vue Filter menggunakan tanda pipe (`|`) di dalam mustaches `{{ ... }}` untuk memformat harga menjadi `Rp ...` serta jumlah stok dan safety stock menjadi `... buah`.

---

## 5. Komponen Tracking DO (`js/components/do-tracking.js`) & Order Form (`js/components/order-form.js`)

```html
<input
  type="text"
  id="keywordDO"
  v-model="searchKeyword"
  @keyup.enter="cariDO"
  @keydown.esc.prevent="resetPencarian"
  placeholder="Ketik Nomor DO (DO2025-0001) atau NIM (123456789) — Enter: Cari | Esc: Reset"
>
```

Code di atas menjelaskan tentang fitur pencarian Delivery Order berdasarkan Nomor DO atau NIM Mahasiswa yang dilengkapi event handler keyboard `@keyup.enter="cariDO"` untuk mengeksekusi pencarian saat menekan tombol `Enter`, serta `@keydown.esc.prevent="resetPencarian"` untuk menghapus/mereset pencarian saat menekan tombol `Esc`.

```html
<button
  v-for="(doItem, noDOKey) in data"
  :key="noDOKey"
  type="button"
  class="chip-btn"
  @click="pilihDO(noDOKey)"
>
  <strong>{{ noDOKey }}</strong> ({{ doItem.nim }} - {{ doItem.nama }})
</button>
```

Code di atas menjelaskan tentang penggunaan directive `v-for` dengan *name-based index* (`(doItem, noDOKey) in data`), di mana `noDOKey` adalah kunci nama properti objek (seperti `"DO2025-0001"`), melengkapi penggunaan `v-for` *zero-based number index* pada tabel stok dan timeline perjalanan.

```js
syncNomorDO: function () {
  var keys = Object.keys(this.trackingData || {});
  var year = new Date().getFullYear();
  var maxSeq = keys.length;
  ...
  var nextSeq = String(maxSeq + 1).padStart(3, "0");
  this.form.noDO = "DO" + year + "-" + nextSeq;
}
```

Code di atas menjelaskan tentang pembuatan Nomor DO secara otomatis pada komponen `<order-form>` dengan menggabungkan prefix `"DO"`, tahun berjalan (`getFullYear()`), dan nomor urut (*sequence number*) 3 digit.

```html
<select id="orderPaket" v-model="form.paket" class="input-myut">
  <option value="">-- Pilih Paket Bahan Ajar --</option>
  <option v-for="pkt in paket" :key="pkt.kode" :value="pkt.kode">
    {{ pkt.kode }} — {{ pkt.nama }} ({{ pkt.harga | rupiah }})
  </option>
</select>

<div v-if="selectedPaket" class="paket-detail-box">
  <strong>Detail Isi Paket: {{ selectedPaket.kode }} ({{ selectedPaket.nama }})</strong>
  <ul>
    <li v-for="(kodeModul, i) in selectedPaket.isi" :key="i">
      <strong>{{ kodeModul }}</strong> — {{ getJudulModul(kodeModul) }}
    </li>
  </ul>
</div>
```

Code di atas menjelaskan tentang dropdown pilihan Paket Bahan Ajar yang menampilkan kode paket beserta nama paket. Ketika paket dipilih, directive `v-if="selectedPaket"` langsung menampilkan rincian daftar modul isi paket tersebut tepat di bawah elemen `<select>`, dan watcher `"form.paket"` otomatis mengisi Total Harga sesuai harga paket.

```js
tambahProgress: function () {
  var waktuLocal = FormatHelper.waktuSekarang(); // Menggunakan new Date()
  this.currentDO.perjalanan.push({
    waktu: waktuLocal,
    keterangan: this.formProgress.keterangan.trim()
  });
  this.currentDO.status = this.formProgress.status;
}
```

Code di atas menjelaskan tentang fitur penambahan status progress perjalanan pengiriman, di mana data `waktu` diambil otomatis dari waktu lokal (*local time*) menggunakan objek `Date`, sedangkan `keterangan` diambil dari input pengguna.

---

## 6. Komponen Modal Konfirmasi (`js/components/app-modal.js`)

```js
konfirmasiHapus: function (item) {
  var self = this;
  this.$emit("open-modal", {
    title: "Konfirmasi Hapus Bahan Ajar",
    message: 'Apakah Anda yakin ingin menghapus bahan ajar "' + item.kode + ' - ' + item.judul + '"?',
    type: "danger",
    confirmLabel: "Ya, Hapus Data",
    cancelLabel: "Batal",
    onConfirm: function () {
      var idx = self.items.findIndex(function (s) { return s.kode === item.kode; });
      if (idx !== -1) self.items.splice(idx, 1);
    }
  });
}
```

Code di atas menjelaskan tentang alur penghapusan data bahan ajar yang terlebih dahulu menampilkan pop-up konfirmasi menggunakan komponen `<app-modal>` sebelum benar-benar menghapus item dari array `stok`.

---

## 7. Daftar Watcher yang Diterapkan (Memenuhi Indikator Minimal 2 Watcher)

1. **`filterUpbjj` (`stock-table.js`)**: Memantau perubahan filter UT-Daerah untuk mereset filter Kategori Mata Kuliah secara otomatis (*dependent options*).
2. **`searchQuery` (`stock-table.js`)**: Memantau perubahan kata kunci pencarian stok dan menampilkan log jumlah hasil secara real-time.
3. **`formData.qty` & `formData.safety` (`stock-table.js`)**: Memantau perubahan input jumlah stok terhadap safety stock di form dan menampilkan peringatan re-order secara langsung.
4. **`searchKeyword` & `currentDO.status` (`do-tracking.js`)**: Memantau input pencarian Nomor DO/NIM dan perubahan status pengiriman DO.
5. **`form.paket` (`order-form.js`)**: Memantau pilihan paket bahan ajar dan otomatis memperbarui total harga DO.
6. **`state.stok` & `state.tracking` (`app.js`)**: Deep watcher untuk menyinkronkan setiap perubahan data ke `localStorage`.

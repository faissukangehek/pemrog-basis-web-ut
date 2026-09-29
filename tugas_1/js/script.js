"use strict";

/* ============ Helper ============ */
var AUTH_KEY = "sitta_user";
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getUser()
{
  try
  {
    return JSON.parse(localStorage.getItem(AUTH_KEY));
  }
  catch (e)
  {
    return null;
  }
}

function requireAuth()
{
  if (!getUser())
  {
    window.location.href = "index.html";
    return false;
  }
  return true;
}

function logout()
{
  localStorage.removeItem(AUTH_KEY);
  window.location.href = "index.html";
}

function getGreeting(date)
{
  var h = date.getHours();

  if (h < 11)
  {
    return "pagi";
  }
  if (h < 15)
  {
    return "siang";
  }
  if (h < 18)
  {
    return "sore";
  }
  return "malam";
}

function formatTanggal(iso)
{
  var bulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  var d = new Date(iso + "T00:00:00");

  if (isNaN(d.getTime()))
  {
    return iso;
  }
  return d.getDate() + " " + bulan[d.getMonth()] + " " + d.getFullYear();
}

function hitungRekap(data)
{
  var map = {};

  data.forEach(function (b)
  {
    if (!map[b.jenisBarang])
    {
      map[b.jenisBarang] = { jenis: b.jenisBarang, jumlahJudul: 0, totalStok: 0 };
    }
    map[b.jenisBarang].jumlahJudul += 1;
    map[b.jenisBarang].totalStok += Number(b.stok) || 0;
  });

  return Object.keys(map).map(function (k)
  {
    return map[k];
  });
}

function el(id)
{
  return document.getElementById(id);
}

function setError(inputId, errId, msg)
{
  var input = el(inputId);
  var err = el(errId);

  if (err)
  {
    err.textContent = msg || "";
  }
  if (input)
  {
    input.classList.toggle("invalid", !!msg);
  }
}

/* Modal pop-up umum: pengganti alert() bawaan browser, dipakai di semua halaman.
   `aksi` opsional: daftar tombol { label, kelas, jalankan }. */
function showModal(pesan, judul, aksi)
{
  if (!aksi)
  {
    aksi = [{ label: "Tutup", kelas: "btn-primary" }];
  }

  var overlay = document.createElement("div");
  overlay.className = "modal modal-popup";
  overlay.innerHTML =
    '<div class="modal-box" role="dialog" aria-modal="true">' +
      '<h2 class="modal-title"></h2>' +
      '<p class="modal-msg"></p>' +
      '<div class="modal-actions"></div>' +
    '</div>';
  overlay.querySelector(".modal-title").textContent = judul || "Informasi";
  overlay.querySelector(".modal-msg").textContent = pesan;

  var wadah = overlay.querySelector(".modal-actions");

  function tutup()
  {
    overlay.remove();
    document.removeEventListener("keydown", onKey);
  }

  function onKey(e)
  {
    if (e.key === "Escape")
    {
      tutup();
    }
  }

  aksi.forEach(function (a)
  {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn " + (a.kelas || "btn-primary");
    btn.textContent = a.label;
    btn.addEventListener("click", function ()
    {
      tutup();

      if (a.jalankan)
      {
        a.jalankan();
      }
    });
    wadah.appendChild(btn);
  });

  overlay.addEventListener("click", function (e)
  {
    if (e.target === overlay)
    {
      tutup();
    }
  });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(overlay);

  var fokusAwal = wadah.querySelector("button");

  if (fokusAwal)
  {
    fokusAwal.focus();
  }
}

/* ============ Halaman: Login ============ */
function initLogin()
{
  var form = el("formLogin");

  function openModal(id)
  {
    var m = el(id);

    if (m)
    {
      m.hidden = false;
    }
  }

  function closeModal(m)
  {
    m.hidden = true;
  }

  el("btnLupa").addEventListener("click", function ()
  {
    setError("emailLupa", "errEmailLupa", "");
    el("formLupa").reset();
    openModal("modalLupa");
  });

  el("btnDaftar").addEventListener("click", function ()
  {
    openModal("modalDaftar");
  });

  document.querySelectorAll(".modal").forEach(function (modal)
  {
    modal.addEventListener("click", function (e)
    {
      if (e.target === modal || e.target.hasAttribute("data-close"))
      {
        closeModal(modal);
      }
    });
  });

  document.addEventListener("keydown", function (e)
  {
    if (e.key === "Escape")
    {
      document.querySelectorAll(".modal").forEach(closeModal);
    }
  });

  form.addEventListener("submit", function (e)
  {
    e.preventDefault();
    var email = el("email").value.trim();
    var pass = el("password").value;
    var ok = true;

    if (!email)
    {
      setError("email", "errEmail", "Email wajib diisi.");
      ok = false;
    }
    else if (!EMAIL_RE.test(email))
    {
      setError("email", "errEmail", "Format email tidak valid.");
      ok = false;
    }
    else
    {
      setError("email", "errEmail", "");
    }

    if (!pass)
    {
      setError("password", "errPassword", "Password wajib diisi.");
      ok = false;
    }
    else
    {
      setError("password", "errPassword", "");
    }

    if (!ok)
    {
      return;
    }

    var user = dataPengguna.find(function (u)
    {
      return u.email === email && u.password === pass;
    });

    if (!user)
    {
      showModal("Email/password yang anda masukkan salah", "Login Gagal");
      return;
    }

    var { password, ...aman } = user;
    localStorage.setItem(AUTH_KEY, JSON.stringify(aman));

    showModal("Selamat datang, " + user.nama + ". Anda akan diarahkan ke dashboard.", "Login Berhasil", []);

    setTimeout(function ()
    {
      window.location.href = "dashboard.html";
    }, 1000);
  });

  var inputLupa = el("emailLupa");

  el("formLupa").addEventListener("submit", function (e)
  {
    e.preventDefault();
    var email = inputLupa.value.trim();

    if (!email)
    {
      setError("emailLupa", "errEmailLupa", "Email wajib diisi.");
      return;
    }

    if (!EMAIL_RE.test(email))
    {
      setError("emailLupa", "errEmailLupa", "Format email tidak valid.");
      return;
    }

    var terdaftar = dataPengguna.some(function (u)
    {
      return u.email === email;
    });

    if (!terdaftar)
    {
      setError("emailLupa", "errEmailLupa", "Email tidak terdaftar.");
      return;
    }

    setError("emailLupa", "errEmailLupa", "");
    showModal("Permintaan atur ulang password dikirim ke " + email, "Lupa Password");
    el("modalLupa").hidden = true;
    this.reset();
  });

  inputLupa.addEventListener("input", function ()
  {
    setError("emailLupa", "errEmailLupa", "");
  });
}

/* ============ Halaman: Dashboard ============ */
function initDashboard()
{
  var user = getUser();
  el("userNama").textContent = user.nama;
  el("userRole").textContent = user.role + " • " + user.lokasi;
  el("greeting").textContent = "Selamat " + getGreeting(new Date()) + ", " + user.nama.split(" ")[0] + "!";
  el("todayLabel").textContent = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  el("btnLogout").addEventListener("click", function ()
  {
    showModal("Anda akan keluar dari akun ini.", "Konfirmasi Keluar", [
      { label: "Batalkan", kelas: "btn-ghost" },
      { label: "Lanjutkan", kelas: "btn-primary", jalankan: logout }
    ]);
  });

  // statistik beranda
  el("statJudul").textContent = dataBahanAjar.length;
  el("statStok").textContent = dataBahanAjar.reduce(function (s, b)
  {
    return s + (Number(b.stok) || 0);
  }, 0);
  el("statDO").textContent = Object.keys(dataTracking).length;

  var daftar = Object.keys(dataTracking).map(function (k)
  {
    return dataTracking[k];
  });

  // Monitoring Progress DO
  var tbMon = el("tabelMonitoring").querySelector("tbody");
  tbMon.innerHTML = daftar.map(function (t, i)
  {
    var statusKelas = t.status === "Selesai Antar" ? "badge-ok" : (t.status === "Dalam Perjalanan" ? "badge-warn" : "badge-info");

    return "<tr><td>" + (i + 1) + "</td><td>" + t.nomorDO + "</td><td>" + t.nama + "</td><td>" +
      t.ekspedisi + "</td><td>" + formatTanggal(t.tanggalKirim) + "</td><td><span class='badge " +
      statusKelas + "'>" + t.status + "</span></td><td>" + t.total + "</td></tr>";
  }).join("") || "<tr><td colspan='7' class='empty'>Belum ada data DO.</td></tr>";

  // Rekap Bahan Ajar
  var tbRek = el("tabelRekap").querySelector("tbody");
  tbRek.innerHTML = hitungRekap(dataBahanAjar).map(function (r)
  {
    return "<tr><td>" + r.jenis + "</td><td>" + r.jumlahJudul + "</td><td>" + r.totalStok + "</td></tr>";
  }).join("") || "<tr><td colspan='3' class='empty'>Belum ada data.</td></tr>";

  // Histori Transaksi
  var tbHis = el("tabelHistori").querySelector("tbody");
  tbHis.innerHTML = daftar.map(function (t, i)
  {
    return "<tr><td>" + (i + 1) + "</td><td>" + t.nomorDO + "</td><td>" + t.paket + "</td><td>" +
      t.ekspedisi + "</td><td>" + formatTanggal(t.tanggalKirim) + "</td><td>" + t.total + "</td></tr>";
  }).join("") || "<tr><td colspan='6' class='empty'>Belum ada transaksi.</td></tr>";

  // navigasi panel
  function showPanel(id, activeBtn)
  {
    document.querySelectorAll(".panel").forEach(function (p)
    {
      p.classList.toggle("is-active", p.id === id);
    });
    document.querySelectorAll(".nav-item,.nav-sub").forEach(function (b)
    {
      b.classList.remove("is-active");
    });

    if (activeBtn)
    {
      activeBtn.classList.add("is-active");
    }
  }

  document.querySelectorAll("[data-panel]").forEach(function (btn)
  {
    btn.addEventListener("click", function ()
    {
      showPanel(btn.getAttribute("data-panel"), btn);
    });
  });

  el("toggleLaporan").addEventListener("click", function ()
  {
    var sub = el("subLaporan");
    sub.hidden = !sub.hidden;
    this.setAttribute("aria-expanded", String(!sub.hidden));
  });

  // tautan langsung ke panel: dashboard.html#laporan / #histori
  var hash = window.location.hash;

  if (hash === "#laporan")
  {
    showPanel("panelMonitoring", document.querySelector("[data-panel='panelMonitoring']"));
    el("subLaporan").hidden = false;
  }
  else if (hash === "#histori")
  {
    showPanel("panelHistori", document.querySelector("[data-panel='panelHistori']"));
  }
}

function cariTracking(nomor)
{
  if (!nomor)
  {
    return null;
  }
  return dataTracking.hasOwnProperty(nomor) ? dataTracking[nomor] : null;
}

/* ============ Halaman: Tracking ============ */
var PROGRESS_MAP = { "Dikirim": 35, "Dalam Perjalanan": 65, "Selesai Antar": 100 };
var PERSEN_TAHAP = [PROGRESS_MAP["Dikirim"], PROGRESS_MAP["Dalam Perjalanan"], PROGRESS_MAP["Selesai Antar"]];

/* Tahap: 0 pengemasan, 1 pengiriman, 2 penerimaan — diambil dari riwayat terjauh. */
function tahapTracking(t)
{
  var pola = [
    { kunci: "Selesai Antar", tahap: 2 },
    { kunci: "Proses antar", tahap: 1 },
    { kunci: "Diteruskan", tahap: 1 },
    { kunci: "Tiba di Hub", tahap: 1 }
  ];
  var riwayat = t.perjalanan || [];
  var tahap = 0;

  riwayat.forEach(function (jejak)
  {
    pola.forEach(function (p)
    {
      if (jejak.keterangan.indexOf(p.kunci) !== -1 && p.tahap > tahap)
      {
        tahap = p.tahap;
      }
    });
  });

  if (riwayat.length === 0)
  {
    tahap = t.status === "Selesai Antar" ? 2 : (t.status === "Dalam Perjalanan" ? 1 : 0);
  }

  return tahap;
}

function initTracking()
{
  var user = getUser();
  el("userNama").textContent = user.nama;
  el("userRole").textContent = user.role + " • " + user.lokasi;
  el("btnLogout").addEventListener("click", function ()
  {
    showModal("Anda akan keluar dari akun ini.", "Konfirmasi Keluar", [
      { label: "Batalkan", kelas: "btn-ghost" },
      { label: "Lanjutkan", kelas: "btn-primary", jalankan: logout }
    ]);
  });

  el("formTracking").addEventListener("submit", function (e)
  {
    e.preventDefault();
    var nomor = el("nomorDO").value.trim();
    var hasil = el("hasilTracking");
    var kosong = el("hasilKosong");

    if (!nomor)
    {
      setError("nomorDO", "errNomor", "Nomor DO wajib diisi.");
      showModal("Nomor DO wajib diisi.", "Data Tidak Lengkap");
      return;
    }
    if (!/^\d+$/.test(nomor))
    {
      setError("nomorDO", "errNomor", "Nomor DO hanya berisi angka.");
      showModal("Nomor DO hanya berisi angka.", "Data Tidak Valid");
      return;
    }
    setError("nomorDO", "errNomor", "");

    var t = cariTracking(nomor);

    if (!t)
    {
      hasil.hidden = true;
      kosong.hidden = false;
      kosong.textContent = "Nomor DO " + nomor + " tidak ditemukan.";
      showModal("Nomor DO " + nomor + " tidak ditemukan.", "Data Tidak Ditemukan");
      return;
    }
    kosong.hidden = true;
    hasil.hidden = false;

    var langkah = tahapTracking(t);
    var persen = PERSEN_TAHAP[langkah];
    var kelas = t.status === "Selesai Antar" ? "badge-ok" : (t.status === "Dalam Perjalanan" ? "badge-warn" : "badge-info");

    el("namaPenerima").textContent = t.nama;
    el("statusText").innerHTML = "<span class='badge " + kelas + "'>" + t.status + "</span>";
    el("progressSteps").setAttribute("aria-valuenow", persen);
    document.querySelectorAll("#progressSteps .step").forEach(function (li)
    {
      var i = Number(li.getAttribute("data-step"));
      li.classList.toggle("is-done", i < langkah);
      li.classList.toggle("is-active", i === langkah);
    });
    el("ekspedisi").textContent = t.ekspedisi;
    el("tanggalKirim").textContent = formatTanggal(t.tanggalKirim);
    el("jenisPaket").textContent = t.paket;
    el("totalBayar").textContent = t.total;

    el("timeline").innerHTML = t.perjalanan.map(function (p)
    {
      return "<li><p class='t-waktu'>" + p.waktu + "</p><p class='t-ket'>" + p.keterangan + "</p></li>";
    }).join("");
  });
}

/* ============ Halaman: Stok Bahan Ajar ============ */
function renderStok()
{
  var tb = el("tabelStok").querySelector("tbody");
  tb.innerHTML = dataBahanAjar.map(function (b, i)
  {
    var stok = Number(b.stok) || 0;
    var kelas = stok === 0 ? "badge-warn" : "badge-ok";

    return "<tr><td>" + (i + 1) + "</td>" +
      "<td><img class='row-cover' src='" + b.cover + "' alt='Cover " + b.namaBarang + "'></td>" +
      "<td>" + b.kodeLokasi + "</td>" +
      "<td>" + b.kodeBarang + "</td>" +
      "<td>" + b.namaBarang + "</td>" +
      "<td>" + b.jenisBarang + "</td>" +
      "<td>" + b.edisi + "</td>" +
      "<td><span class='badge " + kelas + "'>" + stok + "</span></td></tr>";
  }).join("");

  el("totalBaris").textContent = dataBahanAjar.length;
  el("totalStok").textContent = dataBahanAjar.reduce(function (s, b)
  {
    return s + (Number(b.stok) || 0);
  }, 0);

  // fallback cover gagal muat
  tb.querySelectorAll("img.row-cover").forEach(function (img)
  {
    img.addEventListener("error", function ()
    {
      this.style.visibility = "hidden";
    });
  });
}

function validasiStok(data)
{
  var errors = {};

  if (!data.kodeLokasi.trim())
  {
    errors.kodeLokasi = "Kode lokasi wajib diisi.";
  }
  if (!data.kodeBarang.trim())
  {
    errors.kodeBarang = "Kode barang wajib diisi.";
  }
  if (!data.namaBarang.trim())
  {
    errors.namaBarang = "Nama barang wajib diisi.";
  }
  if (!data.jenisBarang.trim())
  {
    errors.jenisBarang = "Jenis barang wajib diisi.";
  }
  if (!String(data.edisi).trim())
  {
    errors.edisi = "Edisi wajib diisi.";
  }

  if (String(data.stok).trim() === "" || isNaN(Number(data.stok)))
  {
    errors.stokBarang = "Stok harus berupa angka.";
  }
  else if (Number(data.stok) < 0)
  {
    errors.stokBarang = "Stok tidak boleh negatif.";
  }
  return errors;
}

function initStok()
{
  var user = getUser();
  el("userNama").textContent = user.nama;
  el("userRole").textContent = user.role + " • " + user.lokasi;
  el("btnLogout").addEventListener("click", function ()
  {
    showModal("Anda akan keluar dari akun ini.", "Konfirmasi Keluar", [
      { label: "Batalkan", kelas: "btn-ghost" },
      { label: "Lanjutkan", kelas: "btn-primary", jalankan: logout }
    ]);
  });

  renderStok();

  var fields = {
    kodeLokasi: "errKodeLokasi",
    kodeBarang: "errKodeBarang",
    namaBarang: "errNamaBarang",
    jenisBarang: "errJenisBarang",
    edisi: "errEdisi",
    stokBarang: "errStokBarang"
  };

  el("formStok").addEventListener("submit", function (e)
  {
    e.preventDefault();
    var data = {
      kodeLokasi: el("kodeLokasi").value,
      kodeBarang: el("kodeBarang").value,
      namaBarang: el("namaBarang").value,
      jenisBarang: el("jenisBarang").value,
      edisi: el("edisi").value,
      stok: el("stokBarang").value
    };
    var errors = validasiStok(data);

    Object.keys(fields).forEach(function (key)
    {
      setError(key, fields[key], errors[key] || "");
    });

    if (Object.keys(errors).length > 0)
    {
      el("errStok").textContent = "Periksa kembali data yang belum lengkap.";
      return;
    }
    el("errStok").textContent = "";

    dataBahanAjar.push({
      kodeLokasi: data.kodeLokasi.trim(),
      kodeBarang: data.kodeBarang.trim(),
      namaBarang: data.namaBarang.trim(),
      jenisBarang: data.jenisBarang.trim(),
      edisi: String(data.edisi).trim(),
      stok: Number(data.stok),
      cover: "img/pengantar_komunikasi.jpg"
    });

    renderStok();
    this.reset();
    showModal("Data stok berhasil ditambahkan.", "Berhasil");
  });
}

/* ============ Dispatch ============ */
document.addEventListener("DOMContentLoaded", function ()
{
  var page = document.body.getAttribute("data-page");

  if (page === "login")
  {
    initLogin();
  }
  else if (page === "dashboard")
  {
    if (requireAuth())
    {
      initDashboard();
    }
  }
  else if (page === "tracking")
  {
    if (requireAuth())
    {
      initTracking();
    }
  }
  else if (page === "stok")
  {
    if (requireAuth())
    {
      initStok();
    }
  }
});

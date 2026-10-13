"use strict";

/**
 * ============================================================================
 * SITTA Universitas Terbuka — Stok Bahan Ajar App (Vue.js)
 * Tugas Praktik 2: STSI4209 Sistem Informasi Tiras & Transaksi Bahan Ajar
 * Code By k1ll | Faiz
 * ============================================================================
 */
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
    window.location.replace("index.html");
    return false;
  }
  return true;
}

function logout()
{
  localStorage.removeItem(AUTH_KEY);
  window.location.replace("index.html");
}

function getGreeting(date)
{
  var h = date.getHours();
  if (h < 11) return "pagi";
  if (h < 15) return "siang";
  if (h < 18) return "sore";
  return "malam";
}

function formatTanggal(iso)
{
  var bulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  var d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.getDate() + " " + bulan[d.getMonth()] + " " + d.getFullYear();
}

function el(id)
{
  return document.getElementById(id);
}

function setError(inputId, errId, msg)
{
  var input = el(inputId);
  var err = el(errId);
  if (err) err.textContent = msg || "";
  if (input) input.classList.toggle("invalid", !!msg);
}

/* Modal dialog umum MyUT */
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
      '<h2 class="modal-title" style="margin-top:0; font-size:1.2rem; color:var(--myut-gray-dark);">' + (judul || "Informasi") + '</h2>' +
      '<p class="modal-msg" style="margin:0.75rem 0 1.25rem; color:var(--myut-gray-dark); font-size:0.9rem; line-height:1.5;">' + pesan + '</p>' +
      '<div class="modal-actions"></div>' +
    '</div>';

  var wadah = overlay.querySelector(".modal-actions");

  function tutup()
  {
    overlay.remove();
    document.removeEventListener("keydown", onKey);
  }

  function onKey(e)
  {
    if (e.key === "Escape") tutup();
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
      if (a.jalankan) a.jalankan();
    });
    wadah.appendChild(btn);
  });

  overlay.addEventListener("click", function (e)
  {
    if (e.target === overlay) tutup();
  });

  document.addEventListener("keydown", onKey);
  document.body.appendChild(overlay);

  var fokusAwal = wadah.querySelector("button");
  if (fokusAwal) fokusAwal.focus();
}

function openModal(id)
{
  var m = el(id);
  if (m) m.hidden = false;
}

function closeModal(m)
{
  if (m) m.hidden = true;
}

/* ============ Halaman: Login (index.html) ============ */
function initLogin()
{
  var form = el("formLogin");
  if (!form) return;

  // Jika sudah login sebelumnya, langsung arahkan ke dashboard
  if (getUser())
  {
    window.location.replace("dashboard.html");
    return;
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

    if (!ok) return;

    // Pencocokan akun dengan dataPengguna di data.js
    var user = (typeof dataPengguna !== "undefined" ? dataPengguna : []).find(function (u)
    {
      return u.email === email && u.password === pass;
    });

    if (!user)
    {
      showModal("Email atau kata sandi yang Anda masukkan salah. Silakan coba kembali.", "Login Gagal");
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

    showModal("Selamat datang, " + user.nama + ". Anda akan diarahkan ke dashboard.", "Login Berhasil", []);

    setTimeout(function ()
    {
      window.location.replace("dashboard.html");
    }, 900);
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

    var terdaftar = (typeof dataPengguna !== "undefined" ? dataPengguna : []).some(function (u)
    {
      return u.email === email;
    });

    if (!terdaftar)
    {
      setError("emailLupa", "errEmailLupa", "Email tidak terdaftar.");
      return;
    }

    setError("emailLupa", "errEmailLupa", "");
    showModal("Permintaan atur ulang kata sandi telah dikirim ke " + email, "Lupa Password");
    el("modalLupa").hidden = true;
    this.reset();
  });

  inputLupa.addEventListener("input", function ()
  {
    setError("emailLupa", "errEmailLupa", "");
  });
}

/* ============ Halaman: Dashboard (dashboard.html) ============ */
function initDashboard()
{
  var user = getUser();
  if (!user) return;

  // Jika halaman dashboard menggunakan Vue instance
  if (typeof Vue !== "undefined" && el("app"))
  {
    new Vue({
      el: "#app",
      data: {
        currentUser: user,
        sidebarOpen: false,
        todayLabel: new Date().toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric"
        }),
        greeting: "Selamat " + getGreeting(new Date()) + ", " + user.nama.split(" ")[0] + "!",
        modal: {
          show: false,
          title: "Informasi",
          message: "",
          confirmLabel: "Ya, Keluar",
          cancelLabel: "Batal",
          onConfirm: null
        }
      },
      methods: {
        toggleSidebar: function ()
        {
          this.sidebarOpen = !this.sidebarOpen;
        },
        closeSidebar: function ()
        {
          this.sidebarOpen = false;
        },
        bukaModal: function (opsi)
        {
          this.modal.title = opsi.title || "Informasi";
          this.modal.message = opsi.message || "";
          this.modal.confirmLabel = opsi.confirmLabel || "Lanjutkan";
          this.modal.cancelLabel = opsi.cancelLabel || "Batal";
          this.modal.onConfirm = opsi.onConfirm || null;
          this.modal.show = true;
        },
        tutupModal: function ()
        {
          this.modal.show = false;
          this.modal.onConfirm = null;
        },
        eksekusiKonfirmasiModal: function ()
        {
          var fn = this.modal.onConfirm;
          this.tutupModal();
          if (typeof fn === "function") fn();
        },
        logout: function ()
        {
          var self = this;
          var namaUser = self.currentUser ? self.currentUser.nama : "Pengguna";
          self.bukaModal({
            title: "Konfirmasi Keluar",
            message: "Apakah Anda yakin ingin keluar dari akun " + namaUser + "?",
            confirmLabel: "Ya, Keluar",
            cancelLabel: "Batal",
            onConfirm: function ()
            {
              logout();
            }
          });
        }
      }
    });
    return;
  }

  if (el("userNama")) el("userNama").textContent = user.nama;
  if (el("userRole")) el("userRole").textContent = user.role + (user.lokasi ? " • " + user.lokasi : "");
  if (el("greeting")) el("greeting").textContent = "Selamat " + getGreeting(new Date()) + ", " + user.nama.split(" ")[0] + "!";
  if (el("todayLabel"))
  {
    el("todayLabel").textContent = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  if (el("btnLogout"))
  {
    el("btnLogout").addEventListener("click", function ()
    {
      showModal("Apakah Anda yakin ingin keluar dari akun " + user.nama + "?", "Konfirmasi Keluar", [
        { label: "Batal", kelas: "btn-ghost" },
        { label: "Ya, Keluar", kelas: "btn-primary", jalankan: logout }
      ]);
    });
  }

  // Penanganan responsif hamburger menu di mobile
  var btnHam = el("btnHamburger");
  var sidebarEl = document.querySelector(".sidebar");
  if (btnHam && sidebarEl)
  {
    btnHam.addEventListener("click", function (e)
    {
      e.stopPropagation();
      var buka = sidebarEl.classList.toggle("is-open");
      btnHam.setAttribute("aria-expanded", String(buka));
    });

    document.addEventListener("click", function (e)
    {
      if (sidebarEl.classList.contains("is-open") && !sidebarEl.contains(e.target))
      {
        sidebarEl.classList.remove("is-open");
        btnHam.setAttribute("aria-expanded", "false");
      }
    });
  }
}

/* ============ Dispatch Router ============ */
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
});

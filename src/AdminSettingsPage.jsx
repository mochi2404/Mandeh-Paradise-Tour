import { useEffect, useState } from "react";
import {
  defaultSiteSettings,
  emptySitePackages,
  getLocalSiteContent,
  loadLiveSiteContent,
  saveLiveSiteContent,
} from "./siteStore";

function normalizeSettings(settings) {
  return {
    ...defaultSiteSettings,
    ...settings,
    adminProfile: {
      ...defaultSiteSettings.adminProfile,
      ...(settings?.adminProfile ?? {}),
    },
    adminSecurity: {
      ...defaultSiteSettings.adminSecurity,
      ...(settings?.adminSecurity ?? {}),
    },
    testimonials: settings?.testimonials ?? defaultSiteSettings.testimonials,
  };
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());
}

function AdminSettingsPage() {
  const [feedback, setFeedback] = useState("");
  const [modalState, setModalState] = useState({
    open: false,
    status: "idle",
    title: "",
    message: "",
  });
  const [settings, setSettings] = useState(() =>
    normalizeSettings(getLocalSiteContent(emptySitePackages).settings || defaultSiteSettings),
  );
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    let isActive = true;

    const syncSettings = async () => {
      const content = await loadLiveSiteContent(emptySitePackages);

      if (isActive) {
        setSettings(normalizeSettings(content.settings));
      }
    };

    syncSettings();

    return () => {
      isActive = false;
    };
  }, []);

  const openModal = (status, title, message) => {
    setModalState({
      open: true,
      status,
      title,
      message,
    });
  };

  const closeModal = () => {
    setModalState((current) => ({ ...current, open: false }));
  };

  const runSavingFlow = async (actionLabel, task) => {
    openModal("loading", "Memproses", actionLabel);
    await task();
  };

  const updateField = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const updateTestimonial = (index, field, value) => {
    setSettings((current) => ({
      ...current,
      testimonials: current.testimonials.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const updateExperienceCard = (index, field, value) => {
    setSettings((current) => ({
      ...current,
      experienceCards: current.experienceCards.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const updateProfileField = (field, value) => {
    setSettings((current) => ({
      ...current,
      adminProfile: {
        ...current.adminProfile,
        [field]: value,
      },
    }));
  };

  const updatePasswordField = (field, value) => {
    setPasswordForm((current) => ({ ...current, [field]: value }));
  };

  const persistSettings = async (mode) => {
    await runSavingFlow(
      mode === "publish"
        ? "Sedang mempublikasikan pengaturan website..."
        : "Sedang menyimpan pengaturan website...",
      async () => {
        await saveLiveSiteContent({ settings }, emptySitePackages);
        setFeedback(
          mode === "publish"
            ? "Pengaturan website berhasil dipublikasikan ke halaman utama."
            : "Perubahan pengaturan berhasil disimpan.",
        );
        openModal(
          "success",
          "Berhasil",
          mode === "publish"
            ? "Pengaturan website berhasil dipublikasikan."
            : "Pengaturan website berhasil disimpan.",
        );
      },
    );
  };

  const saveProfile = async () => {
    const profile = settings.adminProfile;

    if (
      profile.fullName.trim().length < 3 ||
      !isValidEmail(profile.email) ||
      profile.phone.trim().length < 9 ||
      profile.role.trim().length < 3
    ) {
      openModal(
        "error",
        "Data belum lengkap",
        "Lengkapi nama, email valid, nomor telepon, dan role admin sebelum menyimpan profil.",
      );
      return;
    }

    await runSavingFlow("Sedang memperbarui profil admin...", async () => {
      await saveLiveSiteContent({ settings }, emptySitePackages);
      setFeedback("Profil admin berhasil diperbarui.");
      openModal("success", "Profil Diperbarui", "Profil admin berhasil disimpan.");
    });
  };

  const updatePassword = async () => {
    const savedPassword = settings.adminSecurity?.password ?? defaultSiteSettings.adminSecurity.password;

    if (passwordForm.currentPassword !== savedPassword) {
      openModal("error", "Password Salah", "Password saat ini tidak sesuai.");
      return;
    }

    if (passwordForm.newPassword.trim().length < 6) {
      openModal("error", "Password Terlalu Pendek", "Password baru minimal 6 karakter.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      openModal("error", "Konfirmasi Tidak Cocok", "Konfirmasi password baru harus sama.");
      return;
    }

    const nextSettings = {
      ...settings,
      adminSecurity: {
        ...settings.adminSecurity,
        password: passwordForm.newPassword,
        lastPasswordUpdatedAt: new Date().toLocaleString("id-ID"),
      },
    };

    await runSavingFlow("Sedang memperbarui password admin...", async () => {
      await saveLiveSiteContent({ settings: nextSettings }, emptySitePackages);
      setSettings(nextSettings);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setFeedback("Password admin berhasil diperbarui.");
      openModal("success", "Password Diperbarui", "Password admin berhasil diperbarui.");
    });
  };

  const resetAllData = async () => {
    const shouldReset = window.confirm(
      "Semua paket dan order akan dihapus. Lanjutkan reset database proyek ini?",
    );

    if (!shouldReset) {
      return;
    }

    const resetSettings = normalizeSettings(defaultSiteSettings);

    await runSavingFlow("Sedang membersihkan seluruh database proyek...", async () => {
      await saveLiveSiteContent(
        {
          packages: [],
          orders: [],
          settings: resetSettings,
        },
        emptySitePackages,
      );
      setSettings(resetSettings);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setFeedback("Database berhasil dibersihkan. Website kembali ke kondisi kosong yang aman.");
      openModal(
        "success",
        "Database Dibersihkan",
        "Semua paket dan order berhasil dihapus. Anda sekarang bisa mulai dari kondisi publish yang kosong.",
      );
    });
  };

  return (
    <div className="admin-settings-page">
      <aside className="admin-settings-sidenav">
        <div className="admin-settings-brand">
          <h1>TerraVoyage</h1>
          <p>Admin Console</p>
        </div>

        <nav className="admin-settings-nav">
          <a className="admin-settings-link" href="/admin/analytics/">
            <span className="material-symbols-outlined">analytics</span>
            <span>Analytics</span>
          </a>
          <a className="admin-settings-link" href="/admin/packages/">
            <span className="material-symbols-outlined">travel_explore</span>
            <span>Tours</span>
          </a>
          <a className="admin-settings-link" href="/admin/orders/">
            <span className="material-symbols-outlined">receipt_long</span>
            <span>Orders</span>
          </a>
          <a className="admin-settings-link active" href="/admin/settings/">
            <span className="material-symbols-outlined">settings_suggest</span>
            <span>Settings</span>
          </a>
        </nav>

        <div className="admin-settings-actions">
          <a className="admin-settings-create" href="/admin/packages/">
            <span className="material-symbols-outlined">add_circle</span>
            <span>Tambahkan Paket Baru</span>
          </a>
        </div>

        <div className="admin-settings-footer">
          <a className="admin-settings-link" href="/admin/analytics/">
            <span className="material-symbols-outlined">help_outline</span>
            <span>Support</span>
          </a>
          <a className="admin-settings-link danger" href="/admin/">
            <span className="material-symbols-outlined">logout</span>
            <span>Logout</span>
          </a>
        </div>
      </aside>

      <main className="admin-settings-main">
        <header className="admin-settings-topbar">
          <div>
            <h2>Website & Admin Settings</h2>
            <p>Atur konten website, profil admin, dan keamanan akun dari satu tempat.</p>
          </div>
          <div className="admin-settings-topbar-actions">
            <button
              className="admin-settings-outline"
              onClick={() => persistSettings("draft")}
              type="button"
            >
              Simpan
            </button>
            <button
              className="admin-settings-primary"
              onClick={() => persistSettings("publish")}
              type="button"
            >
              Publish Changes
            </button>
          </div>
        </header>

        <div className="admin-settings-content">
          {feedback ? <div className="admin-settings-feedback">{feedback}</div> : null}

          <section className="admin-settings-card admin-settings-account-card">
            <div className="admin-settings-section-head">
              <div>
                <h3>Profil Admin</h3>
                <p>Perbarui identitas admin yang tampil di panel pengelolaan.</p>
              </div>
              <button className="admin-settings-primary small" onClick={saveProfile} type="button">
                Simpan Profil
              </button>
            </div>

            <div className="admin-settings-account-layout">
              <div className="admin-settings-profile-preview">
                <img alt="Foto profil admin" src={settings.adminProfile.photo} />
                <strong>{settings.adminProfile.fullName}</strong>
                <span>{settings.adminProfile.role}</span>
                <small>{settings.adminProfile.email}</small>
              </div>

              <div className="admin-settings-grid">
                <label className="admin-settings-label">
                  <span>Nama Lengkap</span>
                  <input
                    onChange={(event) => updateProfileField("fullName", event.target.value)}
                    type="text"
                    value={settings.adminProfile.fullName}
                  />
                </label>
                <label className="admin-settings-label">
                  <span>Email Admin</span>
                  <input
                    onChange={(event) => updateProfileField("email", event.target.value)}
                    type="email"
                    value={settings.adminProfile.email}
                  />
                </label>
                <label className="admin-settings-label">
                  <span>Nomor Telepon</span>
                  <input
                    onChange={(event) => updateProfileField("phone", event.target.value)}
                    type="text"
                    value={settings.adminProfile.phone}
                  />
                </label>
                <label className="admin-settings-label">
                  <span>Role / Jabatan</span>
                  <input
                    onChange={(event) => updateProfileField("role", event.target.value)}
                    type="text"
                    value={settings.adminProfile.role}
                  />
                </label>
                <label className="admin-settings-label full">
                  <span>URL Foto Profil</span>
                  <input
                    onChange={(event) => updateProfileField("photo", event.target.value)}
                    type="text"
                    value={settings.adminProfile.photo}
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="admin-settings-card admin-settings-danger-card">
            <div className="admin-settings-section-head">
              <div>
                <h3>Reset Database Proyek</h3>
                <p>
                  Gunakan ini untuk membersihkan seluruh paket dan order agar project kembali ke kondisi kosong sebelum publish.
                </p>
              </div>
              <button className="admin-settings-danger-button" onClick={resetAllData} type="button">
                Reset Semua Data
              </button>
            </div>
          </section>

          <section className="admin-settings-card">
            <div className="admin-settings-section-head">
              <div>
                <h3>Keamanan Admin</h3>
                <p>Ganti password admin dan lihat kapan terakhir diperbarui.</p>
              </div>
              <button className="admin-settings-outline small" onClick={updatePassword} type="button">
                Update Password
              </button>
            </div>

            <div className="admin-settings-security-meta">
              <span>Password terakhir diperbarui: {settings.adminSecurity.lastPasswordUpdatedAt}</span>
            </div>

            <div className="admin-settings-grid">
              <label className="admin-settings-label">
                <span>Password Saat Ini</span>
                <input
                  onChange={(event) => updatePasswordField("currentPassword", event.target.value)}
                  type="password"
                  value={passwordForm.currentPassword}
                />
              </label>
              <label className="admin-settings-label">
                <span>Password Baru</span>
                <input
                  onChange={(event) => updatePasswordField("newPassword", event.target.value)}
                  type="password"
                  value={passwordForm.newPassword}
                />
              </label>
              <label className="admin-settings-label full">
                <span>Konfirmasi Password Baru</span>
                <input
                  onChange={(event) => updatePasswordField("confirmPassword", event.target.value)}
                  type="password"
                  value={passwordForm.confirmPassword}
                />
              </label>
            </div>
          </section>

          <section className="admin-settings-card">
            <h3>Hero Section</h3>
            <div className="admin-settings-grid">
              <label className="admin-settings-label">
                <span>Hero Title</span>
                <input
                  onChange={(event) => updateField("heroTitle", event.target.value)}
                  type="text"
                  value={settings.heroTitle}
                />
              </label>
              <label className="admin-settings-label">
                <span>Placeholder Pencarian</span>
                <input
                  onChange={(event) => updateField("heroSearchPlaceholder", event.target.value)}
                  type="text"
                  value={settings.heroSearchPlaceholder}
                />
              </label>
            </div>
            <label className="admin-settings-label">
              <span>Hero Subtitle</span>
              <textarea
                onChange={(event) => updateField("heroSubtitle", event.target.value)}
                rows="4"
                value={settings.heroSubtitle}
              />
            </label>
          </section>

          <section className="admin-settings-card">
            <h3>Section Pengalaman</h3>
            <div className="admin-settings-grid">
              <label className="admin-settings-label">
                <span>Eyebrow</span>
                <input
                  onChange={(event) => updateField("experienceEyebrow", event.target.value)}
                  type="text"
                  value={settings.experienceEyebrow}
                />
              </label>
              <label className="admin-settings-label">
                <span>Title</span>
                <input
                  onChange={(event) => updateField("experienceTitle", event.target.value)}
                  type="text"
                  value={settings.experienceTitle}
                />
              </label>
            </div>

            <div className="admin-settings-testimonials">
              {(settings.experienceCards ?? []).map((item, index) => (
                <div key={`${item.title}-${index}`} className="admin-settings-testimonial-card">
                  <label className="admin-settings-label">
                    <span>Judul Kartu {index + 1}</span>
                    <input
                      onChange={(event) => updateExperienceCard(index, "title", event.target.value)}
                      type="text"
                      value={item.title}
                    />
                  </label>
                  <label className="admin-settings-label">
                    <span>URL Gambar</span>
                    <input
                      onChange={(event) => updateExperienceCard(index, "image", event.target.value)}
                      type="text"
                      value={item.image}
                    />
                  </label>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-settings-card">
            <h3>Section Paket Populer</h3>
            <div className="admin-settings-grid">
              <label className="admin-settings-label">
                <span>Eyebrow</span>
                <input
                  onChange={(event) => updateField("featuredEyebrow", event.target.value)}
                  type="text"
                  value={settings.featuredEyebrow}
                />
              </label>
              <label className="admin-settings-label">
                <span>Title</span>
                <input
                  onChange={(event) => updateField("featuredTitle", event.target.value)}
                  type="text"
                  value={settings.featuredTitle}
                />
              </label>
            </div>
          </section>

          <section className="admin-settings-card">
            <h3>Promo Banner</h3>
            <div className="admin-settings-grid">
              <label className="admin-settings-label">
                <span>Promo Kicker</span>
                <input
                  onChange={(event) => updateField("promoKicker", event.target.value)}
                  type="text"
                  value={settings.promoKicker}
                />
              </label>
              <label className="admin-settings-label">
                <span>Promo Button</span>
                <input
                  onChange={(event) => updateField("promoButton", event.target.value)}
                  type="text"
                  value={settings.promoButton}
                />
              </label>
              <label className="admin-settings-label">
                <span>Label Info Promo</span>
                <input
                  onChange={(event) => updateField("promoInfoLabel", event.target.value)}
                  type="text"
                  value={settings.promoInfoLabel}
                />
              </label>
              <label className="admin-settings-label">
                <span>URL Gambar Promo</span>
                <input
                  onChange={(event) => updateField("promoImage", event.target.value)}
                  type="text"
                  value={settings.promoImage}
                />
              </label>
            </div>
            <label className="admin-settings-label">
              <span>Promo Title</span>
              <input
                onChange={(event) => updateField("promoTitle", event.target.value)}
                type="text"
                value={settings.promoTitle}
              />
            </label>
            <label className="admin-settings-label">
              <span>Promo Description</span>
              <textarea
                onChange={(event) => updateField("promoDescription", event.target.value)}
                rows="4"
                value={settings.promoDescription}
              />
            </label>
          </section>

          <section className="admin-settings-card preview">
            <div>
              <h3>Footer Copy</h3>
              <label className="admin-settings-label">
                <span>Footer Description</span>
                <textarea
                  onChange={(event) => updateField("footerDescription", event.target.value)}
                  rows="4"
                  value={settings.footerDescription}
                />
              </label>

              <div className="admin-settings-grid">
                <label className="admin-settings-label">
                  <span>Eyebrow Testimoni</span>
                  <input
                    onChange={(event) => updateField("testimonialsEyebrow", event.target.value)}
                    type="text"
                    value={settings.testimonialsEyebrow}
                  />
                </label>
                <label className="admin-settings-label">
                  <span>Judul Testimoni</span>
                  <input
                    onChange={(event) => updateField("testimonialsTitle", event.target.value)}
                    type="text"
                    value={settings.testimonialsTitle}
                  />
                </label>
                <label className="admin-settings-label full">
                  <span>Label Tombol Chat</span>
                  <input
                    onChange={(event) => updateField("chatButtonLabel", event.target.value)}
                    type="text"
                    value={settings.chatButtonLabel}
                  />
                </label>
              </div>

              <div className="admin-settings-testimonials">
                <h3>Testimonials</h3>
                {(settings.testimonials ?? []).map((item, index) => (
                  <div key={item.name + index} className="admin-settings-testimonial-card">
                    <label className="admin-settings-label">
                      <span>Nama</span>
                      <input
                        onChange={(event) => updateTestimonial(index, "name", event.target.value)}
                        type="text"
                        value={item.name}
                      />
                    </label>
                    <label className="admin-settings-label">
                      <span>Role</span>
                      <input
                        onChange={(event) => updateTestimonial(index, "role", event.target.value)}
                        type="text"
                        value={item.role}
                      />
                    </label>
                    <label className="admin-settings-label">
                      <span>Avatar URL</span>
                      <input
                        onChange={(event) => updateTestimonial(index, "avatar", event.target.value)}
                        type="text"
                        value={item.avatar}
                      />
                    </label>
                    <label className="admin-settings-label">
                      <span>Quote</span>
                      <textarea
                        onChange={(event) => updateTestimonial(index, "quote", event.target.value)}
                        rows="3"
                        value={item.quote}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-settings-preview-box">
              <span>Preview Ringkas</span>
              <h4>{settings.heroTitle}</h4>
              <p>{settings.heroSubtitle}</p>
              <strong>{settings.promoTitle}</strong>
              <small>{settings.footerDescription}</small>
            </div>
          </section>
        </div>
      </main>

      {modalState.open ? (
        <div className="admin-settings-modal-backdrop">
          <div className="admin-settings-modal">
            <button className="admin-settings-modal-close" onClick={closeModal} type="button">
              <span className="material-symbols-outlined">close</span>
            </button>
            <div
              className={
                modalState.status === "loading"
                  ? "admin-settings-modal-icon loading"
                  : modalState.status === "success"
                    ? "admin-settings-modal-icon success"
                    : "admin-settings-modal-icon error"
              }
            />
            <strong>{modalState.title}</strong>
            <p>{modalState.message}</p>
            <button className="admin-settings-primary" onClick={closeModal} type="button">
              Tutup
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AdminSettingsPage;

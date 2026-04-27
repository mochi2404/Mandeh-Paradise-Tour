import { useEffect, useMemo, useRef, useState } from "react";
import {
  defaultSiteSettings,
  defaultPackages,
  emptySitePackages,
  getSitePackages,
  loadLiveSiteContent,
  saveLiveSiteContent,
  uploadSiteImage,
} from "./siteStore";

const categoryOptions = [
  "Trip Privat",
  "Open Trip",
  "Luxury Adventure",
  "Wellness & Spa",
  "Cultural Heritage",
  "Eco-Tourism",
];

function formatEditableRupiah(value) {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  const normalized = digits ? Number(digits).toLocaleString("id-ID") : "0";
  return `Rp. ${normalized}`;
}

function createBlankPackage(index) {
  return {
    id: `paket-${Date.now()}`,
    title: `Paket Baru ${index}`,
    location: "Tentukan lokasi",
    destination: "Indonesia",
    category: "Trip Privat",
    duration: "3 Hari 2 Malam",
    guests: "Min. 2 Orang",
    price: "Rp. 0",
    totalPrice: "Rp. 0",
    checkoutPrice: "Rp. 0",
    rating: "4.8",
    reviews: "0 ulasan",
    dates: "Pilih tanggal keberangkatan",
    image: defaultPackages[0].image,
    heroImage: defaultPackages[0].heroImage,
    description: "Tulis ringkasan paket agar tampil rapi di halaman detail website utama.",
    gallery: [],
    itinerary: [
      {
        id: Date.now(),
        title: "Hari 1",
        body: "Isi agenda utama perjalanan pada hari pertama.",
        expanded: true,
      },
    ],
    amenities: [{ id: 1, label: "Transportasi", checked: true }],
    terms: "Tambahkan syarat dan ketentuan paket di sini.",
  };
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizePackage(pkg, fallbackIndex) {
  const gallery = pkg.gallery?.length
    ? pkg.gallery
    : [
        {
          id: 1,
          url: pkg.image ?? defaultPackages[0].image,
          alt: pkg.title ?? `Galeri paket ${fallbackIndex + 1}`,
        },
        {
          id: 2,
          url: pkg.heroImage ?? pkg.image ?? defaultPackages[0].heroImage,
          alt: `${pkg.title ?? "Paket"} hero`,
        },
      ];

  return {
    ...createBlankPackage(fallbackIndex + 1),
    ...pkg,
    id: pkg.id || slugify(pkg.title || `paket-${fallbackIndex + 1}`),
    price: formatEditableRupiah(pkg.price),
    totalPrice: formatEditableRupiah(pkg.totalPrice),
    checkoutPrice: formatEditableRupiah(pkg.checkoutPrice),
    image: pkg.image ?? gallery[0]?.url ?? defaultPackages[0].image,
    heroImage: pkg.heroImage ?? gallery[0]?.url ?? defaultPackages[0].heroImage,
    gallery,
    itinerary:
      pkg.itinerary?.map((item, index) => ({
        id: item.id ?? Date.now() + index,
        title: item.title ?? `Hari ${index + 1}`,
        body: item.body ?? "",
        expanded: item.expanded ?? true,
      })) ?? [],
    amenities:
      pkg.amenities?.map((item, index) => ({
        id: item.id ?? index + 1,
        label: item.label ?? `Fasilitas ${index + 1}`,
        checked: item.checked ?? false,
      })) ?? [],
  };
}

function AdminPackagePage() {
  const uploadInputRef = useRef(null);
  const packageTemplate = defaultPackages[0];
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");
  const [saveState, setSaveState] = useState("idle");
  const [adminProfile, setAdminProfile] = useState(() => defaultSiteSettings.adminProfile);
  const [packagesData, setPackagesData] = useState(() => {
    return getSitePackages(emptySitePackages).map(normalizePackage);
  });
  const [activePackageId, setActivePackageId] = useState(
    () => getSitePackages(emptySitePackages)[0]?.id ?? null,
  );

  const activePackage = useMemo(
    () => packagesData.find((item) => item.id === activePackageId) ?? packagesData[0],
    [activePackageId, packagesData],
  );

  const showMessage = (message) => {
    setFeedback(message);
  };

  useEffect(() => {
    let isActive = true;

    const syncPackages = async () => {
      const content = await loadLiveSiteContent(emptySitePackages);

      if (!isActive) {
        return;
      }
      const nextPackages = (content.packages ?? []).map(normalizePackage);
      setPackagesData(nextPackages);
      setAdminProfile(content.settings?.adminProfile ?? defaultSiteSettings.adminProfile);
      setActivePackageId((current) => {
        if (nextPackages.length === 0) {
          return null;
        }

        if (current && nextPackages.some((item) => item.id === current)) {
          return current;
        }

        return nextPackages[0].id;
      });
    };

    syncPackages();

    return () => {
      isActive = false;
    };
  }, []);

  const updatePackage = (updater) => {
    if (!activePackage) {
      return;
    }

    setPackagesData((currentPackages) =>
      currentPackages.map((item) =>
        item.id === activePackage.id ? updater(item) : item,
      ),
    );
  };

  const updateField = (field, value) => {
    updatePackage((item) => ({ ...item, [field]: value }));
  };

  const updatePriceField = (field, value) => {
    updateField(field, formatEditableRupiah(value));
  };

  const persistPackages = async (mode) => {
    setIsSaving(true);
    setSaveState("loading");
    setSaveLabel(mode === "publish" ? "Sedang mempublikasikan paket..." : "Sedang menyimpan draft...");

    await saveLiveSiteContent({ packages: packagesData }, emptySitePackages);

    setSaveState("success");
    setSaveLabel(
      mode === "publish"
        ? "Paket berhasil dipublikasikan ke website utama."
        : "Draft paket berhasil disimpan.",
    );
    showMessage(
      mode === "publish"
        ? "Paket berhasil dipublikasikan dan sinkron ke website utama."
        : "Perubahan paket berhasil disimpan sebagai draft lokal.",
    );

    window.setTimeout(() => {
      setIsSaving(false);
      setSaveState("idle");
      setSaveLabel("");
    }, 1400);
  };

  const createPackage = () => {
    const newPackage = createBlankPackage(packagesData.length + 1);
    setPackagesData((current) => [...current, newPackage]);
    setActivePackageId(newPackage.id);
    showMessage("Paket baru dibuat. Silakan lengkapi detailnya.");
  };

  const deletePackage = async () => {
    if (!activePackage) {
      return;
    }

    const shouldDelete = window.confirm(
      `Hapus paket "${activePackage.title}" dari database? Tindakan ini tidak bisa dibatalkan.`,
    );

    if (!shouldDelete) {
      return;
    }

    const nextPackages = packagesData.filter((item) => item.id !== activePackage.id);
    setPackagesData(nextPackages);
    setActivePackageId(nextPackages[0]?.id ?? null);
    await saveLiveSiteContent({ packages: nextPackages }, emptySitePackages);
    showMessage("Paket berhasil dihapus dan sinkron ke website utama.");
  };

  const addGalleryImage = () => {
    updatePackage((item) => {
      const nextId = Math.max(...item.gallery.map((image) => image.id), 0) + 1;
      const nextUrl = item.heroImage || item.image || packageTemplate.heroImage;
      return {
        ...item,
        gallery: [
          ...item.gallery,
          {
            id: nextId,
            url: nextUrl,
            alt: `${item.title} ${nextId}`,
          },
        ],
      };
    });
    showMessage("Foto galeri baru ditambahkan.");
  };

  const removeGalleryImage = (imageId) => {
    updatePackage((item) => {
      const nextGallery = item.gallery.filter((image) => image.id !== imageId);
      const nextMainImage = nextGallery[0]?.url ?? packageTemplate.heroImage;
      return {
        ...item,
        gallery: nextGallery,
        image: nextGallery[0]?.url ?? nextMainImage,
        heroImage:
          item.gallery.find((image) => image.id === imageId)?.url === item.heroImage
            ? nextMainImage
            : item.heroImage,
      };
    });
    showMessage("Foto galeri dihapus.");
  };

  const setMainImage = (imageUrl) => {
    updatePackage((item) => ({
      ...item,
      image: imageUrl,
      heroImage: imageUrl,
    }));
    showMessage("Foto utama paket diperbarui.");
  };

  const updateGalleryUrl = (imageId, value) => {
    updatePackage((item) => {
      const nextGallery = item.gallery.map((image) =>
        image.id === imageId ? { ...image, url: value } : image,
      );
      const changedImage = nextGallery.find((image) => image.id === imageId);
      const isMainImage =
        item.gallery.find((image) => image.id === imageId)?.url === item.heroImage;

      return {
        ...item,
        gallery: nextGallery,
        image: imageId === nextGallery[0]?.id ? value : item.image,
        heroImage: isMainImage ? changedImage?.url ?? item.heroImage : item.heroImage,
      };
    });
  };

  const handleOpenUpload = () => {
    uploadInputRef.current?.click();
  };

  const handleUploadImage = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsSaving(true);
    setSaveState("loading");
    setSaveLabel("Sedang mengunggah gambar paket...");

    const uploadedUrl = await uploadSiteImage(file);

    updatePackage((item) => {
      const nextId = Math.max(...item.gallery.map((image) => image.id), 0) + 1;
      return {
        ...item,
        image: item.image || uploadedUrl,
        heroImage: item.heroImage || uploadedUrl,
        gallery: [
          ...item.gallery,
          {
            id: nextId,
            url: uploadedUrl,
            alt: `${item.title} ${nextId}`,
          },
        ],
      };
    });

    event.target.value = "";
    setSaveState("success");
    setSaveLabel("Gambar berhasil diunggah.");
    window.setTimeout(() => {
      setIsSaving(false);
      setSaveState("idle");
      setSaveLabel("");
    }, 1200);
    showMessage("Gambar berhasil diunggah dan siap dipakai.");
  };

  const addItineraryDay = () => {
    updatePackage((item) => ({
      ...item,
      itinerary: [
        ...item.itinerary,
        {
          id: Date.now(),
          title: `Hari ${item.itinerary.length + 1}`,
          body: "",
          expanded: true,
        },
      ],
    }));
    showMessage("Hari itinerary baru ditambahkan.");
  };

  const toggleItinerary = (id) => {
    updatePackage((item) => ({
      ...item,
      itinerary: item.itinerary.map((day) =>
        day.id === id ? { ...day, expanded: !day.expanded } : day,
      ),
    }));
  };

  const updateItineraryField = (id, field, value) => {
    updatePackage((item) => ({
      ...item,
      itinerary: item.itinerary.map((day) =>
        day.id === id ? { ...day, [field]: value } : day,
      ),
    }));
  };

  const removeItineraryDay = (id) => {
    updatePackage((item) => ({
      ...item,
      itinerary: item.itinerary.filter((day) => day.id !== id),
    }));
    showMessage("Hari itinerary dihapus.");
  };

  const toggleAmenity = (id) => {
    updatePackage((item) => ({
      ...item,
      amenities: item.amenities.map((facility) =>
        facility.id === id ? { ...facility, checked: !facility.checked } : facility,
      ),
    }));
  };

  const updateAmenityLabel = (id, value) => {
    updatePackage((item) => ({
      ...item,
      amenities: item.amenities.map((facility) =>
        facility.id === id ? { ...facility, label: value } : facility,
      ),
    }));
  };

  const addAmenity = () => {
    updatePackage((item) => ({
      ...item,
      amenities: [
        ...item.amenities,
        {
          id: Math.max(...item.amenities.map((facility) => facility.id), 0) + 1,
          label: `Fasilitas ${item.amenities.length + 1}`,
          checked: false,
        },
      ],
    }));
    showMessage("Fasilitas baru ditambahkan.");
  };

  const removeAmenity = (id) => {
    updatePackage((item) => ({
      ...item,
      amenities: item.amenities.filter((facility) => facility.id !== id),
    }));
    showMessage("Fasilitas paket dihapus.");
  };

  return (
    <div className="admin-package-page">
      <aside className="admin-sidenav">
        <div className="admin-sidenav-brand">
          <h1>TerraVoyage</h1>
          <p>Admin Console</p>
        </div>

        <nav className="admin-sidenav-nav">
          <a className="admin-sidenav-link" href="/admin/analytics/">
            <span className="material-symbols-outlined">analytics</span>
            <span>Analytics</span>
          </a>
          <a className="admin-sidenav-link active" href="/admin/packages/">
            <span className="material-symbols-outlined">travel_explore</span>
            <span>Tours</span>
          </a>
          <a className="admin-sidenav-link" href="/admin/orders/">
            <span className="material-symbols-outlined">receipt_long</span>
            <span>Orders</span>
          </a>
          <a className="admin-sidenav-link" href="/admin/settings/">
            <span className="material-symbols-outlined">settings_suggest</span>
            <span>Settings</span>
          </a>
        </nav>

        <div className="admin-sidenav-actions">
          <button className="admin-primary-button" onClick={createPackage} type="button">
            <span className="material-symbols-outlined">add</span>
            <span>Tambahkan Paket Baru</span>
          </button>
        </div>

        <div className="admin-sidenav-footer">
          <button
            className="admin-sidenav-link"
            onClick={() => showMessage("Pusat bantuan akan segera tersedia.")}
            type="button"
          >
            <span className="material-symbols-outlined">help_outline</span>
            <span>Support</span>
          </button>
          <a className="admin-sidenav-link danger" href="/admin/">
            <span className="material-symbols-outlined">logout</span>
            <span>Logout</span>
          </a>
        </div>
      </aside>

      <div className="admin-main-shell">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <h2>Edit Tour Package</h2>
            <div className="admin-topbar-links">
              <a href="/admin/analytics/">Dashboard</a>
              <a className="active" href="/admin/packages/">
                Packages
              </a>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <button
              className="admin-outline-button danger"
              onClick={deletePackage}
              type="button"
            >
              Hapus Paket
            </button>
            <button
              className="admin-outline-button"
              onClick={() => persistPackages("draft")}
              type="button"
            >
              Simpan Draft
            </button>
            <button
              className="admin-accent-button"
              onClick={() => persistPackages("publish")}
              type="button"
            >
              Publikasikan Paket
            </button>
            <div className="admin-icon-group">
              <button
                className="admin-icon-button"
                onClick={() => showMessage("Notifikasi admin akan segera tersedia.")}
                type="button"
              >
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button
                className="admin-icon-button"
                onClick={() => showMessage("Mode gelap akan segera tersedia.")}
                type="button"
              >
                <span className="material-symbols-outlined">dark_mode</span>
              </button>
            </div>
            <div className="admin-topbar-profile">
              <img alt="Profil admin" src={adminProfile.photo} />
              <div>
                <strong>{adminProfile.fullName}</strong>
                <span>{adminProfile.role}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="admin-package-content">
          {feedback ? <div className="admin-page-feedback">{feedback}</div> : null}
          {!activePackage ? (
            <section className="admin-card admin-empty-package-state">
              <h3>
                <span className="material-symbols-outlined">inventory_2</span>
                Belum Ada Paket Wisata
              </h3>
              <p>
                Database paket sekarang bersih. Anda bisa mulai membuat paket pertama,
                lalu publish agar halaman user langsung sinkron menampilkan data tersebut.
              </p>
              <div className="admin-empty-package-actions">
                <button className="admin-primary-button inline" onClick={createPackage} type="button">
                  <span className="material-symbols-outlined">add</span>
                  <span>Buat Paket Pertama</span>
                </button>
              </div>
            </section>
          ) : (
          <form className="admin-package-grid">
            <div className="admin-package-left">
              <section className="admin-card">
                <h3>
                  <span className="material-symbols-outlined">list_alt</span>
                  Paket Aktif
                </h3>

                <div className="admin-form-stack">
                  <label className="admin-label">
                    <span>Pilih Paket untuk Diedit</span>
                    <select
                      onChange={(event) => setActivePackageId(event.target.value)}
                      value={activePackage.id}
                    >
                      {packagesData.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              <section className="admin-card">
                <h3>
                  <span className="material-symbols-outlined">info</span>
                  Basic Information
                </h3>

                <div className="admin-form-stack">
                  <label className="admin-label">
                    <span>Package Name</span>
                    <input
                      onChange={(event) => updateField("title", event.target.value)}
                      type="text"
                      value={activePackage.title}
                    />
                  </label>

                  <div className="admin-two-col">
                    <label className="admin-label">
                      <span>Category</span>
                      <select
                        onChange={(event) => updateField("category", event.target.value)}
                        value={activePackage.category}
                      >
                        {categoryOptions.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                    </label>

                    <label className="admin-label">
                      <span>Location</span>
                      <div className="admin-icon-input">
                        <span className="material-symbols-outlined">location_on</span>
                        <input
                          onChange={(event) => updateField("location", event.target.value)}
                          type="text"
                          value={activePackage.location}
                        />
                      </div>
                    </label>
                  </div>

                  <div className="admin-two-col">
                    <label className="admin-label">
                      <span>Destination Label</span>
                      <input
                        onChange={(event) => updateField("destination", event.target.value)}
                        type="text"
                        value={activePackage.destination}
                      />
                    </label>

                    <label className="admin-label">
                      <span>Travel Dates</span>
                      <input
                        onChange={(event) => updateField("dates", event.target.value)}
                        type="text"
                        value={activePackage.dates}
                      />
                    </label>
                  </div>

                  <div className="admin-two-col">
                    <label className="admin-label">
                      <span>Duration</span>
                      <input
                        onChange={(event) => updateField("duration", event.target.value)}
                        type="text"
                        value={activePackage.duration}
                      />
                    </label>

                    <label className="admin-label">
                      <span>Guests</span>
                      <input
                        onChange={(event) => updateField("guests", event.target.value)}
                        type="text"
                        value={activePackage.guests}
                      />
                    </label>
                  </div>

                  <div className="admin-two-col">
                    <label className="admin-label">
                      <span>Harga Paket</span>
                      <div className="admin-price-input">
                        <input
                          inputMode="numeric"
                          onChange={(event) => updatePriceField("price", event.target.value)}
                          type="text"
                          value={activePackage.price}
                        />
                      </div>
                    </label>

                    <label className="admin-label">
                      <span>Rating & Reviews</span>
                      <div className="admin-two-col compact">
                        <input
                          onChange={(event) => updateField("rating", event.target.value)}
                          type="text"
                          value={activePackage.rating}
                        />
                        <input
                          onChange={(event) => updateField("reviews", event.target.value)}
                          type="text"
                          value={activePackage.reviews}
                        />
                      </div>
                    </label>
                  </div>

                  <label className="admin-label">
                    <span>Description</span>
                    <textarea
                      onChange={(event) => updateField("description", event.target.value)}
                      rows="6"
                      value={activePackage.description}
                    />
                  </label>
                </div>
              </section>

              <section className="admin-card">
                <h3>
                  <span className="material-symbols-outlined">photo_library</span>
                  Package Gallery
                </h3>

                <input
                  ref={uploadInputRef}
                  accept="image/*"
                  hidden
                  onChange={handleUploadImage}
                  type="file"
                />

                <div className="admin-gallery-grid">
                  {activePackage.gallery.map((image) => (
                    <div
                      key={image.id}
                      className={
                        image.url === activePackage.heroImage
                          ? "admin-gallery-card main"
                          : "admin-gallery-card"
                      }
                    >
                      <img alt={image.alt} src={image.url} />
                      <div className="admin-gallery-actions">
                        <button
                          className="admin-gallery-action"
                          onClick={() => setMainImage(image.url)}
                          type="button"
                        >
                          {image.url === activePackage.heroImage ? "MAIN" : "Set Main"}
                        </button>
                        {activePackage.gallery.length > 1 ? (
                          <button
                            className="admin-gallery-remove"
                            onClick={() => removeGalleryImage(image.id)}
                            type="button"
                          >
                            <span className="material-symbols-outlined">close</span>
                          </button>
                        ) : null}
                      </div>
                      <input
                        onChange={(event) => updateGalleryUrl(image.id, event.target.value)}
                        type="text"
                        value={image.url}
                      />
                    </div>
                  ))}

                  <button className="admin-gallery-add" onClick={addGalleryImage} type="button">
                    <span className="material-symbols-outlined">add_photo_alternate</span>
                    <span>Add Photo</span>
                  </button>
                  <button className="admin-gallery-add" onClick={handleOpenUpload} type="button">
                    <span className="material-symbols-outlined">upload</span>
                    <span>Upload Image</span>
                  </button>
                </div>
              </section>

              <section className="admin-card">
                <div className="admin-card-head">
                  <h3>
                    <span className="material-symbols-outlined">route</span>
                    Daily Itinerary
                  </h3>
                  <button className="admin-text-button" onClick={addItineraryDay} type="button">
                    <span className="material-symbols-outlined">add_circle</span>
                    <span>Add Day</span>
                  </button>
                </div>

                <div className="admin-itinerary-list">
                  {activePackage.itinerary.map((day, index) => (
                    <div key={day.id} className="admin-itinerary-card">
                      <div className="admin-itinerary-head">
                        <div className="admin-itinerary-title">
                          <span className={day.expanded ? "admin-day-badge active" : "admin-day-badge"}>
                            {index + 1}
                          </span>
                          <input
                            onChange={(event) =>
                              updateItineraryField(day.id, "title", event.target.value)
                            }
                            type="text"
                            value={day.title}
                          />
                        </div>
                        <div className="admin-itinerary-actions">
                          <button onClick={() => toggleItinerary(day.id)} type="button">
                            <span className="material-symbols-outlined">
                              {day.expanded ? "expand_less" : "expand_more"}
                            </span>
                          </button>
                          {activePackage.itinerary.length > 1 ? (
                            <button onClick={() => removeItineraryDay(day.id)} type="button">
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {day.expanded ? (
                        <div className="admin-itinerary-body">
                          <textarea
                            onChange={(event) =>
                              updateItineraryField(day.id, "body", event.target.value)
                            }
                            rows="3"
                            value={day.body}
                          />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="admin-package-right">
              <section className="admin-card">
                <h4>Pricing & Plan</h4>

                <div className="admin-form-stack">
                  <label className="admin-label">
                    <span>Harga Mulai Dari</span>
                    <div className="admin-price-input">
                      <input
                        inputMode="numeric"
                        onChange={(event) => updatePriceField("price", event.target.value)}
                        type="text"
                        value={activePackage.price}
                      />
                    </div>
                  </label>

                  <div className="admin-two-col compact">
                    <label className="admin-label">
                      <span>Duration Label</span>
                      <input
                        onChange={(event) => updateField("duration", event.target.value)}
                        type="text"
                        value={activePackage.duration}
                      />
                    </label>
                    <label className="admin-label">
                      <span>Guest Label</span>
                      <input
                        onChange={(event) => updateField("guests", event.target.value)}
                        type="text"
                        value={activePackage.guests}
                      />
                    </label>
                  </div>
                </div>
              </section>

              <section className="admin-card">
                <h4>Included Amenities</h4>

                <div className="admin-amenity-list">
                  {activePackage.amenities.map((item) => (
                    <div key={item.id} className="admin-amenity-item">
                      <label className="admin-amenity-toggle">
                        <input
                          checked={item.checked}
                          onChange={() => toggleAmenity(item.id)}
                          type="checkbox"
                        />
                      </label>
                      <input
                        className="admin-amenity-input"
                        onChange={(event) => updateAmenityLabel(item.id, event.target.value)}
                        type="text"
                        value={item.label}
                      />
                      {activePackage.amenities.length > 1 ? (
                        <button
                          className="admin-amenity-remove"
                          onClick={() => removeAmenity(item.id)}
                          type="button"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      ) : null}
                    </div>
                  ))}

                  <button className="admin-text-button" onClick={addAmenity} type="button">
                    <span className="material-symbols-outlined">add</span>
                    <span>Add New Facility</span>
                  </button>
                </div>
              </section>

              <section className="admin-card">
                <h4>Location Preview</h4>

                <div className="admin-map-preview">
                  <img
                    alt="Minimal stylized map texture"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqSn8l0HIbYlce0iGhQD8FhkYbUMe3b2WkkGbDlos57O_mxMBmwIU6SIwt75FQ1QzzJ5oTL22R1aFLmlFlt1of8qtjhn3jO26fGv3_n2YGkellIYOtLAl86igywdfuvfhKhZERh7z-cnUovNzIaG_ZlGKgJzRjBTKLakTZqRe8o5XtVrteZfFY0VVmWn4ObkPekl-FEt59RI3dgZsqNKovn7fTYXRB0oJakA6wl5Sg1XXgiREYYbBZUjiJlXtBHMm1tssgGKSaNbNi"
                  />
                  <span className="material-symbols-outlined">location_pin</span>
                </div>

                <label className="admin-label">
                  <span>Terms & Conditions</span>
                  <textarea
                    onChange={(event) => updateField("terms", event.target.value)}
                    rows="5"
                    value={activePackage.terms}
                  />
                </label>

                <div className="admin-package-summary">
                  <p>
                    <strong>{activePackage.title}</strong>
                  </p>
                  <p>{activePackage.category}</p>
                  <p>{activePackage.location}</p>
                  <p>{`${activePackage.price} - ${activePackage.duration} - ${activePackage.guests}`}</p>
                  <p>Main Image: {activePackage.heroImage ? "Sudah dipilih" : "Belum ada"}</p>
                </div>
              </section>
            </div>
          </form>
          )}
        </main>
      </div>

      {isSaving ? (
        <div className="admin-saving-overlay" role="status" aria-live="polite">
          <div className="admin-saving-modal">
            <div className={saveState === "success" ? "admin-saving-spinner success" : "admin-saving-spinner"} />
            <strong>{saveState === "success" ? "Berhasil" : "Memproses"}</strong>
            <p>{saveLabel}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AdminPackagePage;

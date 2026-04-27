import { useEffect, useMemo, useState } from "react";
import {
  defaultSiteSettings,
  defaultAdminOrders,
  emptySitePackages,
  getAdminOrders,
  loadLiveSiteContent,
} from "./siteStore";

const monthlyBars = [
  { label: "Jan", height: "32%" },
  { label: "Feb", height: "42%" },
  { label: "Mar", height: "56%" },
  { label: "Apr", height: "48%" },
  { label: "May", height: "70%" },
  { label: "Jun", height: "80%" },
  { label: "Jul", height: "100%", active: true },
];

function parseMoney(value) {
  return Number(String(value ?? "").replace(/[^\d]/g, "")) || 0;
}

function formatCompactRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function AdminAnalyticsPage() {
  const [feedback, setFeedback] = useState("");
  const [orders, setOrders] = useState(() => getAdminOrders() || defaultAdminOrders);
  const [adminProfile, setAdminProfile] = useState(() => defaultSiteSettings.adminProfile);

  useEffect(() => {
    let isActive = true;

    const syncAnalytics = async () => {
      const content = await loadLiveSiteContent(emptySitePackages);

      if (!isActive) {
        return;
      }

      setOrders(content.orders ?? []);
      setAdminProfile(content.settings?.adminProfile ?? defaultSiteSettings.adminProfile);
    };

    syncAnalytics();

    return () => {
      isActive = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, item) => sum + parseMoney(item.total), 0);
    const totalBookings = orders.length;
    const confirmedOrders = orders.filter(
      (item) => item.status === "confirmed" || item.status === "paid",
    ).length;
    const pendingOrders = orders.filter((item) => item.status === "pending").length;
    const conversionRate =
      totalBookings > 0 ? `${Math.round((confirmedOrders / totalBookings) * 100)}%` : "0%";
    const retentionRate =
      totalBookings > 0 ? `${Math.max(0, 100 - pendingOrders * 10)}%` : "0%";

    const destinationCounts = orders.reduce((accumulator, item) => {
      const label = item.packageTitle || "Belum dikategorikan";
      accumulator[label] = (accumulator[label] ?? 0) + 1;
      return accumulator;
    }, {});

    return {
      totalRevenue,
      totalBookings,
      conversionRate,
      retentionRate,
      destinationCounts,
    };
  }, [orders]);

  const destinationEntries = Object.entries(metrics.destinationCounts).slice(0, 3);

  const showMessage = (message) => {
    setFeedback(message);
  };

  return (
    <div className="admin-analytics-page">
      <aside className="admin-analytics-sidenav">
        <div className="admin-analytics-brand">
          <h1>TerraVoyage</h1>
          <p>Admin Console</p>
        </div>

        <nav className="admin-analytics-nav">
          <a className="admin-analytics-link active" href="/admin/analytics/">
            <span className="material-symbols-outlined">analytics</span>
            <span>Analytics</span>
          </a>
          <a className="admin-analytics-link" href="/admin/packages/">
            <span className="material-symbols-outlined">travel_explore</span>
            <span>Tours</span>
          </a>
          <a className="admin-analytics-link" href="/admin/orders/">
            <span className="material-symbols-outlined">receipt_long</span>
            <span>Orders</span>
          </a>
          <a className="admin-analytics-link" href="/admin/settings/">
            <span className="material-symbols-outlined">settings_suggest</span>
            <span>Settings</span>
          </a>
        </nav>

        <div className="admin-analytics-actions">
          <a className="admin-analytics-create" href="/admin/packages/">
            <span className="material-symbols-outlined">add_circle</span>
            <span>Tambahkan Paket Baru</span>
          </a>
        </div>

        <div className="admin-analytics-footer">
          <button
            className="admin-analytics-link"
            onClick={() => showMessage("Halaman support akan segera tersedia.")}
            type="button"
          >
            <span className="material-symbols-outlined">help_outline</span>
            <span>Support</span>
          </button>
          <a className="admin-analytics-link danger" href="/admin/">
            <span className="material-symbols-outlined">logout</span>
            <span>Logout</span>
          </a>
        </div>
      </aside>

      <main className="admin-analytics-main">
        <header className="admin-analytics-topbar">
          <div className="admin-analytics-topbar-left">
            <div className="admin-analytics-search">
              <span className="material-symbols-outlined">search</span>
              <input placeholder="Cari analytics..." type="text" />
            </div>
            <nav className="admin-analytics-topnav">
              <a className="active" href="/admin/analytics/">
                Dashboard
              </a>
              <a href="/admin/orders/">Orders</a>
            </nav>
          </div>

          <div className="admin-analytics-topbar-right">
            <button
              className="admin-analytics-icon notification"
              onClick={() => showMessage("Notifikasi analytics dibuka.")}
              type="button"
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="admin-analytics-dot" />
            </button>
            <button
              className="admin-analytics-icon"
              onClick={() => showMessage("Mode gelap akan segera tersedia.")}
              type="button"
            >
              <span className="material-symbols-outlined">dark_mode</span>
            </button>
            <div className="admin-analytics-divider" />
            <div className="admin-analytics-profile">
              <div className="admin-analytics-profile-copy">
                <p>{adminProfile.fullName}</p>
                <span>{adminProfile.role}</span>
              </div>
              <img
                alt="Administrator profile"
                src={adminProfile.photo}
              />
            </div>
          </div>
        </header>

        <div className="admin-analytics-content">
          {feedback ? <div className="admin-analytics-feedback">{feedback}</div> : null}

          <section className="admin-analytics-header">
            <div>
              <h2>Sales Analytics</h2>
              <p>Ringkasan performa realtime berdasarkan transaksi asli yang masuk dari website utama.</p>
            </div>
            <div className="admin-analytics-header-actions">
              <button
                className="admin-analytics-outline"
                onClick={() => showMessage("Laporan PDF sedang disiapkan.")}
                type="button"
              >
                <span className="material-symbols-outlined">file_download</span>
                <span>Export PDF</span>
              </button>
              <button
                className="admin-analytics-outline"
                onClick={() => showMessage("Laporan Excel sedang disiapkan.")}
                type="button"
              >
                <span className="material-symbols-outlined">table_chart</span>
                <span>Export Excel</span>
              </button>
            </div>
          </section>

          <section className="admin-analytics-kpis">
            <article className="admin-kpi-card featured">
              <div className="admin-kpi-top">
                <span className="material-symbols-outlined">payments</span>
                <span className="admin-kpi-badge positive">Live</span>
              </div>
              <div>
                <p>Total Revenue</p>
                <h3>{formatCompactRupiah(metrics.totalRevenue)}</h3>
              </div>
            </article>

            <article className="admin-kpi-card">
              <div className="admin-kpi-top">
                <span className="material-symbols-outlined secondary">ads_click</span>
                <span className="admin-kpi-delta positive">Sync</span>
              </div>
              <div>
                <p>Conversion Rate</p>
                <h3>{metrics.conversionRate}</h3>
              </div>
            </article>

            <article className="admin-kpi-card">
              <div className="admin-kpi-top">
                <span className="material-symbols-outlined tertiary">book_online</span>
                <span className="admin-kpi-delta positive">Orders</span>
              </div>
              <div>
                <p>Total Bookings</p>
                <h3>{metrics.totalBookings}</h3>
              </div>
            </article>

            <article className="admin-kpi-card">
              <div className="admin-kpi-top">
                <span className="material-symbols-outlined muted">groups</span>
                <span className="admin-kpi-delta positive">Stable</span>
              </div>
              <div>
                <p>Retention Rate</p>
                <h3>{metrics.retentionRate}</h3>
              </div>
            </article>
          </section>

          <section className="admin-analytics-charts">
            <article className="admin-analytics-card revenue">
              <div className="admin-analytics-card-head">
                <h4>Monthly Revenue Trend</h4>
                <div className="admin-toggle-pill">
                  <button className="active" type="button">
                    Monthly
                  </button>
                  <button
                    onClick={() => showMessage("Mode weekly akan segera tersedia.")}
                    type="button"
                  >
                    Weekly
                  </button>
                </div>
              </div>

              <div className="admin-revenue-chart">
                {monthlyBars.map((bar) => (
                  <div
                    key={bar.label}
                    className={bar.active ? "admin-revenue-bar active" : "admin-revenue-bar"}
                    style={{ height: metrics.totalBookings > 0 ? bar.height : "18%" }}
                  >
                    {bar.active ? <span>{formatCompactRupiah(metrics.totalRevenue)}</span> : null}
                  </div>
                ))}
              </div>

              <div className="admin-revenue-labels">
                {monthlyBars.map((bar) => (
                  <span key={bar.label}>{bar.label}</span>
                ))}
              </div>
            </article>

            <article className="admin-analytics-card destinations">
              <h4>Popular Destinations</h4>

              {destinationEntries.length > 0 ? (
                <>
                  <div className="admin-pie-wrap">
                    <svg className="admin-pie-chart" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        fill="transparent"
                        r="16"
                        stroke="#154212"
                        strokeDasharray="45 100"
                        strokeWidth="4"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        fill="transparent"
                        r="16"
                        stroke="#356382"
                        strokeDasharray="30 100"
                        strokeDashoffset="-45"
                        strokeWidth="4"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        fill="transparent"
                        r="16"
                        stroke="#735c00"
                        strokeDasharray="25 100"
                        strokeDashoffset="-75"
                        strokeWidth="4"
                      />
                    </svg>
                  </div>

                  <div className="admin-destination-list">
                    {destinationEntries.map(([label, count], index) => (
                      <div key={label}>
                        <span
                          className={
                            index === 0
                              ? "dot primary"
                              : index === 1
                                ? "dot secondary"
                                : "dot tertiary"
                          }
                        />
                        <span>{label}</span>
                        <strong>{count}</strong>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="admin-analytics-empty-inline">
                  <span className="material-symbols-outlined">travel_explore</span>
                  <p>Belum ada destinasi populer karena transaksi masih kosong.</p>
                </div>
              )}
            </article>
          </section>

          <section className="admin-promo-card">
            <img
              alt="Majestic mountain peak"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWFSxtSdxPpmyJyOrXXVzD_E9dbukHwuNk41FccRLX8Zl5Tjxya7PLsFK55msTaubAaaMPJ9XI68w3fLAK1x80w3whkqQTfLUfvY8mj2vtTDlm9ZTdbdTO94PElSd-H4FAielvxtGhEa8klvxpc22Aow37Ba12SVvQ2EUf2X3CWyN89CwXIK73mNpvwoSCat3Wk_XojlKnzXIY4a2-plJkzxLba0RdAbgne52UJGT7j-OpfuSD-_Z711ra-ea3IzPfNkc8eYlvbRIi"
            />
            <div className="admin-promo-overlay">
              <div>
                <h4>Fokuskan analitik pada order nyata, bukan data contoh.</h4>
                <p>
                  Daftar transaksi terbaru sekarang dipusatkan di halaman Orders agar tim admin bisa
                  membaca detail pemesan dengan lebih cepat.
                </p>
                <a href="/admin/orders/">Buka Halaman Orders</a>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default AdminAnalyticsPage;

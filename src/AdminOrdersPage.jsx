import { useEffect, useMemo, useState } from "react";
import {
  defaultSiteSettings,
  defaultAdminOrders,
  emptySitePackages,
  getAdminOrders,
  loadLiveSiteContent,
  saveLiveSiteContent,
} from "./siteStore";

function formatStatusLabel(status) {
  switch (status) {
    case "confirmed":
      return "Dikonfirmasi";
    case "paid":
      return "Sudah Bayar";
    case "expired":
      return "Kadaluarsa";
    case "cancelled":
      return "Dibatalkan";
    default:
      return "Menunggu";
  }
}

function formatStatusTone(status) {
  if (status === "confirmed" || status === "paid") {
    return "success";
  }

  if (status === "cancelled" || status === "expired") {
    return "cancelled";
  }

  return "pending";
}

function AdminOrdersPage() {
  const [feedback, setFeedback] = useState("");
  const [orders, setOrders] = useState(() => getAdminOrders() || defaultAdminOrders);
  const [adminProfile, setAdminProfile] = useState(() => defaultSiteSettings.adminProfile);

  const sortedOrders = useMemo(
    () => [...orders].sort((first, second) => String(second.id).localeCompare(String(first.id))),
    [orders],
  );

  useEffect(() => {
    let isActive = true;

    const syncOrders = async () => {
      const content = await loadLiveSiteContent(emptySitePackages);

      if (!isActive) {
        return;
      }

      setOrders(content.orders ?? []);
      setAdminProfile(content.settings?.adminProfile ?? defaultSiteSettings.adminProfile);
    };

    syncOrders();

    return () => {
      isActive = false;
    };
  }, []);

  const clearOrders = async () => {
    const shouldClear = window.confirm(
      "Semua data order akan dihapus. Lanjutkan membersihkan data transaksi?",
    );

    if (!shouldClear) {
      return;
    }

    setOrders([]);
    await saveLiveSiteContent({ orders: [] }, emptySitePackages);
    setFeedback("Semua data order berhasil dibersihkan.");
  };

  return (
    <div className="admin-orders-page">
      <aside className="admin-orders-sidenav">
        <div className="admin-orders-brand">
          <h1>TerraVoyage</h1>
          <p>Admin Console</p>
        </div>

        <nav className="admin-orders-nav">
          <a className="admin-orders-link" href="/admin/analytics/">
            <span className="material-symbols-outlined">analytics</span>
            <span>Analytics</span>
          </a>
          <a className="admin-orders-link" href="/admin/packages/">
            <span className="material-symbols-outlined">travel_explore</span>
            <span>Tours</span>
          </a>
          <a className="admin-orders-link active" href="/admin/orders/">
            <span className="material-symbols-outlined">receipt_long</span>
            <span>Orders</span>
          </a>
          <a className="admin-orders-link" href="/admin/settings/">
            <span className="material-symbols-outlined">settings_suggest</span>
            <span>Settings</span>
          </a>
        </nav>

        <div className="admin-orders-action-wrap">
          <a className="admin-orders-create" href="/admin/packages/">
            <span className="material-symbols-outlined">add</span>
            <span>Tambahkan Paket Baru</span>
          </a>
        </div>

        <div className="admin-orders-footer-nav">
          <button className="admin-orders-link" onClick={() => setFeedback("Pusat bantuan akan segera tersedia.")} type="button">
            <span className="material-symbols-outlined">help_outline</span>
            <span>Support</span>
          </button>
          <a className="admin-orders-link danger" href="/admin/">
            <span className="material-symbols-outlined">logout</span>
            <span>Logout</span>
          </a>
        </div>
      </aside>

      <main className="admin-orders-main">
        <header className="admin-orders-topbar">
          <div className="admin-orders-topbar-left">
            <span className="admin-orders-topbar-title">TerraVoyage Admin</span>
            <nav className="admin-orders-topbar-nav">
              <a href="/admin/analytics/">Dashboard</a>
              <a className="active" href="/admin/orders/">
                Orders
              </a>
            </nav>
          </div>

          <div className="admin-orders-topbar-right">
            <div className="admin-orders-icon-wrap notification">
              <span className="material-symbols-outlined">notifications</span>
              <span className="admin-orders-notification-dot" />
            </div>
            <button
              className="admin-orders-icon-wrap"
              onClick={() => setFeedback("Mode gelap akan segera tersedia.")}
              type="button"
            >
              <span className="material-symbols-outlined">dark_mode</span>
            </button>
            <div className="admin-orders-profile">
              <img
                alt="Administrator Profile"
                src={adminProfile.photo}
              />
              <span>{adminProfile.fullName}</span>
            </div>
          </div>
        </header>

        <div className="admin-orders-content">
          {feedback ? <div className="admin-orders-feedback">{feedback}</div> : null}

          <section className="admin-orders-list-card">
            <div className="admin-orders-list-head">
              <div>
                <h2>Daftar Order Masuk</h2>
                <p>Klik satu order untuk membuka halaman detail yang lebih rapi dan fokus.</p>
              </div>
              <div className="admin-orders-list-actions">
                <span className="admin-orders-total-chip">{sortedOrders.length} order</span>
                <button className="admin-orders-outline subtle" onClick={clearOrders} type="button">
                  Bersihkan Data Order
                </button>
              </div>
            </div>

            {sortedOrders.length === 0 ? (
              <div className="admin-orders-empty">
                <span className="material-symbols-outlined">inventory_2</span>
                <h3>Belum ada transaksi</h3>
                <p>Begitu ada pesanan dari website utama, daftar order akan langsung muncul di halaman ini.</p>
              </div>
            ) : (
              <div className="admin-orders-table-wrap">
                <table className="admin-orders-table">
                  <thead>
                    <tr>
                      <th>Pemesan</th>
                      <th>Paket</th>
                      <th>Tanggal</th>
                      <th>Peserta</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedOrders.map((item) => {
                      const initials = item.customerName
                        .split(" ")
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase();

                      return (
                        <tr
                          key={item.id}
                          onClick={() => {
                            window.location.href = `/admin/orders/detail/?id=${encodeURIComponent(item.id)}`;
                          }}
                        >
                          <td>
                            <div className="admin-orders-customer-cell">
                              <div className="admin-orders-avatar">{initials}</div>
                              <div>
                                <strong>{item.customerName}</strong>
                                <p>{item.customerEmail}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="admin-orders-chip">{item.packageTitle}</span>
                          </td>
                          <td>{item.travelDate}</td>
                          <td>{item.guests}</td>
                          <td>
                            <strong>{item.total}</strong>
                          </td>
                          <td>
                            <span className={`admin-orders-status ${formatStatusTone(item.status)}`}>
                              {formatStatusLabel(item.status)}
                            </span>
                          </td>
                          <td className="admin-orders-arrow">
                            <span className="material-symbols-outlined">chevron_right</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default AdminOrdersPage;

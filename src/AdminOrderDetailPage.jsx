import { useEffect, useMemo, useState } from "react";
import {
  defaultAdminOrders,
  emptySitePackages,
  getAdminOrders,
  getSitePackages,
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

function buildWhatsappLink(phone, name, orderId) {
  const sanitized = String(phone ?? "").replace(/[^\d]/g, "");
  const target = sanitized.startsWith("0") ? `62${sanitized.slice(1)}` : sanitized;
  const message = encodeURIComponent(
    `Halo ${name}, kami menghubungi Anda terkait pesanan TerraVoyage dengan ID ${orderId}.`,
  );

  return `https://wa.me/${target}?text=${message}`;
}

function AdminOrderDetailPage() {
  const [feedback, setFeedback] = useState("");
  const [orders, setOrders] = useState(() => getAdminOrders() || defaultAdminOrders);
  const [packagesData, setPackagesData] = useState(() => getSitePackages(emptySitePackages));
  const orderIdFromQuery =
    new URLSearchParams(window.location.search).get("id") ?? null;

  const selectedOrder = useMemo(
    () => orders.find((item) => item.id === orderIdFromQuery) ?? orders[0] ?? null,
    [orderIdFromQuery, orders],
  );
  const relatedPackage = selectedOrder
    ? packagesData.find((item) => item.id === selectedOrder.packageId)
    : null;

  useEffect(() => {
    let isActive = true;

    const syncOrders = async () => {
      const content = await loadLiveSiteContent(emptySitePackages);

      if (!isActive) {
        return;
      }

      setOrders(content.orders ?? []);
      setPackagesData(content.packages ?? []);
    };

    syncOrders();

    return () => {
      isActive = false;
    };
  }, []);

  const persistOrders = async (nextOrders, message) => {
    setOrders(nextOrders);
    await saveLiveSiteContent({ orders: nextOrders }, emptySitePackages);
    setFeedback(message);
  };

  const updateSelectedOrder = async (updater, message) => {
    if (!selectedOrder) {
      return;
    }

    const nextOrders = orders.map((item) =>
      item.id === selectedOrder.id ? updater(item) : item,
    );
    await persistOrders(nextOrders, message);
  };

  const handleStatusChange = async (value) => {
    await updateSelectedOrder(
      (item) => ({
        ...item,
        status: value,
        history: [
          {
            id: Date.now(),
            color: value === "confirmed" || value === "paid" ? "success" : "neutral",
            title: `Status order diubah menjadi ${formatStatusLabel(value)}`,
            time: new Date().toLocaleString("id-ID"),
          },
          ...(item.history ?? []),
        ],
      }),
      "Status order berhasil diperbarui.",
    );
  };

  const confirmPayment = async () => {
    await updateSelectedOrder(
      (item) => ({
        ...item,
        status: "confirmed",
        history: [
          {
            id: Date.now(),
            color: "success",
            title: "Pembayaran berhasil dikonfirmasi admin",
            time: new Date().toLocaleString("id-ID"),
          },
          ...(item.history ?? []),
        ],
      }),
      "Pembayaran berhasil dikonfirmasi dan tersimpan.",
    );
  };

  const deleteSelectedOrder = async () => {
    if (!selectedOrder) {
      return;
    }

    const shouldDelete = window.confirm(
      `Hapus order ${selectedOrder.id} milik ${selectedOrder.customerName}?`,
    );

    if (!shouldDelete) {
      return;
    }

    const nextOrders = orders.filter((item) => item.id !== selectedOrder.id);
    await persistOrders(nextOrders, "Order berhasil dihapus.");
    window.location.href = "/admin/orders/";
  };

  const openWhatsapp = () => {
    if (!selectedOrder) {
      return;
    }

    window.open(
      buildWhatsappLink(
        selectedOrder.customerPhone,
        selectedOrder.customerName,
        selectedOrder.id,
      ),
      "_blank",
      "noopener,noreferrer",
    );
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
      </aside>

      <main className="admin-orders-main">
        <header className="admin-orders-topbar">
          <div className="admin-orders-topbar-left">
            <span className="admin-orders-topbar-title">TerraVoyage Admin</span>
            <nav className="admin-orders-topbar-nav">
              <a href="/admin/analytics/">Dashboard</a>
              <a className="active" href="/admin/orders/">
                Order Detail
              </a>
            </nav>
          </div>
        </header>

        <div className="admin-orders-content">
          {feedback ? <div className="admin-orders-feedback">{feedback}</div> : null}

          {!selectedOrder ? (
            <section className="admin-orders-empty">
              <span className="material-symbols-outlined">inventory_2</span>
              <h3>Order tidak ditemukan</h3>
              <p>Tidak ada data order yang bisa dibuka saat ini.</p>
              <a className="admin-orders-primary" href="/admin/orders/">
                Kembali ke Daftar Order
              </a>
            </section>
          ) : (
            <>
              <section className="admin-orders-hero">
                <div>
                  <div className="admin-orders-badge-row">
                    <a className="admin-orders-outline" href="/admin/orders/">
                      <span className="material-symbols-outlined">arrow_back</span>
                      <span>Kembali ke Daftar</span>
                    </a>
                    <span className={`admin-orders-badge ${formatStatusTone(selectedOrder.status)}`}>
                      {formatStatusLabel(selectedOrder.status)}
                    </span>
                    <div className="admin-orders-select-wrap">
                      <select
                        onChange={(event) => handleStatusChange(event.target.value)}
                        value={selectedOrder.status}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="expired">Expired</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <span className="material-symbols-outlined">expand_more</span>
                    </div>
                  </div>
                  <h2>Detail Order #{selectedOrder.id}</h2>
                </div>

                <div className="admin-orders-hero-actions">
                  <button className="admin-orders-outline" onClick={openWhatsapp} type="button">
                    <span className="material-symbols-outlined">chat</span>
                    <span>Hubungi via WhatsApp</span>
                  </button>
                  <button className="admin-orders-outline danger" onClick={deleteSelectedOrder} type="button">
                    <span className="material-symbols-outlined">delete</span>
                    <span>Hapus Order</span>
                  </button>
                  <button className="admin-orders-primary" onClick={confirmPayment} type="button">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>Konfirmasi Pembayaran</span>
                  </button>
                </div>
              </section>

              <section className="admin-orders-bento">
                <div className="admin-orders-left">
                  <article className="admin-orders-card">
                    <div className="admin-orders-card-head">
                      <span className="material-symbols-outlined">person</span>
                      <h3>Informasi Pelanggan</h3>
                    </div>

                    <div className="admin-orders-info-grid">
                      <div>
                        <p>Nama Lengkap</p>
                        <strong>{selectedOrder.customerName}</strong>
                      </div>
                      <div>
                        <p>Email</p>
                        <strong>{selectedOrder.customerEmail}</strong>
                      </div>
                      <div>
                        <p>No. Telepon</p>
                        <strong>{selectedOrder.customerPhone}</strong>
                      </div>
                      <div>
                        <p>Alamat</p>
                        <strong>{selectedOrder.address}</strong>
                      </div>
                    </div>
                  </article>

                  <article className="admin-orders-card">
                    <div className="admin-orders-card-head">
                      <span className="material-symbols-outlined">map</span>
                      <h3>Detail Paket</h3>
                    </div>

                    <div className="admin-orders-package">
                      <img
                        alt={selectedOrder.packageTitle}
                        className="admin-orders-package-image"
                        src={
                          relatedPackage?.image ??
                          relatedPackage?.heroImage ??
                          selectedOrder.packageImage ??
                          selectedOrder.receiptImage
                        }
                      />

                      <div className="admin-orders-package-copy">
                        <span className="admin-orders-tag">{selectedOrder.packageCategory}</span>
                        <h4>{selectedOrder.packageTitle}</h4>

                        <div className="admin-orders-package-meta">
                          <div>
                            <span className="material-symbols-outlined">calendar_today</span>
                            <span>{selectedOrder.travelDate}</span>
                          </div>
                          <div>
                            <span className="material-symbols-outlined">groups</span>
                            <span>{selectedOrder.guests}</span>
                          </div>
                          <div>
                            <span className="material-symbols-outlined">payments</span>
                            <span>{selectedOrder.paymentMethod}</span>
                          </div>
                        </div>

                        <div className="admin-orders-chip-row">
                          {(selectedOrder.chips ?? []).map((item) => (
                            <span key={item}>{item}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>

                  <article className="admin-orders-card">
                    <div className="admin-orders-card-head">
                      <span className="material-symbols-outlined">history</span>
                      <h3>Riwayat Order</h3>
                    </div>

                    <div className="admin-orders-history">
                      {(selectedOrder.history ?? []).map((item) => (
                        <div key={item.id} className="admin-orders-history-item">
                          <span
                            className={
                              item.color === "success"
                                ? "admin-orders-history-dot success"
                                : "admin-orders-history-dot"
                            }
                          />
                          <div>
                            <strong>{item.title}</strong>
                            <p>{item.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                </div>

                <div className="admin-orders-right">
                  <article className="admin-orders-card">
                    <div className="admin-orders-card-head">
                      <span className="material-symbols-outlined">payments</span>
                      <h3>Rincian Biaya</h3>
                    </div>

                    <div className="admin-orders-cost-list">
                      {(selectedOrder.breakdown ?? []).map((item) => (
                        <div key={item.label}>
                          <span>{item.label}</span>
                          <strong>{item.value}</strong>
                        </div>
                      ))}
                      <div className="total">
                        <span>Total Bayar</span>
                        <strong>{selectedOrder.total}</strong>
                      </div>
                    </div>
                  </article>

                  <article className="admin-orders-card">
                    <div className="admin-orders-receipt-head">
                      <h3>Bukti Bayar</h3>
                      <span className="material-symbols-outlined">open_in_full</span>
                    </div>

                    <div className="admin-orders-receipt-preview">
                      <img
                        alt={`Bukti pembayaran ${selectedOrder.customerName}`}
                        src={selectedOrder.receiptImage ?? relatedPackage?.image}
                      />
                      <div className="admin-orders-receipt-overlay">
                        Klik kanan untuk membuka gambar di tab baru
                      </div>
                    </div>

                    <div className="admin-orders-receipt-meta">
                      <div>
                        <span className="material-symbols-outlined">schedule</span>
                        <p>Upload terakhir: {selectedOrder.receiptUploadedAt || "-"}</p>
                      </div>
                      <div>
                        <span className="material-symbols-outlined">account_balance</span>
                        <p>{selectedOrder.receiptBank}</p>
                      </div>
                    </div>
                  </article>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminOrderDetailPage;

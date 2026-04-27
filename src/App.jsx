import { useEffect, useRef, useState } from "react";
import qrisSim from "./assets/qris-sim.svg";
import {
  defaultAdminOrders,
  defaultSiteSettings,
  emptySitePackages,
  getAdminOrders,
  getSiteSettings,
  getSitePackages,
  loadLiveSiteContent,
  saveLiveSiteContent,
  uploadSiteImage,
} from "./siteStore";
import { buildDynamicQrisString } from "./qris";
import { jsPDF } from "jspdf";

const BASE_QRIS_STRING = "00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214052115008163530303UMI51440014ID.CO.QRIS.WWW0215ID20253876912850303UMI5204481253033605802ID5918FARWELLL OK23415986015PESISIR SELATAN61052565162070703A016304CC68";
const PAYMENT_EXPIRY_SECONDS = {
  qris: 15 * 60,
  ewallet: 30 * 60,
  transfer: 24 * 60 * 60,
};
const CUSTOMER_SESSION_KEY = "terravoyage-customer-session";
const EXPIRY_TOLERANCE_MS = 1500;

const gallery = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBV7DwpX38E1Qbq0IHAnNxg7QUk8FLJ3hxBlXcqPQACW-XB0vcEuO2mSU1eGeza1pJahAQTQV_J1Go-nXBuu3ghB_X_Jel6I11u4Eqa-Eeg-bK8eUTh26bfKjdL9QRYZAeALiOGF2uERoa9cl7EwGl3_I1SoJf90yNSEHGBfMujQNiGBuK1rtT8sLKpdDUTSv83P9xz7OOPxVmr_nhy_cpgfFkx3N50dH_LyKRVO7T4WSN41Dujf3FUehDAgHqfKRFmHLgv9joCURct",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAi6z_AbOCgV2hXKQVqMhlYsjiLVHFlhaPDSfKMvDijsBinTSlTM4E3ETHrfEEnALomQplPjGRTxC1_8C2FGaEn1uTVngOYE6ABr-VBIk2idATI_RD-v45v95AHL0KgfrLuhpZP_wkNbNUsp9jSBF05yaSWATVDpZAt68Ir5UGA25J8_ugFFao6m2gjJKbLSbgBHMRx5XMeHH0uttHr23-lwqJH8mgdEhKJsfZfOTci6qfPyMVPUj09jNcKVQstVlieweIir4OuosX4",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCJaMPe2jziVISUEr_b_vDT8ZDoDDNTHQqlWczLQSwUfrZckAoOkFeDO67Ms47UXTo4fDamMZ8qmBsIeGLg_RMlBXBdkiLzXwW1b8WkDxqE-AHp9bmBxL00Gn9B-J2xT_dUbg_UE_U04LQza9_un4nhAiFTJjH4BIjDTFw1Y-fFdJrePpJ-CSrsaxNorL9gyCsdOjiJiFNPgY_4SyJkLsVeCjK481Z32TizfTLN656caaNkmuztxVlVlmAh4f24uUv61LuNyoa_obW0",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBXJrX3RBSjpux5-8pLg_OUfCID9CXQX7yfkJsPXj3N_3T9CrUx0z5jar5id8am2wB-sf5S7TW4lHFSXzBWmy1jx8K6OhVYQTqtHrc0l7amUU4F7OZwOdZzl6mxtl6WOgKX-Nbgy_xsKDTiRegN11gCzn-rOGq6NiaXPdDl1JmScj9FXypZmEu9tfYtNRphEVT3V70OqFps1OkRPJ1Q4NahD2qsvc8W0TJMkatbvVFxENfO4TVkRAwadbBMjJDeeCilo98oBPNYfYMY",
];

const getNumericPrice = (price) => price.replace(/[^\d]/g, "");
const formatPhoneNumber = (value) => {
  const trimmed = String(value ?? "").trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("+")) {
    return trimmed;
  }

  return trimmed.startsWith("0") ? `+62${trimmed.slice(1)}` : trimmed;
};

const normalizeEmail = (value) => String(value ?? "").trim().toLowerCase();

const normalizeCustomerSession = (value) => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const email = normalizeEmail(value.email);
  const phone = formatPhoneNumber(value.phone);

  if (!email && !phone) {
    return null;
  }

  return {
    name: String(value.name ?? "").trim(),
    email,
    phone,
    orderId: String(value.orderId ?? "").trim(),
  };
};

const readCustomerSession = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CUSTOMER_SESSION_KEY);
    return normalizeCustomerSession(raw ? JSON.parse(raw) : null);
  } catch {
    return null;
  }
};

const persistCustomerSession = (value) => {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = normalizeCustomerSession(value);

  if (!normalized) {
    window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
    return;
  }

  window.localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(normalized));
};

const isFilled = (value) => String(value ?? "").trim().length > 0;
const formatRupiah = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

const getOrderExpirySeconds = (paymentMethod) =>
  PAYMENT_EXPIRY_SECONDS[paymentMethod] ?? PAYMENT_EXPIRY_SECONDS.transfer;

const parseTimestamp = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const asNumber = Number(value);

    if (Number.isFinite(asNumber)) {
      return asNumber;
    }

    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const getOrderExpiryTime = (order) => {
  if (!order) {
    return null;
  }

  const createdAtMs =
    parseTimestamp(order.createdAtMs) ?? parseTimestamp(order.createdAt);
  const expiresAtMs =
    parseTimestamp(order.expiresAtMs) ?? parseTimestamp(order.expiresAt);

  if (Number.isFinite(expiresAtMs) && Number.isFinite(createdAtMs) && expiresAtMs < createdAtMs) {
    return createdAtMs + getOrderExpirySeconds(order.paymentMethod) * 1000;
  }

  if (Number.isFinite(expiresAtMs)) {
    return expiresAtMs;
  }

  if (Number.isFinite(createdAtMs)) {
    return createdAtMs + getOrderExpirySeconds(order.paymentMethod) * 1000;
  }

  return null;
};

const getRemainingSeconds = (order) => {
  const expiryTime = getOrderExpiryTime(order);

  if (!expiryTime) {
    return 0;
  }

  const diff = Math.ceil((expiryTime - Date.now()) / 1000);
  return Math.max(0, diff);
};

function formatCountdown(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

function useCountdown(order, onExpired) {
  const [timeLeft, setTimeLeft] = useState(() => getRemainingSeconds(order));
  const hasExpiredRef = useRef(false);
  const expiryTime = getOrderExpiryTime(order);

  useEffect(() => {
    setTimeLeft(getRemainingSeconds(order));
    hasExpiredRef.current = false;
  }, [order]);

  useEffect(() => {
    if (!expiryTime) {
      return undefined;
    }

    if (Date.now() >= expiryTime + EXPIRY_TOLERANCE_MS) {
      if (!hasExpiredRef.current) {
        hasExpiredRef.current = true;
        onExpired?.();
      }

      return undefined;
    }

    const timerId = window.setInterval(() => {
      setTimeLeft(getRemainingSeconds(order));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [expiryTime, onExpired, order]);

  return timeLeft;
}

function App() {
  const historyRef = useRef([]);
  const [packagesData, setPackagesData] = useState(() => getSitePackages(emptySitePackages));
  const [siteSettings, setSiteSettings] = useState(() => getSiteSettings() || defaultSiteSettings);
  const [ordersData, setOrdersData] = useState(() => getAdminOrders() || defaultAdminOrders);
  const [page, setPage] = useState("home");
  const [selectedPackageId, setSelectedPackageId] = useState(
    () => getSitePackages(emptySitePackages)[0]?.id ?? null,
  );
  const [paymentMethod, setPaymentMethod] = useState("transfer");
  const [flashMessage, setFlashMessage] = useState("");
  const [uploadedProofName, setUploadedProofName] = useState("");
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [participantCount, setParticipantCount] = useState(2);
  const [travelDate, setTravelDate] = useState("");
  const [customerSession, setCustomerSession] = useState(() => readCustomerSession());
  const proofInputRef = useRef(null);

  useEffect(() => {
    if (!flashMessage) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setFlashMessage("");
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [flashMessage]);

  const showFeedback = (message) => {
    setFlashMessage(message);
  };

  const hasPackages = packagesData.length > 0;
  const selectedPackage =
    packagesData.find((item) => item.id === selectedPackageId) ?? packagesData[0] ?? null;
  const currentOrder = ordersData.find((item) => item.id === currentOrderId) ?? null;

  useEffect(() => {
    let isActive = true;

    const syncSharedState = async () => {
      const content = await loadLiveSiteContent(emptySitePackages);

      if (!isActive) {
        return;
      }

      setPackagesData(content.packages);
      setSiteSettings(content.settings);
      setOrdersData(content.orders);
    };

    const syncFromStorage = () => {
      setPackagesData(getSitePackages(emptySitePackages));
      setSiteSettings(getSiteSettings() || defaultSiteSettings);
      setOrdersData(getAdminOrders() || defaultAdminOrders);
      setCustomerSession(readCustomerSession());
    };

    syncSharedState();

    const interval = window.setInterval(syncSharedState, 12000);
    window.addEventListener("storage", syncFromStorage);
    window.addEventListener("focus", syncSharedState);

    return () => {
      isActive = false;
      window.clearInterval(interval);
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener("focus", syncSharedState);
    };
  }, []);

  useEffect(() => {
    if (packagesData.length === 0) {
      setSelectedPackageId(null);
      if (["detail", "checkout", "bank", "qris", "ewallet", "success"].includes(page)) {
        setPage("packages");
      }
      return;
    }

    if (!selectedPackageId || !packagesData.some((item) => item.id === selectedPackageId)) {
      setSelectedPackageId(packagesData[0].id);
    }
  }, [packagesData, page, selectedPackageId]);

  const navigateTo = (nextPage) => {
    if (nextPage === page) {
      return;
    }

    historyRef.current.push(page);
    setPage(nextPage);
  };

  const goBack = () => {
    const previousPage = historyRef.current.pop();
    setPage(previousPage ?? "home");
  };

  const openPackage = (pkg) => {
    if (!pkg) {
      return;
    }

    setSelectedPackageId(pkg.id);
    setParticipantCount(2);
    setTravelDate("");
    navigateTo("detail");
  };

  const openOrderPayment = (order) => {
    if (!order) {
      return;
    }

    setCurrentOrderId(order.id);
    setSelectedPackageId(order.packageId);
    setParticipantCount(Number(String(order.guests ?? "").match(/\d+/)?.[0] ?? 2));
    setTravelDate(order.travelDate || "");

    if (order.paymentMethod === "qris") {
      openQris();
      return;
    }

    if (order.paymentMethod === "ewallet") {
      openEwallet();
      return;
    }

    openBankTransfer();
  };

  const startCheckout = () => navigateTo("checkout");
  const openQris = () => navigateTo("qris");
  const openEwallet = () => navigateTo("ewallet");
  const openBankTransfer = () => navigateTo("bank");
  const openSuccess = () => navigateTo("success");
  const openBookings = () => navigateTo("bookings");
  const openPackages = () => navigateTo("packages");
  const openHome = () => {
    historyRef.current = [];
    setPage("home");
  };

  const handleDownloadQris = () => {
    if (!selectedPackage) {
      showFeedback("Belum ada paket yang bisa dibayar.");
      return;
    }

    const link = document.createElement("a");
    link.href = qrisSim;
    link.download = `qris-simulasi-${selectedPackage.id}.svg`;
    link.click();
    showFeedback("QR simulasi berhasil disimpan.");
  };

  const handleCopy = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      showFeedback(`${label} berhasil disalin.`);
    } catch {
      showFeedback(`Salin manual ${label}: ${value}`);
    }
  };

  const handleOpenUpload = () => {
    if (currentOrder?.status !== "pending") {
      showFeedback("Pesanan ini sudah tidak aktif untuk unggah bukti pembayaran.");
      return;
    }

    proofInputRef.current?.click();
  };

  const handleProofUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (currentOrder?.status !== "pending") {
      showFeedback("Waktu pembayaran sudah habis. Silakan buat pesanan baru.");
      event.target.value = "";
      return;
    }

    const uploadProof = async () => {
      const imageUrl = await uploadSiteImage(file);
      const uploadedAt = new Date().toLocaleString("id-ID");
      const nextOrders = ordersData.map((item) =>
        item.id === currentOrderId
          ? {
              ...item,
              status: "paid",
              receiptImage: imageUrl,
              receiptUploadedAt: uploadedAt,
              history: [
                {
                  id: Date.now(),
                  color: "success",
                  title: `Bukti pembayaran diunggah: ${file.name}`,
                  time: uploadedAt,
                },
                ...(item.history ?? []),
              ],
            }
          : item,
      );

      setUploadedProofName(file.name);
      setOrdersData(nextOrders);
      await saveLiveSiteContent({ orders: nextOrders }, emptySitePackages);
      showFeedback(`Bukti transfer "${file.name}" berhasil diunggah.`);
    };

    uploadProof();
  };

  const handleCustomTrip = () => {
    navigateTo("checkout");
    showFeedback("Form konsultasi dibuka. Silakan lengkapi detail perjalanan Anda.");
  };

  const handleComingSoon = (message) => {
    showFeedback(message);
  };

  const resolveCustomerSession = (value) => {
    const normalized = normalizeCustomerSession(value);
    persistCustomerSession(normalized);
    setCustomerSession(normalized);
  };

  const resetCustomerSession = () => {
    persistCustomerSession(null);
    setCustomerSession(null);
    showFeedback("Data pelacakan pesanan berhasil direset.");
  };

  const expireOrder = async (orderId, reason) => {
    if (!orderId) {
      return;
    }

    let didChange = false;
    const nextOrders = ordersData.map((item) => {
      if (item.id !== orderId || item.status !== "pending") {
        return item;
      }

      didChange = true;
      return {
        ...item,
        status: "expired",
        history: [
          {
            id: Date.now(),
            color: "neutral",
            title: reason,
            time: new Date().toLocaleString("id-ID"),
          },
          ...(item.history ?? []),
        ],
      };
    });

    if (!didChange) {
      return;
    }

    setOrdersData(nextOrders);
    await saveLiveSiteContent({ orders: nextOrders }, emptySitePackages);
    showFeedback("Waktu pembayaran habis. Pesanan dipindahkan ke status kadaluarsa.");
  };

  const markOrderPaid = async (orderId, historyTitle) => {
    if (!orderId) {
      return;
    }

    const nextOrders = ordersData.map((item) =>
      item.id === orderId && item.status === "pending"
        ? {
            ...item,
            status: "paid",
            history: [
              {
                id: Date.now(),
                color: "success",
                title: historyTitle,
                time: new Date().toLocaleString("id-ID"),
              },
              ...(item.history ?? []),
            ],
          }
        : item,
    );

    setOrdersData(nextOrders);
    await saveLiveSiteContent({ orders: nextOrders }, emptySitePackages);
  };

  const createOrderFromSelection = async (customerData) => {
    if (!selectedPackage) {
      showFeedback("Pilih paket terlebih dahulu sebelum membuat pesanan.");
      return null;
    }

    const totalPrice = Number(getNumericPrice(selectedPackage.price)) * participantCount;
    const orderId = `TV-${Date.now()}`;
    const submittedTravelDate = customerData?.travelDate?.trim() || travelDate || selectedPackage.dates;
    const createdAtMs = Date.now();
    const expiresAtMs = createdAtMs + getOrderExpirySeconds(paymentMethod) * 1000;
    const nextOrder = {
      id: orderId,
      customerName: customerData.name.trim(),
      customerEmail: customerData.email.trim(),
      customerPhone: formatPhoneNumber(customerData.phone),
      address: customerData.address.trim(),
      packageId: selectedPackage.id,
      packageTitle: selectedPackage.title,
      packageCategory: selectedPackage.category,
      travelDate: submittedTravelDate,
      guests: `${participantCount} Orang`,
      chips:
        selectedPackage.amenities?.filter((item) => item.checked).map((item) => item.label).slice(0, 3) ??
        [],
      paymentMethod: paymentMethod,
      receiptBank: paymentMethod === "qris" ? "Menunggu pembayaran QRIS" : paymentMethod === "ewallet" ? "Menunggu konfirmasi E-Wallet" : "Menunggu bukti transfer",
      receiptUploadedAt: "-",
      receiptImage: selectedPackage.image,
      breakdown: [
        {
          label: `Paket Tour (x${participantCount})`,
          value: formatRupiah(totalPrice),
        },
      ],
      total: formatRupiah(totalPrice),
      status: "pending",
      createdAtMs,
      createdAt: new Date(createdAtMs).toISOString(),
      expiresAtMs,
      expiresAt: new Date(expiresAtMs).toISOString(),
      history: [
        {
          id: Date.now(),
          color: "neutral",
          title: "Pesanan dibuat dari halaman checkout",
          time: new Date().toLocaleString("id-ID"),
        },
      ],
    };

    const nextOrders = [nextOrder, ...ordersData];
    const nextCustomerSession = {
      name: nextOrder.customerName,
      email: nextOrder.customerEmail,
      phone: nextOrder.customerPhone,
      orderId,
    };
    setCurrentOrderId(orderId);
    setOrdersData(nextOrders);
    resolveCustomerSession(nextCustomerSession);
    await saveLiveSiteContent({ orders: nextOrders }, emptySitePackages);
    return nextOrder;
  };

  return (
    <div className="app-shell">
      {flashMessage ? <div className="toast-message">{flashMessage}</div> : null}
      <Header
        canGoBack={["detail", "checkout", "qris", "ewallet", "bank"].includes(page)}
        onBack={goBack}
        page={page}
        onHome={openHome}
        onPackages={openPackages}
        onBookings={openBookings}
      />

      {page === "home" ? (
        hasPackages ? (
        <HomePage
          packageList={packagesData}
          siteSettings={siteSettings}
          onPackages={openPackages}
          onDetail={openPackage}
          onChat={() => handleComingSoon("Layanan chat concierge akan segera tersedia.")}
        />
        ) : (
          <NoPackagesState onAction={openBookings} />
        )
      ) : null}
      {page === "packages" ? (
        hasPackages ? (
        <PackagesPage
          packageList={packagesData}
          onDetail={openPackage}
          onHome={openHome}
          onCustomTrip={handleCustomTrip}
          onNotify={handleComingSoon}
        />
        ) : (
          <NoPackagesState onAction={openBookings} />
        )
      ) : null}
      {page === "detail" ? (
        selectedPackage ? (
        <DetailPage
          packageList={packagesData}
          onBack={goBack}
          selectedPackage={selectedPackage}
          participantCount={participantCount}
          onParticipantCountChange={setParticipantCount}
          travelDate={travelDate}
          onTravelDateChange={setTravelDate}
          onCheckout={startCheckout}
          onDetail={openPackage}
          onPackages={openPackages}
        />
        ) : (
          <NoPackagesState onAction={openBookings} />
        )
      ) : null}
      {page === "checkout" ? (
        selectedPackage ? (
        <CheckoutPage
          onBack={goBack}
          selectedPackage={selectedPackage}
          participantCount={participantCount}
          travelDate={travelDate}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          onPackages={openPackages}
          onBookings={openBookings}
          onNotify={handleComingSoon}
          onPay={(customerData) => {
            const goToPayment = async () => {
              await createOrderFromSelection(customerData);
              if (!selectedPackage) {
                return;
              }

              if (paymentMethod === "qris") {
                openQris();
                return;
              }
              if (paymentMethod === "ewallet") {
                openEwallet();
                return;
              }
              openBankTransfer();
            };

            return goToPayment();
          }}
        />
        ) : (
          <NoPackagesState onAction={openBookings} />
        )
      ) : null}
      {page === "bank" ? (
        selectedPackage ? (
        <BankTransferPage
          onBack={goBack}
          order={currentOrder}
          selectedPackage={selectedPackage}
          participantCount={participantCount}
          travelDate={travelDate}
          onCheckout={startCheckout}
          onBookings={async () => {
            await markOrderPaid(
              currentOrderId,
              "Bukti pembayaran transfer dikirim dan menunggu verifikasi admin.",
            );
            openSuccess();
          }}
          onExpired={async () => {
            if (currentOrder?.status === "pending") {
              await expireOrder(
                currentOrderId,
                "Waktu pembayaran transfer berakhir sebelum bukti pembayaran dikirim.",
              );
            }
          }}
          onCopy={handleCopy}
          onOpenUpload={handleOpenUpload}
          onProofUpload={handleProofUpload}
          proofInputRef={proofInputRef}
          uploadedProofName={uploadedProofName}
        />
        ) : (
          <NoPackagesState onAction={openBookings} />
        )
      ) : null}
      {page === "qris" ? (
        selectedPackage ? (
        <QrisPage
          onBack={goBack}
          order={currentOrder}
          selectedPackage={selectedPackage}
          participantCount={participantCount}
          onSuccess={async () => {
            await markOrderPaid(currentOrderId, "Pembayaran QRIS berhasil diterima.");
            openSuccess();
          }}
          onPending={openBookings}
          onExpired={async () => {
            if (currentOrder?.status === "pending") {
              await expireOrder(currentOrderId, "Waktu pembayaran QRIS telah habis.");
            }
          }}
          totalAmount={Number(getNumericPrice(selectedPackage.price)) * participantCount}
        />
        ) : (
          <NoPackagesState onAction={openBookings} />
        )
      ) : null}
      {page === "ewallet" ? (
        selectedPackage ? (
        <EwalletPage
          onBack={goBack}
          order={currentOrder}
          selectedPackage={selectedPackage}
          participantCount={participantCount}
          onBookings={async () => {
            await markOrderPaid(currentOrderId, "Pembayaran e-wallet berhasil dikirim.");
            openSuccess();
          }}
          onCheckout={startCheckout}
          onExpired={async () => {
            if (currentOrder?.status === "pending") {
              await expireOrder(currentOrderId, "Waktu pembayaran e-wallet telah habis.");
            }
          }}
        />
        ) : (
          <NoPackagesState onAction={openBookings} />
        )
      ) : null}
      {page === "success" ? (
        currentOrder ? (
        <PaymentSuccessPage
          order={currentOrder}
          onBookings={openBookings}
        />
        ) : (
          <NoPackagesState onAction={openBookings} />
        )
      ) : null}
      {page === "bookings" ? (
        <BookingsPage
          packageList={packagesData}
          bookingsData={ordersData}
          customerSession={customerSession}
          onPackages={openPackages}
          onDetail={openPackage}
          onPendingPayment={openOrderPayment}
          onResumeQris={openOrderPayment}
          onResolveCustomerSession={resolveCustomerSession}
          onResetCustomerSession={resetCustomerSession}
          onChat={() => {
             window.open("https://wa.me/6281234567890?text=Halo%20Admin%20TerraVoyage,%20saya%20ingin%20bertanya%20tentang%20pesanan%20saya", "_blank");
          }}
          onInvoice={(order) => {
            const doc = new jsPDF();
            doc.setFontSize(22);
            doc.text("INVOICE TERRAVOYAGE", 20, 20);
            doc.setFontSize(14);
            doc.text(`Package: ${order?.packageTitle || order?.title || "N/A"}`, 20, 40);
            doc.text(`Date: ${order?.travelDate || order?.date || "N/A"}`, 20, 50);
            doc.text(`Total: ${order?.total || order?.price || "N/A"}`, 20, 60);
            doc.text(`Status: ${order?.status || "N/A"}`, 20, 70);
            doc.save(`Invoice-${order?.id || "Order"}.pdf`);
          }}
          onReview={(order) => {
            const review = window.prompt(
              `Berikan ulasan Anda untuk paket ${order?.packageTitle || order?.title || ""}:`,
            );
            if (review) {
              alert("Terima kasih atas ulasan Anda!");
            }
          }}
          onAccountSettings={() =>
            handleComingSoon("Pengaturan akun akan segera tersedia.")
          }
        />
      ) : null}

      <Footer
        siteSettings={siteSettings}
        onPackages={openPackages}
        onBlog={() => handleComingSoon("Halaman blog sedang disiapkan.")}
        onContact={handleCustomTrip}
        onPrivacy={() => handleComingSoon("Halaman kebijakan privasi sedang disiapkan.")}
      />
    </div>
  );
}

function Header({ canGoBack, onBack, page, onHome, onPackages, onBookings }) {
  return (
    <header className="site-header">
      <div className="shell header-row">
        <div className="header-brand-group">
          {canGoBack ? (
            <button className="icon-circle back-button" onClick={onBack} type="button">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          ) : null}
          <button className="brand-button" onClick={onHome} type="button">
            TerraVoyage
          </button>
        </div>

        <nav className="header-nav">
          <button className={page === "home" ? "nav-item active" : "nav-item"} onClick={onHome} type="button">
            Home
          </button>
          <button
            className={
              page === "packages" ||
              page === "detail" ||
              page === "checkout" ||
              page === "qris" ||
              page === "ewallet" ||
              page === "bank"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={onPackages}
            type="button"
          >
            Paket Wisata
          </button>
          <button className={page === "bookings" ? "nav-item active" : "nav-item"} onClick={onBookings} type="button">
            Pesanan Saya
          </button>
        </nav>

        <div className="header-actions">
          <button className="icon-circle" onClick={onPackages} type="button">
            <span className="material-symbols-outlined">search</span>
          </button>
          <button className="pill-button" onClick={onPackages} type="button">
            Pesan Sekarang
          </button>
        </div>
      </div>
    </header>
  );
}

function PageBackButton({ onBack }) {
  return (
    <button className="page-back-button" onClick={onBack} type="button">
      <span className="material-symbols-outlined">arrow_back</span>
      <span>Kembali</span>
    </button>
  );
}

function NoPackagesState({ onAction }) {
  return (
    <main className="shell page-space">
      <section className="catalog-empty-state">
        <span className="material-symbols-outlined">travel_explore</span>
        <h1>Belum Ada Paket Tersedia</h1>
        <p>
          Website saat ini masih kosong. Admin bisa menambahkan paket baru dari panel admin,
          lalu halaman user akan otomatis sinkron menampilkan paket tersebut.
        </p>
        <button className="full-button" onClick={onAction} type="button">
          Lihat Pesanan Saya
        </button>
      </section>
    </main>
  );
}

function HomePage({ packageList, siteSettings, onPackages, onDetail, onChat }) {
  const [destinationQuery, setDestinationQuery] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [guestCount, setGuestCount] = useState("2 Tamu");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const experienceCards = siteSettings.experienceCards ?? [];

  const searchSuggestions = packageList.filter((pkg) => {
    const keyword = destinationQuery.trim().toLowerCase();

    if (!keyword) {
      return true;
    }

    return [pkg.title, pkg.location, pkg.destination]
      .join(" ")
      .toLowerCase()
      .includes(keyword);
  });

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-image">
          <img src={packageList[0]?.heroImage} alt="Hero TerraVoyage" />
        </div>
        <div className="home-hero-overlay" />
        <div className="shell home-hero-content">
          <h1>{siteSettings.heroTitle}</h1>
          <p>
            {siteSettings.heroSubtitle}
          </p>
          <div className="home-search-bar">
            <div className="home-search-item home-search-item-suggestion">
              <span className="material-symbols-outlined">location_on</span>
              <div className="home-search-input-wrap">
                <input
                  onBlur={() => {
                    window.setTimeout(() => setShowSuggestions(false), 120);
                  }}
                  onChange={(event) => setDestinationQuery(event.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder={siteSettings.heroSearchPlaceholder}
                  value={destinationQuery}
                />
                {showSuggestions && searchSuggestions.length > 0 ? (
                  <div className="home-search-suggestions">
                    {searchSuggestions.slice(0, 5).map((pkg) => (
                      <button
                        key={pkg.id}
                        className="home-suggestion-item"
                        onClick={() => {
                          setDestinationQuery(pkg.title);
                          setShowSuggestions(false);
                          onDetail(pkg);
                        }}
                        type="button"
                      >
                        <strong>{pkg.title}</strong>
                        <span>{pkg.location}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="home-search-item">
              <span className="material-symbols-outlined">calendar_today</span>
              <input
                onChange={(event) => setTravelDate(event.target.value)}
                placeholder="Tanggal perjalanan"
                type="date"
                value={travelDate}
              />
            </div>
            <div className="home-search-item">
              <span className="material-symbols-outlined">group</span>
              <select onChange={(event) => setGuestCount(event.target.value)} value={guestCount}>
                <option>2 Tamu</option>
                <option>4 Tamu</option>
                <option>6+ Tamu</option>
              </select>
            </div>
            <button className="home-search-button" onClick={onPackages} type="button">
              Cari Paket
            </button>
          </div>
        </div>
      </section>

        <section className="shell home-section">
          <div className="section-head left">
            <span>{siteSettings.experienceEyebrow}</span>
            <h2>{siteSettings.experienceTitle}</h2>
          </div>
          <div className="home-bento-grid">
            <button className="home-bento-card wide" onClick={onPackages} type="button">
              <img
                src={experienceCards[0]?.image}
                alt={experienceCards[0]?.title}
              />
              <div className="home-bento-card-overlay">
                <span>{experienceCards[0]?.title}</span>
              </div>
            </button>
            <button className="home-bento-card tall" onClick={onPackages} type="button">
              <img
                src={experienceCards[1]?.image}
                alt={experienceCards[1]?.title}
              />
              <div className="home-bento-card-overlay">
                <span>{experienceCards[1]?.title}</span>
              </div>
            </button>
            <button className="home-bento-card" onClick={onPackages} type="button">
              <img
                src={experienceCards[2]?.image}
                alt={experienceCards[2]?.title}
              />
              <div className="home-bento-card-overlay">
                <span>{experienceCards[2]?.title}</span>
              </div>
            </button>
            <button className="home-bento-card wide-lower" onClick={onPackages} type="button">
              <img
                src={experienceCards[3]?.image}
                alt={experienceCards[3]?.title}
              />
              <div className="home-bento-card-overlay">
                <span>{experienceCards[3]?.title}</span>
              </div>
            </button>
          </div>
        </section>

        <section className="home-packages-section">
          <div className="shell">
          <div className="section-head">
            <div>
              <span>{siteSettings.featuredEyebrow}</span>
              <h2>{siteSettings.featuredTitle}</h2>
            </div>
              <button className="text-link view-all" onClick={onPackages} type="button">
                Lihat Semua
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
            <div className="home-packages-grid">
              {packageList.map((pkg) => (
                <article key={pkg.id} className="home-package-card">
                  <div className="home-package-media">
                    <img src={pkg.image} alt={pkg.title} />
                    <div className="home-rating-badge">
                      <span className="material-symbols-outlined filled">star</span>
                      <span>{pkg.rating}</span>
                    </div>
                  </div>
                  <div className="home-package-body">
                    <p className="home-location-label">{pkg.destination.toUpperCase()}</p>
                    <h3>{pkg.title}</h3>
                    <div className="home-package-meta">
                    <div>
                      <span className="material-symbols-outlined">schedule</span>
                      <span>{pkg.duration}</span>
                    </div>
                    <div>
                      <span className="material-symbols-outlined">group</span>
                        <span>{pkg.guests}</span>
                      </div>
                    </div>
                    <div className="home-package-footer">
                      <div>
                        <span>Mulai dari</span>
                        <strong>{pkg.price}</strong>
                      </div>
                      <button className="home-detail-button" onClick={() => onDetail(pkg)} type="button">
                        Lihat Detail
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="shell home-promo-section">
        <div className="home-promo-card">
          <div className="home-promo-copy">
            <span>{siteSettings.promoKicker}</span>
            <h2>{siteSettings.promoTitle}</h2>
            <p>{siteSettings.promoDescription}</p>
            <div className="home-promo-actions">
              <button className="pill-button alt" onClick={onPackages} type="button">
                {siteSettings.promoButton}
              </button>
              <div>
                <span className="material-symbols-outlined">info</span>
                <span>{siteSettings.promoInfoLabel}</span>
              </div>
            </div>
          </div>
          <div className="home-promo-media">
            <img
              src={siteSettings.promoImage}
              alt="Promo travel"
            />
          </div>
        </div>
        </section>

        <section className="shell home-testimonials">
          <div className="section-head center">
            <span>{siteSettings.testimonialsEyebrow}</span>
            <h2>{siteSettings.testimonialsTitle}</h2>
          </div>
          <div className="home-testimonials-grid">
            {(siteSettings.testimonials ?? []).map((item, index) => (
              <article
                key={item.name}
                className={index === 1 ? "home-testimonial-card featured" : "home-testimonial-card"}
              >
                <span className="material-symbols-outlined quote-icon">format_quote</span>
                <p>{item.quote}</p>
                <div className="home-testimonial-author">
                  <img className="testimonial-avatar" src={item.avatar} alt={item.name} />
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.role}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <button className="floating-chat-button" onClick={onChat} type="button">
        <span className="material-symbols-outlined filled">chat</span>
        <span>{siteSettings.chatButtonLabel}</span>
      </button>
    </main>
  );
}

function PackagesPage({ packageList, onDetail, onHome, onCustomTrip, onNotify }) {
  const [locationFilter, setLocationFilter] = useState("Semua Destinasi");
  const [priceFilter, setPriceFilter] = useState("Semua Harga");
  const [durationFilter, setDurationFilter] = useState("Semua Durasi");

  const filteredPackages = packageList.filter((pkg) => {
    const packagePrice = Number(getNumericPrice(pkg.price));
    const durationDays = Number(pkg.duration.match(/\d+/)?.[0] ?? 0);

    const matchesLocation =
      locationFilter === "Semua Destinasi" ||
      pkg.destination === locationFilter ||
      pkg.location.includes(locationFilter);

    const matchesPrice =
      priceFilter === "Semua Harga" ||
      (priceFilter === "< Rp 5jt" && packagePrice < 5000000) ||
      (priceFilter === "Rp 5jt - 7jt" &&
        packagePrice >= 5000000 &&
        packagePrice <= 7000000) ||
      (priceFilter === "> Rp 7jt" && packagePrice > 7000000);

    const matchesDuration =
      durationFilter === "Semua Durasi" ||
      (durationFilter === "1-3 Hari" && durationDays <= 3) ||
      (durationFilter === "4-5 Hari" &&
        durationDays >= 4 &&
        durationDays <= 5) ||
      (durationFilter === "> 5 Hari" && durationDays > 5);

    return matchesLocation && matchesPrice && matchesDuration;
  });

  const handleApplyFilters = () => {
    onNotify(`${filteredPackages.length} paket cocok dengan filter yang dipilih.`);
  };

  const handleResetFilters = () => {
    setLocationFilter("Semua Destinasi");
    setPriceFilter("Semua Harga");
    setDurationFilter("Semua Durasi");
    onNotify("Filter direset. Semua paket ditampilkan kembali.");
  };

  return (
    <main className="shell page-space packages-page">
      <section className="packages-hero-block">
        <button className="text-link" onClick={onHome} type="button">
          Beranda
        </button>
        <h1>Paket Wisata Pilihan</h1>

        <div className="packages-filter-bar">
          <div className="packages-filter-item">
            <label>Lokasi</label>
            <div className="packages-filter-input">
              <span className="material-symbols-outlined">location_on</span>
              <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}>
                <option>Semua Destinasi</option>
                <option>Bali</option>
                <option>Labuan Bajo</option>
                <option>Raja Ampat</option>
                <option>Papua Barat</option>
                <option>Nusa Tenggara Timur</option>
              </select>
            </div>
          </div>

          <div className="packages-filter-divider" />

          <div className="packages-filter-item">
            <label>Rentang Harga</label>
            <div className="packages-filter-input">
              <span className="material-symbols-outlined">payments</span>
              <select value={priceFilter} onChange={(event) => setPriceFilter(event.target.value)}>
                <option>Semua Harga</option>
                <option>&lt; Rp 5jt</option>
                <option>Rp 5jt - 7jt</option>
                <option>&gt; Rp 7jt</option>
              </select>
            </div>
          </div>

          <div className="packages-filter-divider" />

          <div className="packages-filter-item">
            <label>Durasi</label>
            <div className="packages-filter-input">
              <span className="material-symbols-outlined">schedule</span>
              <select value={durationFilter} onChange={(event) => setDurationFilter(event.target.value)}>
                <option>Semua Durasi</option>
                <option>1-3 Hari</option>
                <option>4-5 Hari</option>
                <option>&gt; 5 Hari</option>
              </select>
            </div>
          </div>

          <button
            className="packages-filter-button"
            onClick={handleApplyFilters}
            type="button"
          >
            <span className="material-symbols-outlined">tune</span>
            Terapkan Filter
          </button>
        </div>
      </section>

      <div className="packages-layout-refined">
        <div className="packages-grid-refined">
          {filteredPackages.map((pkg, index) => (
            <article key={pkg.id} className="package-card-refined">
              <div className="package-card-media">
                <img src={pkg.image} alt={pkg.title} />
                <div className="package-card-tags">
                  <span
                    className={
                      index % 2 === 0
                        ? "package-pill package-pill-green"
                        : "package-pill package-pill-blue"
                    }
                  >
                    {pkg.category}
                  </span>
                  <span className="package-pill package-pill-light">
                    <span className="material-symbols-outlined">timer</span>
                    {pkg.duration}
                  </span>
                </div>
              </div>

              <div className="package-card-body">
                <h3>{pkg.title}</h3>
                <div className="package-rating-line">
                  <span className="material-symbols-outlined filled">star</span>
                  <span>{pkg.rating}</span>
                  <span className="package-rating-muted">({pkg.reviews})</span>
                </div>
                <div className="package-card-footer">
                  <div>
                    <p>Mulai dari</p>
                    <strong>{pkg.price}</strong>
                  </div>
                  <button
                    className="circle-button"
                    onClick={() => onDetail(pkg)}
                    type="button"
                  >
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
            </article>
          ))}

          {filteredPackages.length === 0 ? (
            <div className="packages-empty-state">
              <span className="material-symbols-outlined">travel_explore</span>
              <h3>Tidak ada paket yang cocok</h3>
              <p>Coba ubah lokasi, harga, atau durasi untuk melihat pilihan lain.</p>
            </div>
          ) : null}

          <div className="packages-load-more">
            <button
              className="load-more-button"
              onClick={handleResetFilters}
              type="button"
            >
              <span className="material-symbols-outlined">refresh</span>
              Reset Filter
            </button>
          </div>
        </div>

        <aside className="packages-sidebar">
          <div className="sidebar-panel">
            <h3>Destinasi Rekomendasi</h3>
            {[
              {
                title: "Komodo National Park",
                count: "24 Paket Tersedia",
                image:
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuAXlOmJ_5DYNGttNIzgkj-zR15eqZtO3rhCt-oySzPuManSxbJN5iUgcHUqsxNSylDQVZ3YKtz_dn8esFp9YyFjaAg28AVVAmza3PwIFW7Uw430jcm0mFhGJiycGmUvoASGz4OWLfa-bhGgGodl5MNGgHOT_P20C6KfQisDWAnkp_yWh_Wgqecl8wkv0Mq_DdBPjc6PFggvwLXrZL7eEEclCL3gdhzOhs4-BUgPmJW6UBcsMFAenaCIFmp1iMKC7i-x0Jst6-y6KpE3",
                target: packageList[2] ?? packageList[0],
              },
              {
                title: "Borobudur Temple",
                count: "18 Paket Tersedia",
                image:
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuB5t9MckUhZkL-POlWX4qvExDCg9GzxE7568ppGr7q0qYYPzIzfFnfBQe8FP1w7o84iYMiHn7Uh7Ms4aUs26AKdLDmy9Y-6syC5VDG5qr5St1IP-knR17-FVKqhQGZcu2iwV0aEpofU1VZhcAAWjeZJfjAGivgM47voXgm5kLqJV627qz2u4dxN6OE2dt1NB1VTfa9GpMp-DIuzeP_xtpnWbnmwbrwlu0SGqEsQaESXh3HGCqatCMpcA1m9sIa0FBOkVh37cInvro5H",
                target: packageList[0],
              },
              {
                title: "Munduk Jungle",
                count: "12 Paket Tersedia",
                image:
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuBrueefcYSvf-S3h4qXO3XJOL2shUYstOlVf4cnDDpuWq-N3tKJYDBPA968H_CTdMR8DkCm3ql9OPwfSsj78uq_DTIYgCJCfS1SnxlMS8AfYFnoDL4ed4ChGng6HjXRFGnhZUZk3PibXlby2xIVrxik2MM3RyRc71zKP1IHX9Sga1aDI0wvIuj0mXTNQ7ChZxeT1Maqaze5WXe0oMF6EL-0xERNFlhsLuUGLcc0QybDrC7w0ce6Q0GS_wbqp7GC9igR_Q0FV8Itvyhr",
                target: packageList[1] ?? packageList[0],
              },
            ].map((item) => (
              <button
                key={item.title}
                className="destination-item"
                onClick={() => onDetail(item.target)}
                type="button"
              >
                <img src={item.image} alt={item.title} />
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.count}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="custom-trip-card">
            <div className="custom-trip-content">
              <h4>Ingin Liburan Custom?</h4>
              <p>
                Rancang perjalanan impian Anda sesuai preferensi dan anggaran
                sendiri.
              </p>
              <button className="custom-trip-button" onClick={onCustomTrip} type="button">
                Hubungi Konsultan Kami
              </button>
            </div>
            <div className="custom-trip-glow" />
          </div>
        </aside>
      </div>
    </main>
  );
}

function DetailPage({
  onBack,
  packageList,
  selectedPackage,
  participantCount,
  onParticipantCountChange,
  travelDate,
  onTravelDateChange,
  onCheckout,
  onDetail,
  onPackages,
}) {
  const pricePerPerson = Number(getNumericPrice(selectedPackage.price));
  const totalPrice = pricePerPerson * participantCount;
  const detailGallery =
    selectedPackage.gallery?.length > 0
      ? selectedPackage.gallery.map((image) => image.url ?? image).filter(Boolean)
      : gallery;
  const itineraryItems =
    selectedPackage.itinerary?.length > 0
      ? selectedPackage.itinerary
      : [
          {
            title: "Hari 1: Kedatangan & Sunset Dinner",
            body: "Penjemputan di bandara, check-in di resort, lalu makan malam santai untuk membuka perjalanan Anda.",
          },
          {
            title: "Hari 2: Eksplorasi Budaya & Alam",
            body: "Kunjungan ke spot ikonik, aktivitas utama paket, dan waktu bebas untuk menikmati destinasi.",
          },
          {
            title: "Hari 3: Aktivitas Penutup",
            body: "Sesi terakhir itinerary, belanja oleh-oleh, dan persiapan kembali ke kota asal.",
          },
        ];
  const includedAmenities =
    selectedPackage.amenities?.some((item) => item.checked)
      ? selectedPackage.amenities.filter((item) => item.checked).map((item) => item.label)
      : [
          "Transportasi Private AC",
          "Akomodasi Bintang 4/5",
          "Tiket Masuk Objek Wisata",
          "Makan Sesuai Program",
          "Guide Berpengalaman",
        ];
  const termsList = selectedPackage.terms
    ? selectedPackage.terms
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
    : [
        "Pemesanan minimal dilakukan 7 hari sebelum keberangkatan.",
        "Down Payment (DP) sebesar 50% dari total biaya.",
        "Pelunasan dilakukan paling lambat H-3 keberangkatan.",
        "Pembatalan < H-7 dikenakan biaya administrasi 25%.",
      ];

  const handleParticipantInput = (value) => {
    const digitsOnly = value.replace(/[^\d]/g, "");

    if (!digitsOnly) {
      onParticipantCountChange(1);
      return;
    }

    onParticipantCountChange(Math.max(1, Number(digitsOnly)));
  };

  return (
    <main className="page-space">
      <section className="shell">
        <PageBackButton onBack={onBack} />
      </section>
      <section className="shell detail-gallery">
        <div className="gallery-layout">
          {detailGallery.map((image, index) => (
            <div key={image} className={index === 0 ? "gallery-box main" : index === 3 ? "gallery-box wide" : "gallery-box"}>
              <img src={image} alt={selectedPackage.title} />
              {index === 3 ? (
                <button className="gallery-mini-button" onClick={onPackages} type="button">
                  Lihat Semua Foto
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="shell detail-layout">
        <div className="detail-content">
          <div className="detail-head">
            <div className="detail-badges">
              <span className="soft-badge">Paket Lengkap</span>
              <span className="rating-inline">
                <span className="material-symbols-outlined filled">star</span>
                {selectedPackage.rating} ({selectedPackage.reviews})
              </span>
            </div>
            <h1>{selectedPackage.title}</h1>
            <div className="meta-strip">
              <span>{selectedPackage.duration}</span>
              <span>{selectedPackage.guests}</span>
              <span>{selectedPackage.location}</span>
            </div>
          </div>

          <section className="content-block">
            <h2>Gambaran Umum</h2>
            <p className="detail-lead">
              {selectedPackage.description ??
                `Nikmati pengalaman ${selectedPackage.title} yang dirancang untuk menghadirkan perpaduan petualangan, kenyamanan, dan momen terbaik di ${selectedPackage.location}. Paket berdurasi ${selectedPackage.duration} ini cocok untuk ${selectedPackage.guests.toLowerCase()}, dengan itinerary yang sudah dikurasi agar perjalanan terasa lebih praktis dan berkesan dari awal sampai akhir.`}
            </p>
          </section>

          <section className="content-block">
            <h2>Rencana Perjalanan</h2>
            <div className="timeline-list">
              {itineraryItems.map((item, index) => (
                <div key={item.title} className="timeline-row">
                  <span className="dot" />
                  <div className="timeline-copy">
                    <h3>{item.title || `Hari ${index + 1}`}</h3>
                    <p>{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="content-block feature-boxes">
            <div className="feature-box">
              <h3>Termasuk</h3>
              <ul>
                {includedAmenities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="feature-box warning">
              <h3>Tidak Termasuk</h3>
              <ul>
                <li>Tiket Pesawat</li>
                <li>Tip Guide & Driver</li>
                <li>Pengeluaran Pribadi</li>
                <li>Asuransi Perjalanan</li>
              </ul>
            </div>
          </section>

          <section className="content-block">
            <h2>Titik Temu</h2>
            <div className="meeting-point-card">
              <div className="meeting-point-icon">
                <span className="material-symbols-outlined">flight_land</span>
              </div>
              <div>
                <h3>Bandara I Gusti Ngurah Rai (DPS)</h3>
                <p>
                  Area penjemputan domestik atau internasional sesuai jadwal
                  kedatangan Anda. Guide kami akan membawa papan nama
                  TerraVoyage.
                </p>
              </div>
            </div>
            <div className="meeting-map">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqXZ3xuoHopQUBXy2TocpDjkkWRVGuJWLtsALI_E_wupcU6lL9gn_YgMjbUJRaRW4QNlg3fJuyhyXwIgo5SDy6wv5GGcJ1lxaG4sWk5334akGPFw6QRGH_IXp_sgEJTLnjjrhECyUiwW_0sRXCBcX9M5ghDWJFxE3-TyAAwk0dCiC89rCBGJZ_xQhflF_0iG-5fxGPza11nqeq7rasZ7fRlmhZuGeErIn8BKOYbVJMb8BNil-SxMu7nBqBI5gcL3QgWzFwToceYEwa"
                alt="Titik temu Bali"
              />
            </div>
          </section>

          <section className="content-block">
            <h2>Syarat &amp; Ketentuan</h2>
            <ul className="terms-list">
              {termsList.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="booking-sidebar">
          <div className="booking-card">
            <div className="booking-price-block">
              <p className="muted">Mulai dari</p>
              <h3>{selectedPackage.price}</h3>
              <span className="muted">/orang</span>
            </div>

            <label className="field booking-field">
              <span>Pilih Tanggal</span>
              <input onChange={(event) => onTravelDateChange(event.target.value)} type="date" value={travelDate} />
            </label>

            <label className="field booking-field">
              <span>Jumlah Peserta</span>
              <div className="participant-stepper">
                <button
                  className="stepper-button"
                  onClick={() => onParticipantCountChange(Math.max(1, participantCount - 1))}
                  type="button"
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <input
                  className="participant-input"
                  inputMode="numeric"
                  onChange={(event) => handleParticipantInput(event.target.value)}
                  type="text"
                  value={participantCount}
                />
                <button
                  className="stepper-button"
                  onClick={() => onParticipantCountChange(participantCount + 1)}
                  type="button"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </label>

            <div className="summary-lines">
              <div className="summary-line-item">
                <span>{selectedPackage.price} x {participantCount}</span>
                <strong>{formatRupiah(totalPrice)}</strong>
              </div>
              <div className="summary-line-item">
                <span>Service Fee</span>
                <strong>FREE</strong>
              </div>
              <div className="summary-line-item total">
                <span>Total Pembayaran</span>
                <strong>{formatRupiah(totalPrice)}</strong>
              </div>
            </div>

            <button className="full-button" onClick={onCheckout} type="button">
              Pesan Sekarang
            </button>
            <button className="ghost-button" onClick={onCheckout} type="button">
              Konsultasi via WhatsApp
            </button>
            <p className="booking-helper-text">
              Pemesanan aman dan instan via TerraVoyage
            </p>
          </div>
        </aside>
      </section>

      <section className="shell section">
        <div className="section-head">
          <span>Rekomendasi</span>
          <h2>Paket Wisata Lainnya</h2>
        </div>
        <div className="card-grid three">
          {packageList
            .filter((pkg) => pkg.id !== selectedPackage.id)
            .map((pkg) => (
              <article key={pkg.id} className="tour-card">
                <div className="tour-image-wrap">
                  <img src={pkg.image} alt={pkg.title} />
                  <span className="tour-badge">{pkg.destination}</span>
                </div>
                <div className="tour-body">
                  <p className="tour-label">{pkg.category}</p>
                  <h3>{pkg.title}</h3>
                  <div className="tour-footer">
                    <strong>{pkg.price}</strong>
                    <button className="outline-button" onClick={() => onDetail(pkg)} type="button">
                      Lihat Detail
                    </button>
                  </div>
                </div>
              </article>
            ))}
        </div>
      </section>
    </main>
  );
}

function CheckoutPage({
  onBack,
  selectedPackage,
  participantCount,
  travelDate,
  paymentMethod,
  onPaymentMethodChange,
  onPackages,
  onBookings,
  onNotify,
  onPay,
}) {
  const totalPrice = Number(getNumericPrice(selectedPackage.price)) * participantCount;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const effectiveTravelDate = travelDate || selectedPackage.dates;

  const isFormValid =
    isFilled(name) &&
    isFilled(email) &&
    isFilled(phone) &&
    isFilled(address) &&
    isFilled(effectiveTravelDate);

  const handlePay = async () => {
    if (!isFormValid || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onPay({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        travelDate: effectiveTravelDate,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="checkout-page">
      <section className="shell">
        <PageBackButton onBack={onBack} />
      </section>
      <div className="shell checkout-page-shell">
        <div className="checkout-topbar">
          <div className="checkout-topbar-brand">TerraVoyage</div>
          <div className="checkout-topbar-links">
            <button className="checkout-link" onClick={onPackages} type="button">
              Destinasi
            </button>
            <button className="checkout-link" onClick={onPackages} type="button">
              Pengalaman
            </button>
            <button className="checkout-link" onClick={onPackages} type="button">
              Akomodasi
            </button>
            <button className="checkout-link" onClick={onPackages} type="button">
              Inspirasi
            </button>
          </div>
          <div className="checkout-topbar-actions">
            <button
              className="signin-button"
              onClick={() => onNotify("Fitur masuk akun akan segera tersedia.")}
              type="button"
            >
              Masuk
            </button>
            <button className="secondary-pill" onClick={onBookings} type="button">
              Pesanan Saya
            </button>
          </div>
        </div>

        <div className="checkout-hero">
          <h1>Checkout</h1>
          <p>Selesaikan pesanan Anda untuk memulai petualangan tak terlupakan.</p>
        </div>

        <div className="checkout-layout">
          <div className="checkout-column">
            <section className="checkout-card">
              <h2>
                <span className="material-symbols-outlined">person</span>
                Data Pemesan
              </h2>
              <div className="checkout-form-grid">
                <label className="field">
                  <span>Nama Lengkap</span>
                  <input placeholder="Masukkan nama lengkap" value={name} onChange={(e) => setName(e.target.value)} required />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input type="email" placeholder="contoh@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </label>
                <label className="field">
                  <span>Nomor Telepon</span>
                  <input type="tel" placeholder="+62 812..." value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </label>
                <label className="field full">
                  <span>Alamat</span>
                  <textarea rows="3" placeholder="Masukkan alamat lengkap Anda" value={address} onChange={(e) => setAddress(e.target.value)} required />
                </label>
              </div>
            </section>

            <section className="checkout-card">
              <h2>
                <span className="material-symbols-outlined">payments</span>
                Metode Pembayaran
              </h2>
              <div className="checkout-payment-grid">
                {[
                  { id: "transfer", label: "Transfer Bank", icon: "account_balance" },
                  { id: "qris", label: "QRIS", icon: "qr_code_2" },
                  { id: "ewallet", label: "E-wallet", icon: "account_balance_wallet" },
                ].map((item) => (
                  <button
                    key={item.id}
                    className={
                      paymentMethod === item.id
                        ? "payment-card payment-card-active"
                        : "payment-card"
                    }
                    onClick={() => onPaymentMethodChange(item.id)}
                    type="button"
                    disabled={isSubmitting}
                  >
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <strong>{item.label}</strong>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <aside className="checkout-side">
            <div className="checkout-summary-card">
              <div
                className="checkout-summary-cover"
                style={{ backgroundImage: `url(${selectedPackage.heroImage})` }}
              />
              <div className="checkout-summary-body">
                <div className="summary-badge-wrap">
                  <span className="summary-badge">Perjalanan Pilihan</span>
                </div>
                <h3>{selectedPackage.title}</h3>
                <div className="checkout-summary-list">
                  <div className="checkout-summary-item">
                    <div>
                      <span className="material-symbols-outlined">calendar_today</span>
                      <small>Tanggal</small>
                    </div>
                    <strong>{travelDate || selectedPackage.dates}</strong>
                  </div>
                  <div className="checkout-summary-item">
                    <div>
                      <span className="material-symbols-outlined">group</span>
                      <small>Peserta</small>
                    </div>
                    <strong>{participantCount} Orang</strong>
                  </div>
                </div>
                <div className="checkout-summary-total">
                  <div>
                    <span>Total Harga</span>
                    <strong>{formatRupiah(totalPrice)}</strong>
                  </div>
                  <button 
                    className={isFormValid && !isSubmitting ? "full-button" : "full-button disabled"} 
                    onClick={handlePay} 
                    type="button" 
                    disabled={!isFormValid || isSubmitting}
                  >
                    {isSubmitting ? "Memproses Pesanan..." : "Bayar Sekarang"}
                  </button>
                  <p className="secure-inline">
                    <span className="material-symbols-outlined">lock</span>
                    Pembayaran aman terjamin
                  </p>
                  {!isFormValid ? (
                    <p className="checkout-validation-note">
                      Isi semua field form terlebih dahulu untuk melanjutkan pembayaran.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="checkout-promise-card">
              <span className="material-symbols-outlined">workspace_premium</span>
              <div>
                <strong>Jaminan Harga Terbaik</strong>
                <p>
                  Kami menjamin harga terbaik untuk pengalaman eksklusif ini.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function PaymentSuccessPage({ order, onBookings }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onBookings();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onBookings]);

  return (
    <main className="success-page">
      <div className="success-card">
        <div className="success-icon-wrap">
          <span className="material-symbols-outlined success-check">check_circle</span>
        </div>
        <h2>Pembayaran Berhasil!</h2>
        <p>Terima kasih, pesanan <strong>{order?.packageTitle || order?.title || "Paket Wisata"}</strong> Anda sedang diproses oleh sistem.</p>
        <button className="full-button" onClick={onBookings} type="button">
          Lihat Pesanan Saya
        </button>
        <p className="success-redirect-text">Anda akan diarahkan otomatis dalam 5 detik...</p>
      </div>
    </main>
  );
}

function QrisPage({
  onBack,
  order,
  selectedPackage,
  participantCount,
  onSuccess,
  onPending,
  onExpired,
  totalAmount,
}) {
  const totalPrice = totalAmount || (Number(getNumericPrice(selectedPackage.price)) * participantCount);
  const [isChecking, setIsChecking] = useState(false);
  const timeLeft = useCountdown(order, onExpired);

  useEffect(() => {
    if (timeLeft <= 0) {
      return undefined;
    }

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/check-qris?amount=${totalPrice}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "PAID") {
          clearInterval(pollInterval);
          onSuccess();
        }
      } catch {
        // Abaikan error polling agar tidak mengganggu UI
      }
    }, 5000);
    return () => clearInterval(pollInterval);
  }, [onSuccess, timeLeft, totalPrice]);

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      const res = await fetch(`/api/check-qris?amount=${totalPrice}`);
      if (!res.ok) throw new Error("Gagal");
      const data = await res.json();
      if (data.status === "PAID") {
        onSuccess();
      } else {
        onPending(); // Belum terbayar, masuk ke riwayat pesanan (Pending)
      }
    } catch {
      onPending(); // Jika error API (contoh: credentials belum diatur), tetap biarkan user kembali ke Dashboard
    } finally {
      setIsChecking(false);
    }
  };

  const timeString = formatCountdown(timeLeft);

  let qrcodeUrl = qrisSim;
  try {
    const qrisString = buildDynamicQrisString(BASE_QRIS_STRING, totalPrice);
    qrcodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrisString)}`;
  } catch (error) {
    console.error("Gagal generate QRIS:", error);
  }

  return (
    <main className="qris-page">
      <nav className="qris-back-nav">
        <PageBackButton onBack={onBack} />
      </nav>
      <div className="qris-bg">
        <div className="qris-orb qris-orb-right" />
        <div className="qris-orb qris-orb-left" />
      </div>

      <section className="shell qris-shell">
        <div className="qris-card">
          <div className="qris-merchant">
            <p>Merchant QRIS</p>
            <h2>TerraVoyage Concierge</h2>
          </div>

          <div className="qris-body">
            <div className="qris-timer">
              <p>Batas pembayaran</p>
              <div>
                <span className="material-symbols-outlined">schedule</span>
                <strong>{timeString}</strong>
              </div>
            </div>

            {timeLeft <= 0 ? (
              <div className="payment-expired-note">
                Waktu pembayaran QRIS sudah habis. Pesanan akan dipindahkan ke riwayat.
              </div>
            ) : null}

            <div className="qris-frame">
              <span className="material-symbols-outlined qris-corner">
                qr_code_scanner
              </span>
              <div className="qris-image-box">
                <img src={qrcodeUrl} alt="QRIS TerraVoyage" />
              </div>
              <span className="material-symbols-outlined qris-forest">forest</span>
            </div>

            <div className="qris-total">
              <p>Total pembayaran</p>
              <strong>{formatRupiah(totalPrice)}</strong>
            </div>

            <div className="qris-note-box">
              <span className="material-symbols-outlined">info</span>
              <p>Pindai kode QR dengan aplikasi pembayaran favorit Anda.</p>
            </div>
          </div>

          <div className="qris-actions">
            <button className="full-button" onClick={() => {
              const link = document.createElement("a");
              link.href = qrcodeUrl;
              link.download = `qris-terravoyage-${selectedPackage.id}.png`;
              link.click();
            }} type="button" disabled={timeLeft <= 0}>
              <span className="material-symbols-outlined">download</span>
              Simpan Gambar QR
            </button>
            <button
              className="ghost-button qris-ghost"
              onClick={handleManualCheck}
              type="button"
              disabled={isChecking || timeLeft <= 0}
            >
              {isChecking ? "Mengecek Pembayaran..." : "Saya Sudah Bayar"}
            </button>
          </div>
        </div>

        <div className="qris-trust">
          <div>
                <span className="material-symbols-outlined">verified_user</span>
            <span>Pembayaran Aman</span>
          </div>
          <div>
            <span className="material-symbols-outlined">workspace_premium</span>
            <span>Jaminan TerraVoyage</span>
          </div>
        </div>
      </section>
    </main>
  );
}

function EwalletPage({
  onBack,
  order,
  selectedPackage,
  participantCount,
  onBookings,
  onCheckout,
  onExpired,
}) {
  const totalPrice = Number(getNumericPrice(selectedPackage.price)) * participantCount;
  const timeLeft = useCountdown(order, onExpired);

  return (
    <main className="ewallet-page">
      <section className="shell">
        <PageBackButton onBack={onBack} />
      </section>
      <section className="shell ewallet-shell">
        <div className="ewallet-layout">
          <div className="ewallet-main">
            <article className="ewallet-card">
              <div className="ewallet-head">
                <span className="tour-label ewallet-label">Menunggu Pembayaran</span>
                <h1>Konfirmasi Pembayaran Anda</h1>
                <p>
                  Perjalanan impian Anda tinggal selangkah lagi. Selesaikan
                  pembayaran melalui perangkat seluler Anda.
                </p>
              </div>

              <div className="ewallet-summary">
                <div>
                  <span>Total tagihan</span>
                  <strong>{formatRupiah(totalPrice)}</strong>
                </div>
                <div>
                  <span>ID pesanan</span>
                  <strong>{order?.id ?? "TV-PENDING"}</strong>
                </div>
              </div>

              <div className="qris-timer ewallet-timer">
                <p>Batas pembayaran</p>
                <div>
                  <span className="material-symbols-outlined">schedule</span>
                  <strong>{formatCountdown(timeLeft)}</strong>
                </div>
              </div>

              {timeLeft <= 0 ? (
                <div className="payment-expired-note">
                  Waktu pembayaran e-wallet sudah habis. Silakan buat pesanan baru jika ingin melanjutkan.
                </div>
              ) : null}

              <div className="ewallet-instructions">
                <h2>Cara Pembayaran</h2>
                <div className="instruction-list">
                  <div className="instruction-item">
                    <span>1</span>
                    <p>
                      Buka aplikasi <strong>e-wallet</strong> Anda seperti GoPay,
                      OVO, atau Dana
                    </p>
                  </div>
                  <div className="instruction-item">
                    <span>2</span>
                    <p>
                      Periksa <strong>notifikasi</strong> atau kotak masuk aplikasi
                    </p>
                  </div>
                  <div className="instruction-item">
                    <span>3</span>
                    <p>
                      Konfirmasi transaksi untuk <strong>TerraVoyage</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="ewallet-actions">
                <button
                  className="full-button ewallet-primary"
                  onClick={onBookings}
                  type="button"
                  disabled={timeLeft <= 0}
                >
                  <span className="material-symbols-outlined">sync</span>
                  Cek Status Pembayaran
                </button>
                <button className="ghost-button ewallet-secondary" onClick={onCheckout} type="button">
                  Ganti Metode Pembayaran
                </button>
              </div>
            </article>
          </div>

          <aside className="ewallet-side">
            <div className="ewallet-visual">
              <div className="ewallet-photo">
                <img src={selectedPackage.heroImage} alt={selectedPackage.title} />
                <div className="ewallet-photo-overlay" />
                <div className="ewallet-photo-copy">
                  <p>Destinasi Anda</p>
                  <h2>{selectedPackage.title}</h2>
                  <div>
                    <span className="material-symbols-outlined">location_on</span>
                    <span>{selectedPackage.location}</span>
                  </div>
                </div>
              </div>

              <div className="help-card">
                <span className="material-symbols-outlined">contact_support</span>
                <div>
                  <strong>Butuh bantuan?</strong>
                  <p>
                    Tim concierge kami siap membantu 24/7 sampai pemesanan Anda
                    selesai.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function BankTransferPage({
  onBack,
  order,
  selectedPackage,
  participantCount,
  travelDate,
  onCheckout,
  onBookings,
  onExpired,
  onCopy,
  onOpenUpload,
  onProofUpload,
  proofInputRef,
  uploadedProofName,
}) {
  const totalPrice = Number(getNumericPrice(selectedPackage.price)) * participantCount;
  const timeLeft = useCountdown(order, onExpired);
  const isExpired = timeLeft <= 0 || order?.status === "expired";

  return (
    <main className="bank-page">
      <section className="shell">
        <PageBackButton onBack={onBack} />
      </section>
      <section className="shell bank-shell">
        <div className="bank-layout">
          <div className="bank-main">
            <div className="bank-title-row">
              <span className="material-symbols-outlined filled">account_balance_wallet</span>
              <h1>Selesaikan Pembayaran</h1>
            </div>

            <div className="bank-timer-card">
              <div>
                <p>Sisa waktu</p>
                <strong>{formatCountdown(timeLeft)}</strong>
              </div>
              <div className="bank-ref">
                <p>Referensi pesanan</p>
                <strong>#{order?.id ?? "TV-PENDING"}</strong>
              </div>
            </div>

            {timeLeft <= 0 ? (
              <div className="payment-expired-note">
                Waktu pembayaran transfer sudah habis. Pesanan akan masuk ke status kadaluarsa.
              </div>
            ) : null}

            <div className="bank-detail-card">
              <div className="bank-detail-head">
                <h2>Detail Transfer Bank</h2>
                <span>BCA</span>
              </div>

              <div className="bank-detail-body">
                <div className="copy-row">
                  <div>
                    <p>Nomor rekening</p>
                    <strong>802 455 1200</strong>
                  </div>
                  <button
                    className="copy-button"
                    onClick={() => onCopy("8024551200", "Nomor rekening")}
                    type="button"
                    disabled={isExpired}
                  >
                    <span className="material-symbols-outlined">content_copy</span>
                    Salin
                  </button>
                </div>

                <div className="copy-row">
                  <div>
                    <p>Nominal yang harus ditransfer</p>
                    <div className="amount-line">
                      <strong>{formatRupiah(totalPrice)}</strong>
                    </div>
                  </div>
                  <button
                    className="copy-button"
                    onClick={() => onCopy(String(totalPrice), "Nominal transfer")}
                    type="button"
                    disabled={isExpired}
                  >
                    <span className="material-symbols-outlined">content_copy</span>
                    Salin
                  </button>
                </div>

                <div className="info-line">
                  <span>Nama pemilik rekening</span>
                  <strong>PT VERDANT VOYAGES INDONESIA</strong>
                </div>
              </div>
            </div>

            <div className="upload-card">
              <div className="upload-icon">
                <span className="material-symbols-outlined">cloud_upload</span>
              </div>
              <div>
                <h3>Unggah Bukti Pembayaran</h3>
                <p>
                  Unggah bukti transfer dalam format JPG, PNG, atau PDF dengan
                  ukuran maksimal 5 MB.
                </p>
              </div>
              <input
                ref={proofInputRef}
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden-upload-input"
                onChange={onProofUpload}
                type="file"
                disabled={isExpired}
              />
              <button className="upload-button" onClick={onOpenUpload} type="button" disabled={isExpired}>
                <span className="material-symbols-outlined">attachment</span>
                Pilih File
              </button>
              {uploadedProofName ? (
                <p className="upload-file-name">File dipilih: {uploadedProofName}</p>
              ) : null}
            </div>
          </div>

          <aside className="bank-side">
            <div className="bank-summary-card">
              <div className="bank-summary-media">
                <img src={selectedPackage.heroImage} alt={selectedPackage.title} />
                <div className="bank-summary-overlay" />
                <div className="bank-summary-copy">
                  <span>Perjalanan Pilihan</span>
                  <h2>{selectedPackage.title}</h2>
                </div>
              </div>

              <div className="bank-summary-body">
                <div className="summary-info-row">
                  <span className="material-symbols-outlined">calendar_today</span>
                  <div>
                    <p>Tanggal perjalanan</p>
                    <strong>{travelDate || selectedPackage.dates}</strong>
                  </div>
                </div>

                <div className="summary-info-row">
                  <span className="material-symbols-outlined">group</span>
                  <div>
                    <p>Peserta</p>
                    <strong>{participantCount} Orang</strong>
                  </div>
                </div>

                <div className="price-breakdown">
                  <h4>Rincian harga</h4>
                  <div className="price-breakdown-row">
                    <span>Paket dasar</span>
                    <strong>{selectedPackage.price} x {participantCount}</strong>
                  </div>
                  <div className="price-breakdown-row">
                    <span>Biaya layanan</span>
                    <strong>FREE</strong>
                  </div>
                  <div className="price-breakdown-row total">
                    <span>Total akhir</span>
                    <strong>{formatRupiah(totalPrice)}</strong>
                  </div>
                </div>

                <div className="bank-tip">
                  <span className="material-symbols-outlined filled">info</span>
                  <p>
                    Pastikan nominal yang Anda transfer sesuai agar proses
                    verifikasi berjalan lebih cepat.
                  </p>
                </div>
              </div>
            </div>

            <div className="secure-box">
              <h4>
                <span className="material-symbols-outlined">verified_user</span>
                Pembayaran Aman
              </h4>
              <p>
                Transaksi Anda dilindungi enkripsi SSL 256-bit. TerraVoyage
                tidak pernah menyimpan kredensial perbankan Anda.
              </p>
            </div>

            <div className="bank-actions">
              <button className="full-button" onClick={onBookings} type="button" disabled={isExpired}>
                Saya Sudah Unggah Bukti
              </button>
              <button className="ghost-button bank-ghost" onClick={onCheckout} type="button">
                Ganti Metode Pembayaran
              </button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function BookingsPage({
  packageList,
  bookingsData,
  customerSession,
  onPackages,
  onDetail,
  onPendingPayment,
  onResumeQris,
  onResolveCustomerSession,
  onResetCustomerSession,
  onChat,
  onInvoice,
  onReview,
  onAccountSettings,
}) {
  const [lookupEmail, setLookupEmail] = useState(customerSession?.email ?? "");
  const [lookupPhone, setLookupPhone] = useState(customerSession?.phone ?? "");
  const [lookupOrderId, setLookupOrderId] = useState(customerSession?.orderId ?? "");
  const [lookupError, setLookupError] = useState("");
  const [activeBookingFilter, setActiveBookingFilter] = useState("active");
  const userOrders = (bookingsData.length > 0 ? bookingsData : defaultAdminOrders)
    .filter((order) => {
      if (!customerSession) {
        return false;
      }

      const matchesEmail =
        customerSession.email &&
        normalizeEmail(order.customerEmail) === normalizeEmail(customerSession.email);
      const matchesPhone =
        customerSession.phone &&
        formatPhoneNumber(order.customerPhone) === formatPhoneNumber(customerSession.phone);

      return matchesEmail || matchesPhone;
    })
    .sort((first, second) => {
      const firstTime =
        parseTimestamp(first.createdAtMs) ?? parseTimestamp(first.createdAt) ?? 0;
      const secondTime =
        parseTimestamp(second.createdAtMs) ?? parseTimestamp(second.createdAt) ?? 0;

      return secondTime - firstTime;
    });

  const bookingCards = userOrders.filter((order) => {
    if (activeBookingFilter === "all") {
      return true;
    }

    return order.status === "pending" || order.status === "paid" || order.status === "confirmed";
  });

  useEffect(() => {
    setLookupEmail(customerSession?.email ?? "");
    setLookupPhone(customerSession?.phone ?? "");
    setLookupOrderId(customerSession?.orderId ?? "");
  }, [customerSession]);

  useEffect(() => {
    if (bookingCards.length === 0 && userOrders.length > 0 && activeBookingFilter === "active") {
      setActiveBookingFilter("all");
    }
  }, [activeBookingFilter, bookingCards.length, userOrders.length]);

  const handleLookupBooking = () => {
    const email = normalizeEmail(lookupEmail);
    const phone = formatPhoneNumber(lookupPhone);
    const orderId = String(lookupOrderId ?? "").trim();

    const matches = bookingsData.filter((order) => {
      const matchesIdentity =
        (email && normalizeEmail(order.customerEmail) === email) ||
        (phone && formatPhoneNumber(order.customerPhone) === phone);
      const matchesOrderId = !orderId || String(order.id) === orderId;

      return matchesIdentity && matchesOrderId;
    });

    if (matches.length === 0) {
      setLookupError("Pesanan tidak ditemukan. Periksa kembali email, nomor telepon, atau kode order Anda.");
      return;
    }

    const firstMatch = matches[0];
    onResolveCustomerSession({
      name: firstMatch.customerName,
      email: firstMatch.customerEmail,
      phone: firstMatch.customerPhone,
      orderId: firstMatch.id,
    });
    setLookupError("");
  };

  if (bookingCards.length === 0) {
    return (
      <main className="shell page-space bookings-page">
        <div className="bookings-layout-refined">
          <aside className="bookings-sidebar">
            <section className="profile-card-refined">
              <div className="profile-card-inner">
                <div className="profile-avatar-wrap">
                  <img
                    className="profile-avatar"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuApWiNrS8hB_h0SUfr0fcNawgQhXYUFzotSlaEAyZCShiVgAVIbRjInGkLD10flg8Qur1SkPtkVpSawT2-nCMC975vH5I71tCi5mWRWGzp_IXRt6xlmyhNCP31pab1RiM9qVOh6lfhu2uBf_wy1dZc8203MnAhcePwV3jBaPg2kpweqwt9dA4nh74_RC4jD3YsHrkwMsEM1rWVq6oPOVi_2cfjMVHRgrfsTk81o9DpAMpmbQ0Qm2_Z2Ec3ncmS6we43x9LbtT8i4mSc"
                    alt="Profile"
                  />
                </div>
                <h2>{customerSession?.name || "Belum Ada Pemesanan"}</h2>
                <p>
                  {customerSession
                    ? "Belum ada order yang cocok dengan data pelacakan ini."
                    : "Riwayat perjalanan Anda akan muncul di sini setelah checkout berhasil dibuat."}
                </p>
              </div>
            </section>
          </aside>

          <section className="bookings-main-refined">
            <div className="bookings-topbar">
              <h1>Riwayat Pemesanan</h1>
            </div>
            <div className="booking-empty-state">
              <span className="material-symbols-outlined">travel</span>
              <h3>{customerSession ? "Pesanan belum ditemukan" : "Anda belum memiliki order aktif"}</h3>
              <p>
                {customerSession
                  ? "Jika Anda pernah memesan dari browser lain, masukkan ulang data pemesanan di bawah ini."
                  : "Pilih paket wisata terlebih dahulu, lalu lengkapi checkout untuk membuat pesanan pertama."}
              </p>
              <div className="booking-lookup-card">
                <div className="booking-lookup-grid">
                  <label className="field">
                    <span>Email Pemesan</span>
                    <input
                      onChange={(event) => setLookupEmail(event.target.value)}
                      placeholder="contoh@email.com"
                      type="email"
                      value={lookupEmail}
                    />
                  </label>
                  <label className="field">
                    <span>Nomor Telepon</span>
                    <input
                      onChange={(event) => setLookupPhone(event.target.value)}
                      placeholder="+62 812..."
                      type="tel"
                      value={lookupPhone}
                    />
                  </label>
                  <label className="field full">
                    <span>Kode Order</span>
                    <input
                      onChange={(event) => setLookupOrderId(event.target.value)}
                      placeholder="Opsional, misalnya TV-123456789"
                      type="text"
                      value={lookupOrderId}
                    />
                  </label>
                </div>
                {lookupError ? <p className="booking-lookup-error">{lookupError}</p> : null}
                <div className="booking-lookup-actions">
                  <button className="booking-primary-action" onClick={handleLookupBooking} type="button">
                    Lacak Pesanan Saya
                  </button>
                  <button className="booking-secondary-action" onClick={onPackages} type="button">
                    Lihat Paket Wisata
                  </button>
                  {customerSession ? (
                    <button className="booking-secondary-action" onClick={onResetCustomerSession} type="button">
                      Reset Data Pelacakan
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const primaryOrder = bookingCards[0];

  const getPackageImage = (order) => {
    if (!order) return "";
    const pkg = packageList?.find(p => p.id === order.packageId);
    return pkg?.image ?? order.packageImage ?? order.image ?? order.receiptImage;
  };

  const getPackageByOrder = (order) =>
    packageList?.find((pkg) => pkg.id === order.packageId) ?? packageList[0];

  const getStatusLabel = (order) => {
    if (order.status === "confirmed") {
      return "Dikonfirmasi";
    }

    if (order.status === "paid") {
      return "Sudah Dibayar";
    }

    if (order.status === "expired") {
      return "Kadaluarsa";
    }

    if (order.status === "cancelled") {
      return "Dibatalkan";
    }

    return "Menunggu Pembayaran";
  };

  const getStatusClassName = (order) => {
    if (order.status === "confirmed" || order.status === "paid") {
      return "booking-chip-success";
    }

    if (order.status === "cancelled" || order.status === "expired") {
      return "booking-chip-neutral";
    }

    return "booking-chip-warning";
  };

  const handlePrimaryAction = (order) => {
    if (order.status === "pending") {
      if (order.paymentMethod === "qris" || order.receiptBank?.includes("QRIS")) {
        onResumeQris(order);
        return;
      }

      onPendingPayment(order);
      return;
    }

    onInvoice(order);
  };

  const hasAnyOrders = userOrders.length > 0;

  return (
    <main className="shell page-space bookings-page">
      <div className="bookings-layout-refined">
        <aside className="bookings-sidebar">
          <section className="profile-card-refined">
            <div className="profile-card-inner">
              <div className="profile-avatar-wrap">
                <img
                  className="profile-avatar"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuApWiNrS8hB_h0SUfr0fcNawgQhXYUFzotSlaEAyZCShiVgAVIbRjInGkLD10flg8Qur1SkPtkVpSawT2-nCMC975vH5I71tCi5mWRWGzp_IXRt6xlmyhNCP31pab1RiM9qVOh6lfhu2uBf_wy1dZc8203MnAhcePwV3jBaPg2kpweqwt9dA4nh74_RC4jD3YsHrkwMsEM1rWVq6oPOVi_2cfjMVHRgrfsTk81o9DpAMpmbQ0Qm2_Z2Ec3ncmS6we43x9LbtT8i4mSc"
                  alt="Profile"
                />
                <div className="profile-edit-badge">
                  <span className="material-symbols-outlined">edit</span>
                </div>
              </div>
              <h2>{primaryOrder.customerName}</h2>
              <p>Pelanggan TerraVoyage</p>
              <div className="profile-stats refined">
                <div>
                  <span>Total Trip</span>
                  <strong>{bookingCards.length}</strong>
                </div>
                <div>
                  <span>Status Terakhir</span>
                  <strong className="gold-number">{getStatusLabel(primaryOrder)}</strong>
                </div>
              </div>
              <div className="booking-customer-meta">
                <div>
                  <span>Email</span>
                  <strong>{primaryOrder.customerEmail}</strong>
                </div>
                <div>
                  <span>Telepon</span>
                  <strong>{primaryOrder.customerPhone}</strong>
                </div>
                <div>
                  <span>Alamat</span>
                  <strong>{primaryOrder.address}</strong>
                </div>
              </div>
            </div>
          </section>

          <nav className="bookings-side-nav">
            <button className="side-nav-item active" type="button">
              <span className="material-symbols-outlined">receipt_long</span>
              <span>Status Booking</span>
            </button>
            <button className="side-nav-item" onClick={onPackages} type="button">
              <span className="material-symbols-outlined">favorite</span>
              <span>Destinasi Tersimpan</span>
            </button>
            <button className="side-nav-item" onClick={onAccountSettings} type="button">
              <span className="material-symbols-outlined">settings</span>
              <span>Pengaturan Akun</span>
            </button>
            <button className="side-nav-item" onClick={onResetCustomerSession} type="button">
              <span className="material-symbols-outlined">manage_search</span>
              <span>Ganti Data Pesanan</span>
            </button>
          </nav>
        </aside>

        <section className="bookings-main-refined">
            <div className="bookings-topbar">
              <h1>Riwayat Pemesanan</h1>
              <div className="booking-filter-pills">
                <button
                  className={activeBookingFilter === "all" ? "booking-filter-pill active" : "booking-filter-pill"}
                  onClick={() => setActiveBookingFilter("all")}
                  type="button"
                >
                  Semua
                </button>
                <button
                  className={activeBookingFilter === "active" ? "booking-filter-pill active" : "booking-filter-pill"}
                  onClick={() => setActiveBookingFilter("active")}
                  type="button"
                >
                  Aktif
                </button>
              </div>
            </div>

          {bookingCards.length === 0 && hasAnyOrders ? (
            <div className="booking-empty-state">
              <span className="material-symbols-outlined">filter_alt_off</span>
              <h3>Tidak ada order aktif</h3>
              <p>Semua pesanan Anda saat ini sudah selesai, dibatalkan, atau kadaluarsa. Pilih tab Semua untuk melihat seluruh riwayat.</p>
              <button className="booking-secondary-action" onClick={() => setActiveBookingFilter("all")} type="button">
                Lihat Semua Riwayat
              </button>
            </div>
          ) : (
          <div className="bookings-list refined">
            {bookingCards.map((order) => {
              const isCompleted = order.status === "confirmed";
              const isCancelled = order.status === "cancelled" || order.status === "expired";

              return (
                <article
                  key={order.id}
                  className={
                    isCompleted || isCancelled ? "booking-item refined faded" : "booking-item refined"
                  }
                >
                  <div className={isCompleted || isCancelled ? "booking-media grayscale" : "booking-media"}>
                    <img
                      src={getPackageImage(order)}
                      alt={order.packageTitle ?? order.title}
                    />
                    <span
                      className={
                        order.packageCategory === "Open Trip"
                          ? "booking-type-tag primary"
                          : "booking-type-tag tertiary"
                      }
                    >
                      {order.packageCategory ?? "Trip Privat"}
                    </span>
                  </div>
                  <div className="booking-copy refined">
                    <div>
                      <div className="booking-top">
                        <h3 className={isCompleted || isCancelled ? "muted-title" : ""}>
                          {order.packageTitle ?? order.title}
                        </h3>
                        <span className={`status-pill ${getStatusClassName(order)}`}>
                          <span className="material-symbols-outlined">
                            {order.status === "pending"
                              ? "pending"
                              : order.status === "cancelled"
                                ? "do_not_disturb_on"
                                : "check_circle"}
                          </span>
                          {getStatusLabel(order)}
                        </span>
                      </div>
                      <div className={isCompleted || isCancelled ? "booking-info-grid single" : "booking-info-grid"}>
                        <div className={isCompleted || isCancelled ? "booking-info-item muted" : "booking-info-item"}>
                          <span className="material-symbols-outlined">calendar_month</span>
                          <span>{order.travelDate ?? order.date}</span>
                        </div>
                        <div className="booking-info-item">
                          <span className="material-symbols-outlined">payments</span>
                          <strong>{order.total ?? order.price}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="booking-action-row">
                      <button
                        className={order.status === "pending" ? "booking-primary-action" : "booking-secondary-action"}
                        onClick={() => handlePrimaryAction(order)}
                        type="button"
                      >
                        <span className="material-symbols-outlined">
                          {order.status === "pending" ? "upload_file" : "download"}
                        </span>
                        {order.status === "pending"
                          ? order.paymentMethod === "qris" || order.receiptBank?.includes("QRIS")
                            ? "Lanjutkan Pembayaran"
                            : "Upload Bukti Pembayaran"
                          : "Unduh Invoice"}
                      </button>
                      <button className="booking-chat-action" onClick={() => onChat(order)} type="button">
                        <span className="material-symbols-outlined">chat</span>
                      </button>
                      <button className="booking-chat-action" onClick={() => onDetail(getPackageByOrder(order))} type="button">
                        <span className="material-symbols-outlined">arrow_outward</span>
                      </button>
                    </div>
                    {isCompleted ? (
                      <div className="booking-inline-links">
                        <button onClick={() => onReview(order)} type="button">Beri Ulasan</button>
                        <span>|</span>
                        <button onClick={() => onDetail(getPackageByOrder(order))} type="button">
                          Lihat Detail
                        </button>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Footer({ siteSettings, onPackages, onBlog, onContact, onPrivacy }) {
  return (
    <footer className="site-footer">
      <div className="shell footer-row">
        <div>
          <strong>TerraVoyage</strong>
          <p>
            {siteSettings.footerDescription}
          </p>
        </div>
        <div className="footer-links">
          <button onClick={onPackages} type="button">Galeri</button>
          <button onClick={onBlog} type="button">Blog</button>
          <button onClick={onContact} type="button">Kontak</button>
          <button onClick={onPrivacy} type="button">Kebijakan Privasi</button>
        </div>
      </div>
    </footer>
  );
}

export default App;

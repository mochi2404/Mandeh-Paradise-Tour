const SITE_PACKAGES_KEY = "terravoyage-packages";
const SITE_SETTINGS_KEY = "terravoyage-settings";
const SITE_ORDERS_KEY = "terravoyage-orders";
const SITE_UPDATED_AT_KEY = "terravoyage-updated-at";
const CONTENT_API_ENDPOINT = "/api/content";
const IMAGE_UPLOAD_ENDPOINT = "/api/upload";

export const defaultPackages = [
  {
    id: "bali",
    title: "Exotic Bali Adventure",
    location: "Ubud & South Bali",
    destination: "Bali",
    category: "Trip Privat",
    duration: "4 Hari 3 Malam",
    guests: "Min. 2 Orang",
    price: "Rp 4.500.000",
    totalPrice: "Rp 9.000.000",
    checkoutPrice: "Rp 12.500.000",
    rating: "4.9",
    reviews: "120 ulasan",
    dates: "15 - 22 Okt 2024",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBV7DwpX38E1Qbq0IHAnNxg7QUk8FLJ3hxBlXcqPQACW-XB0vcEuO2mSU1eGeza1pJahAQTQV_J1Go-nXBuu3ghB_X_Jel6I11u4Eqa-Eeg-bK8eUTh26bfKjdL9QRYZAeALiOGF2uERoa9cl7EwGl3_I1SoJf90yNSEHGBfMujQNiGBuK1rtT8sLKpdDUTSv83P9xz7OOPxVmr_nhy_cpgfFkx3N50dH_LyKRVO7T4WSN41Dujf3FUehDAgHqfKRFmHLgv9joCURct",
    heroImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCIZ2kicoMYAaa1UlZAS31CwpktLqOV0oOXGvhgRtQzDCWPTXAw4eb7Atmk8S7j2c6gBjr0csDU-COBZ1Nn42ry_vqFrHKJBavexIlSw7837QBFBLNMoRXd6sV4VTHUhr5u4dHk7MYhU8kphfB_44FUOyJAjvkl80DQrCbpx3LuxKJkKzL2DXfTZQRXtvjACiQAVHiVcyXxUnVrD9xCdLhSoIKIgGy5-W1dPqFI-NdZcGtztTR7Ko60-nnXi681AjqCuTfCWtNlJxfV",
    description:
      "Paket premium untuk menikmati ketenangan Bali, pengalaman budaya yang hangat, dan perjalanan privat yang nyaman dari awal sampai akhir.",
    gallery: [
      {
        id: 1,
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCY3AA83hBAyYxdRlcUpDmBwP8cgiNXXi4cCdhqEP2ydQM0HgkvYWiFE-m31TZlI0HGiiK0RPi1EbAKYAzHwXyWlG-WENywVYTHmYV6wnON64aOzTQZnAWrIUTiwu001mRQhOWkBYeB2QRS_D60WA0CtPrc6BfBA5pgiykbJfDEMdqMGpGGgcZGwnpyrzAdIqXgM7ff67p0W2Uo7_IdW8Cxl5VZxW1J4U-aCZddhs1x11toaj8E78aDTQn558WweA6VE_ApVTu3qO4b",
        alt: "Villa mewah dengan kolam infinity di Bali",
      },
      {
        id: 2,
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuACNlG4Zcho9EdwDSNxkN57m8d032hTnHAEcVnLJHvOFiaK2iOP9uHw0Jz1IwMrRpy3IaSsNXAiwg8Fc5ke9W0EE8Dp_-DSvz_pWjhewC0XwlS4KDxOgbzjsBAeoLwWv9lfvbGzaKhUhzuiE0d7-MQ1ychHRo3Ow5-8e5jfIKchaJBVXhnek2h1rR19SXoFHWRN4EaUO5nLY1CC4ACCgiOC1PfYb1wlaFmUl44DID0jfyH3ZFpCADjvrO9uEr1quvedbvB5vddX0g9l",
        alt: "Sawah bertingkat di Bali saat pagi hari",
      },
      {
        id: 3,
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuADS4OumMDWzxgqNlCIi1cpoYLdh3HLk9MdmY0gPed_OIrMZj6sgcFv4CAAEMjeTyfTOwLwoGskdXBh5llgJkYkPtB4eAoDRRieijKkCBPeViS-ISAEKQOOAxgvrzIrMqJmWPlQgD2IZlfARDmbvPZuepoDRIDMgxp2PUuQjPKyGN_7EXGmBaZxtIq6fKjY36jP7e3ksLjWQo0dLgA5O-MrVxIKz21Rcjgl3144glCQUbYPt5e-ey-Wcns267nJf8U8kXhQiqm4hzCP",
        alt: "Interior vila bambu mewah",
      },
    ],
    itinerary: [
      {
        id: 1,
        title: "Hari 1: Kedatangan & Sambutan Bali",
        body: "Penjemputan bandara, check-in hotel, dan makan malam santai untuk membuka perjalanan.",
        expanded: true,
      },
      {
        id: 2,
        title: "Hari 2: Eksplorasi Ubud",
        body: "Mengunjungi sawah terasering, pusat seni, dan spot wellness pilihan.",
        expanded: true,
      },
    ],
    amenities: [
      { id: 1, label: "Luxury Hotel Stay", checked: true },
      { id: 2, label: "Daily Breakfast", checked: true },
      { id: 3, label: "Airport Transfer", checked: true },
      { id: 4, label: "Private Tour Guide", checked: false },
    ],
    terms:
      "Pemesanan minimal dilakukan 7 hari sebelum keberangkatan.\nDP sebesar 50 persen dari total biaya.\nPembatalan kurang dari H-7 dikenakan biaya administrasi.",
  },
  {
    id: "raja-ampat",
    title: "Keajaiban Raja Ampat",
    location: "Raja Ampat",
    destination: "Papua Barat",
    category: "Open Trip",
    duration: "4D3N",
    guests: "Max 8",
    price: "Rp 6.500.000",
    totalPrice: "Rp 13.000.000",
    checkoutPrice: "Rp 13.000.000",
    rating: "4.9",
    reviews: "120 ulasan",
    dates: "12 - 15 Nov 2024",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAS-orqCmJWnrpXQH7kVLxZp1qgQ2zqVRn81RbyKi2X9QIDPxKw4VtuLrCclEGyiUqP6tpNV59xTcvDVauyrddlSD9b-19iCPjr2lVRr0MGHActuLz3oUNcY4ov4hUDA8_EeQo2MN9NrhkCO11gNDhzRmoQ6nLO7sphM-G-yEyfqh8qMv3DKNViDlwdkAzbKZx7qE4AKkn-XMHSL6gq1JmSnFStREblg-I2Tt7Ttajzqo2oPPd2HzOxWedqIlz_ui2FN7EYvxiHy3U1",
    heroImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD06n7L-o6weEifVQUH0OMQls2-ebnxBaz0T72D7uaNv3KSSoXwMB4JxBZP5YMbcY_NVd7NFyOpS_VyHNSOBO0Qlpf-chLlj9SoDhCJNknQHzjflTsid2oRiY65SEA-6uCRowv62tdiIXYd_jT7pGJOzSCL2iQ8P_v5PzupyQY3eaAuVajDrb7BlgdimlhOyZkNQ0_6c4IIC6DcrIV3VoGry9qnTWS4iILnM52Jxz19efyRIw43kq4wlUHf_6iWL54mWgeM_mHCuCN1",
    description:
      "Eksplorasi gugusan pulau terbaik Indonesia dengan open trip yang rapi, aman, dan tetap nyaman untuk pencinta laut.",
    gallery: [],
    itinerary: [],
    amenities: [],
    terms: "Jadwal dapat menyesuaikan cuaca dan kondisi laut.",
  },
  {
    id: "komodo",
    title: "Sailing Komodo Island",
    location: "Labuan Bajo",
    destination: "Nusa Tenggara Timur",
    category: "Open Trip",
    duration: "5 Hari 4 Malam",
    guests: "Max 10",
    price: "Rp 7.800.000",
    totalPrice: "Rp 15.600.000",
    checkoutPrice: "Rp 15.600.000",
    rating: "4.9",
    reviews: "154 ulasan",
    dates: "10 - 13 Jan 2025",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDFNvFLeoMZeISmcDKsUr0Z1RpnEPFMSG9eur65x6PbABy_gUmzU76WYo9FePPknTFTD1LthHvYSPQL1q5jd33xjJMDF5h4zR0UIyCbY6dVXPwiAlpvJYwYDlW1zVuV2o92Zde9NaBD4lW_lSKp1o8q9TZxiopyZz8b_FPnpDfpdxwJkjEWAxos9YRHbVfly00SCKx9w0nxgxdsI6RxYIZVlVNcPkk21ljXRBvqh7NRV8warN1O1RDeoX0kd1U4cf0dndL8cgjg-LAe",
    heroImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBn0RHkJ0wzxuSELxW7-G-sJbIxhFFCTzCGh3z1m9xG79laIIySmkM1bMWn1EJXSSaevdFCWhLftEHxfIj1ekp8CxGZB-ruuGCn_X_cmo7hv1QNKxUV7zwncQKI6AZflCHX84PYzF1cRmCrrq1g91sX3WJtr9GSJ8itUFsZLmlhhbeWLjrhxsXUqQeN36o1AKhyfEDb9GLc7q4ZBXIT16hl_Sy3DcpybZjPUGY66d0wlJ6vz_esXjnh5I8QmDiRj5F3fnsESdRErCu4",
    description:
      "Perjalanan liveaboard menuju pulau-pulau terbaik Komodo dengan momen sunrise, snorkeling, dan island hopping yang padat pengalaman.",
    gallery: [],
    itinerary: [],
    amenities: [],
    terms: "Peserta wajib mengikuti briefing keselamatan sebelum berangkat.",
  },
];

export const emptySitePackages = [];

export const defaultSiteSettings = {
  heroTitle: "Jelajahi Keindahan Alam Terbaik Indonesia",
  heroSubtitle:
    "Perjalanan berkelanjutan yang dikurasi untuk destinasi paling memikat, nyaman, dan berkesan.",
  heroSearchPlaceholder: "Mau ke mana?",
  experienceEyebrow: "Pengalaman",
  experienceTitle: "Pilih Petualangan Favoritmu",
  experienceCards: [
    {
      title: "Pantai Eksotis",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBweXB3CJwpeerQnTBcTSiDH8InUUAXkaVZunbjtEZ911Ub-GcffN0qi-_wHvfIsKDSHNHIHjcum2g8gGjCIObfV4xEajrJ8hLIvkCe8uMc0u6vIvpT-8W4wz5MJG9t6JHEoUtFW1FAmPSvxYd35dznhKeJXNC_nCsVxBDhTSGjdNjg_b3E6ifJm1AsvA_bMls82tL9havz84P75MGzue10Wgl90wcqKMp40WRokxsZvNM-_5xNK0CRSyVyzSGD93sfJ0RnmWkHa-b7",
    },
    {
      title: "Puncak Pegunungan",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBMfUhY4Ap1IE7FSQwradq3_kXuLCB9J8aHiUUn5h9HwE8cVg3mVtP_qx6LgGBNXLs_1KKWklDBH8k6htPxv9n8dtzaIgS4k8YkNy4RVihRcryymFgbZFPJBnPkVLLvW0PWNJBNfwyqVrQVDQW3LT0Ht1_m6W6BUjSPiDvGbO_1xvQoNFtHRH9Aj6WuILmpFMXlapY4SPkP5KJbmhGLGITEoN7gvUWU-eVpoRgxYXZpt4a-DjR7kcm_OUcKc3toeDGLlVZ3m2L0_uJm",
    },
    {
      title: "Warisan Budaya",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAMWbREprszDCTI4nVtKL7EvyBLa79llVIZO9sMGdDe5I-QFfp93xcGXOmRzIgB9OUuV8T4rx1R2_4huVhcrbStDtIrRbKz6CqPpSoxGyEv4LT0Jdz62xaCS2QOC--mO8sVDGS6sCRSeQpxy_P1amzM-yBSFUgcQMzYIEStyls2DpsDSzcfXLj2Eg2qEx1zPKFJgSXK9cSUUZOwSJMgoQcGWwIWxgB8qYTQ9WH2yq-5HJw_B9rP8x5VHgd4JC18qPn0E44Tl615JvEI",
    },
    {
      title: "Eco Escape",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAomIZjWU2hKcBLunkPV7IE007KncOttZB9QUtpYiMfSBbPuf-fdAHd9a-qd9vrIRx8689duK5rNMsO4tkKXAXNo_bAkPSplhJTsdT6l6siLI9HEkFrU8lf9tkRFVv-G1dQtaYuTfgK5RfYjpj8QbeH5mHnjNJeczjZX-MOtBQOlYHaL4K6HocsuU3ShopltTPmJn9YRikc1LQGmIQtAPUzRl9aw4ITG6TLweZjcRokKOzuWMVoXwxrwWl73xqnR-TjGNivJGbR4SgC",
    },
  ],
  featuredEyebrow: "Favorit Saat Ini",
  featuredTitle: "Paket Wisata Populer",
  promoKicker: "Promo Early Bird",
  promoTitle: "Dapatkan Diskon 20% untuk Perjalanan Berikutnya",
  promoDescription:
    "Pesan sebelum akhir bulan ini dan nikmati fasilitas premium eksklusif untuk perjalanan Anda.",
  promoButton: "Klaim Promo",
  promoInfoLabel: "Syarat Berlaku",
  promoImage:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAvuBj4dAuWNZpy9Kq7PD8NydLpe0Rq5cjBqjVBQPuW_QDMY0H3L2n51wtCDpN7mD5JKBUPIPwSKZWJqkiDSdzZ-mNcjNYuGI0hKnsFJ51Y51iN2AHhxkNJiFsy2gGMG498HFVUox5eBWUCJqVlJDxeJBYKcYCSTfsA8Hu_7xhifFKwEupfnW7VonJQDiIoFsT-QIt8LBRLFgvecfGkqAmREZg5sZBOhSZBbAFWyGRr7uFAMgqzp5goX5J2e5qFjZK-37qXgMkUXETA",
  testimonialsEyebrow: "Testimoni",
  testimonialsTitle: "Apa Kata Para Traveler Kami",
  chatButtonLabel: "Chat dengan kami",
  footerDescription:
    "Premium concierge service for extraordinary journeys and curated travel experiences across Indonesia.",
  adminProfile: {
    fullName: "Admin TerraVoyage",
    email: "admin@terravoyage.id",
    phone: "+62 812-0000-0000",
    role: "Super Admin",
    photo:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDgl6TwxTd0ZzZBJgRo-UlyTeWAeCUuXndrFn84IjhDSLz1n-i7liRqcyGYhDq5sU5NEeJFIvlvSOOzG3GpKdZcJQEW_CqnvMLy56s_PtwiUTRHb2v7ILj8FeSQP4i1VQdQrV1FIUPixDp-yL3Haa9dkr9AI8L6otbx0OPR2Hq_sYjrZ9c3svUrOe_dcf5xoAp_Dbz-vfGb4GcvUKagu2deJvMkc0mc6aF5UZ7dk1Nd_ZZ4iQJuyZW2FRyBMBRORyo33Nco1cJrE8JZ",
  },
  adminSecurity: {
    password: "admin123",
    lastPasswordUpdatedAt: "-",
  },
  testimonials: [
    {
      quote:
        "The attention to detail was incredible. Every stop felt curated and meaningful. Truly a premium experience.",
      name: "Sarah Jenkins",
      role: "Adventurer",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBWMxmpsp-icPEWD8w8fhmhXcoX5eLMnrs9IrG8Anq40kTm6EDm-P3IGCKpjgdN0l6XAwQJ6m42M7mGqvmlQ2dlYr37yEGLfiI_4Oa5T3FCGhoGz7aj8R3X93m_M5h-mZSKMa3rLeZjuO3lpWQN3IaOG0t0axi2mF5rDAGHaWYWLnQ_LdrEqIIe2GhKXTWZKULFyyq8F1T1lHmIayJ5pGixAEq7xA6UE7N4oIX_jckzQ1Q_YxoDVawvTEgVyrT8ddaWNYMOok8LwutP",
    },
    {
      quote:
        "TerraVoyage made our honeymoon unforgettable. The private guides were so knowledgeable and the locations were breath-taking.",
      name: "Michael Ross",
      role: "Nature Enthusiast",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuChQIGKX4r0wRaGCb-olo-xlKMnYxnnZGWcAc2_JqnxIufH5aN_1iK2ZzQuNNVLBPsKU5fe70sOsTyLWkfwW7LbVMGCXhCPPWh9AGu3mAVD3-MQEwVYMiYi94pBqv7JFoUM5tvT9iIV-WDTS_1oghgihABNM_3Yi-xbr0VDkuHQl_e9OvXOhgOCQV0W-TEf0NzXflCSyoGZ4zNLiXylob7nwZVYrQHDAqsOwqzBEAmAvT3PYcwwlDfsz3NcNSw9uw0VvEHlnQ5sOZDc",
    },
    {
      quote:
        "Commitment to sustainability and eco-luxury is unmatched. Rasanya premium tapi tetap hangat.",
      name: "Elena Vogt",
      role: "Eco-Traveler",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuA2_SjVi9N5jCwHynhUbeihV-0i1aBPgkRioF3kt35Vvvt8LB8rVGCV6ZYl1Hmx51-whFYv63_pPtq6uAPPYSXEUp8aOXoH9pq5b-HxQTx0_P4oc7lVlCVPogtA3MHCM10FcARgqx6-CFSANE_cwcY3Vp9IV79ELOrEpME6vMPA1Pp_am0W_PO137vK_FtpVH3T8rGEX_RTItR-JFDATCSxWxEi3fNk1f4SJFoSWT5dnGXIUdxzxhN4uH0ZRNffBiHQtJzBbLwHprui",
    },
  ],
};

export const defaultAdminOrders = [];

const LEGACY_SEED_PACKAGE_SIGNATURES = new Set(
  defaultPackages.map((item) => `${item.id}:${item.title}`),
);
const PAYMENT_EXPIRY_SECONDS = {
  qris: 15 * 60,
  ewallet: 30 * 60,
  transfer: 24 * 60 * 60,
};
const EXPIRY_TOLERANCE_MS = 1500;

function getOrderExpirySeconds(paymentMethod) {
  return PAYMENT_EXPIRY_SECONDS[paymentMethod] ?? PAYMENT_EXPIRY_SECONDS.transfer;
}

function parseTimestamp(value) {
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
}

function getOrderExpiryTime(order) {
  const createdAtMs =
    parseTimestamp(order?.createdAtMs) ?? parseTimestamp(order?.createdAt);
  const expiresAtMs =
    parseTimestamp(order?.expiresAtMs) ?? parseTimestamp(order?.expiresAt);

  if (Number.isFinite(expiresAtMs) && Number.isFinite(createdAtMs) && expiresAtMs < createdAtMs) {
    return createdAtMs + getOrderExpirySeconds(order?.paymentMethod) * 1000;
  }

  if (Number.isFinite(expiresAtMs)) {
    return expiresAtMs;
  }

  if (Number.isFinite(createdAtMs)) {
    return createdAtMs + getOrderExpirySeconds(order?.paymentMethod) * 1000;
  }

  return null;
}

function normalizeSettingsShape(settings) {
  return {
    ...defaultSiteSettings,
    ...(settings ?? {}),
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

function shouldClearLegacyPackages(packages) {
  return (
    Array.isArray(packages) &&
    packages.length > 0 &&
    packages.every((item) =>
      LEGACY_SEED_PACKAGE_SIGNATURES.has(`${item?.id}:${item?.title}`),
    )
  );
}

function normalizePackages(packages, fallbackPackages = emptySitePackages) {
  if (!Array.isArray(packages)) {
    return fallbackPackages;
  }

  if (shouldClearLegacyPackages(packages)) {
    return [];
  }

  return packages;
}

function normalizeOrders(orders) {
  if (!Array.isArray(orders)) {
    return defaultAdminOrders;
  }

  return orders
    .filter((item) => {
      const customerName = String(item?.customerName ?? "").trim();
      const customerEmail = String(item?.customerEmail ?? "").trim().toLowerCase();

      return !(
        customerName === "Tamu TerraVoyage" ||
        customerEmail === "guest@terravoyage.id"
      );
    })
    .map((item) => {
      const expiresAt = getOrderExpiryTime(item);
      const isExpiredPending =
        item?.status === "pending" &&
        Number.isFinite(expiresAt) &&
        expiresAt + EXPIRY_TOLERANCE_MS <= Date.now();

      if (!isExpiredPending) {
        return item;
      }

      return {
        ...item,
        status: "expired",
      };
    });
}

function normalizeSiteContent(content, fallbackPackages = emptySitePackages) {
  return {
    packages: normalizePackages(content?.packages, fallbackPackages),
    settings: normalizeSettingsShape(content?.settings),
    orders: normalizeOrders(content?.orders),
    updatedAt: content?.updatedAt ?? new Date().toISOString(),
  };
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson(key, fallbackValue) {
  if (!canUseStorage()) {
    return fallbackValue;
  }

  const rawValue = window.localStorage.getItem(key);

  if (!rawValue) {
    return fallbackValue;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return fallbackValue;
  }
}

function writeJson(key, value) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function writeUpdatedAt(value) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(SITE_UPDATED_AT_KEY, value);
}

export function getSitePackages(fallbackPackages = emptySitePackages) {
  return readJson(SITE_PACKAGES_KEY, fallbackPackages);
}

export function saveSitePackages(packages) {
  writeJson(SITE_PACKAGES_KEY, packages);
}

export function getSiteSettings() {
  return readJson(SITE_SETTINGS_KEY, defaultSiteSettings);
}

export function saveSiteSettings(settings) {
  writeJson(SITE_SETTINGS_KEY, settings);
}

export function getAdminOrders() {
  return normalizeOrders(readJson(SITE_ORDERS_KEY, defaultAdminOrders));
}

export function saveAdminOrders(orders) {
  writeJson(SITE_ORDERS_KEY, orders);
}

export function getLocalSiteContent(fallbackPackages = emptySitePackages) {
  return normalizeSiteContent({
    packages: getSitePackages(fallbackPackages),
    settings: getSiteSettings(),
    orders: getAdminOrders(),
    updatedAt: readJson(SITE_UPDATED_AT_KEY, null),
  }, fallbackPackages);
}

export function saveLocalSiteContent({ packages, settings, orders, updatedAt }) {
  if (packages !== undefined) {
    saveSitePackages(packages);
  }

  if (settings !== undefined) {
    saveSiteSettings(settings);
  }

  if (orders !== undefined) {
    saveAdminOrders(orders);
  }

  if (updatedAt !== undefined) {
    writeUpdatedAt(updatedAt);
  }
}

export async function loadLiveSiteContent(fallbackPackages = emptySitePackages) {
  try {
    const response = await fetch(`${CONTENT_API_ENDPOINT}?ts=${Date.now()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const content = normalizeSiteContent({
      packages: payload.packages ?? getSitePackages(fallbackPackages),
      settings: payload.settings ?? getSiteSettings(),
      orders: payload.orders ?? getAdminOrders(),
      updatedAt: payload.updatedAt ?? new Date().toISOString(),
    }, fallbackPackages);

    saveLocalSiteContent(content);
    return content;
  } catch {
    return getLocalSiteContent(fallbackPackages);
  }
}

export async function saveLiveSiteContent(partialContent, fallbackPackages = emptySitePackages) {
  const localContent = getLocalSiteContent(fallbackPackages);
  const nextContent = normalizeSiteContent({
    packages: partialContent.packages ?? localContent.packages,
    settings: partialContent.settings ?? localContent.settings,
    orders: partialContent.orders ?? localContent.orders,
    updatedAt: new Date().toISOString(),
  }, fallbackPackages);

  saveLocalSiteContent(nextContent);

  try {
    const response = await fetch(CONTENT_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nextContent),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const savedContent = normalizeSiteContent({
      packages: payload.packages ?? nextContent.packages,
      settings: payload.settings ?? nextContent.settings,
      orders: payload.orders ?? nextContent.orders,
      updatedAt: payload.updatedAt ?? nextContent.updatedAt,
    }, fallbackPackages);

    saveLocalSiteContent(savedContent);
    return savedContent;
  } catch {
    return nextContent;
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function uploadSiteImage(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(IMAGE_UPLOAD_ENDPOINT, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    return payload.url;
  } catch {
    return fileToDataUrl(file);
  }
}

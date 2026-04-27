export default async function handler(req, res) {
  const { amount } = req.query;

  if (!amount) {
    return res.status(400).json({ error: "Amount required" });
  }

  const username = process.env.ORDERKUOTA_USERNAME;
  const token = process.env.ORDERKUOTA_TOKEN;
  const merchantId = process.env.ORDERKUOTA_MERCHANT_ID; // Opsional jika diperlukan API

  // Jika credential tidak ada, kita hanya kembalikan PENDING 
  // agar frontend tidak error dan bergantung pada flow manual
  if (!username || !token) {
    console.warn("OrderKuota credentials missing in env variables.");
    return res.status(200).json({ status: "PENDING", note: "Waiting for config" });
  }

  try {
    // Alur asli mengecek history ke API OrderKuota
    // Struktur URL ini disesuaikan dengan standar umum API mutasi merchant
    // Anda dapat menyesuaikan endpoint ini sesuai dengan API Documentation resmi OrderKuota
    const url = "https://vip.orderkuota.com/api/merchant/qris/history";
    
    // Opsi request (sesuaikan header otentikasi)
    const options = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Format auth biasa menggunakan Bearer Token, atau custom header
        "Authorization": `Bearer ${token}`
      }
    };

    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    // Asumsi data.data adalah array mutasi
    // Kita cek apakah ada mutasi sukses dengan nominal (amount) yang sama
    const transactions = Array.isArray(data.data) ? data.data : [];
    
    const isPaid = transactions.some(trx => 
      Number(trx.amount) === Number(amount) && 
      (trx.status === "Success" || trx.status === "PAID" || trx.status === "Berhasil")
    );

    if (isPaid) {
      return res.status(200).json({ status: "PAID" });
    }

    return res.status(200).json({ status: "PENDING" });
  } catch (error) {
    console.error("Failed to check QRIS mutation:", error.message);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
}

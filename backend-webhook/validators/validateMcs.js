const axios = require("axios");

async function validateMcs(
  messageText,
  senderPhone,
  userName,
  API_CHECK_MCS_URL
) {
  const regex = /^Mcs\s+(\S+)$/i;
  const match = messageText.match(regex);

  if (!match) {
    return {
      success: false,
      message: "⚠️ Format pesan tidak sesuai. Gunakan: Mcs [Artikel]",
    };
  }

  const artikel = match[1];
  const requestUrl = `${API_CHECK_MCS_URL}?artikel=${artikel}`;
  console.log(`✅ Permintaan pengecekan Mcs untuk artikel: ${artikel}`);
  console.log(`🔗 Memanggil API URL: ${requestUrl}`);

  try {
    const response = await axios.get(requestUrl);

    console.log("📥 Response API:", response.data);

    const data = response.data.data;
    let imageUrl = response.data.image_url || null;

    if (!Array.isArray(data) || data.length === 0) {
      return { success: false, message: "❌ Data MCS tidak ditemukan." };
    }

    let messages = [`📦 Hasil pengecekan untuk artikel *${artikel}*:`];

    // Cek jika ada data expired, maka jangan kirim gambar
    const hasExpired = data.some((item) => item.status === "expired");
    if (hasExpired) {
      imageUrl = null;
    }

    data.forEach((item) => {
      let statusMsg = "";

      if (item.message === "Ada") {
        statusMsg = `✅ *Tersedia* di rak ${item.no_rak}, *Model*: ${item.nama_model}, *Type*: ${item.name}`;
      } else if (item.message === "Sedang dipinjam") {
        statusMsg = `❌ *Dipinjam* oleh ${
          item.borrower_name || "?"
        }, ( *Area*: ${item.borrower_cell || "?"} *Type*: ${item.name} )`;
      } else if (item.status === "expired") {
        statusMsg = `⏳ *Expired* di rak ${item.no_rak} (❌ *Tidak bisa dipinjam*)`;
      } else {
        statusMsg = `⚠️ Status tidak dikenali di rak ${item.no_rak}`;
      }

      messages.push(`• ID ${item.id} - ${statusMsg}`);
    });

    return {
      success: true,
      message: messages.join("\n"),
      imageUrl,
    };
  } catch (error) {
    console.error("❌ Gagal mengecek Mcs:", error.message);
    return { success: false, message: "❌ MCS belum tersedia." };
  }
}

module.exports = validateMcs;

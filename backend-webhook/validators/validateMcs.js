const axios = require("axios");

async function validateMcs(messageText, senderPhone, userName, API_CHECK_MCS_URL) {
  const regex = /^Mcs\s+(\S+)$/i;
  const match = messageText.match(regex);

  if (!match) {
    return { success: false, message: "⚠️ Format pesan tidak sesuai. Gunakan: Mcs [Artikel]" };
  }

  const artikel = match[1];
  console.log(`✅ Permintaan pengecekan Mcs untuk artikel: ${artikel}`);

  try {
    const response = await axios.get(`${API_CHECK_MCS_URL}?artikel=${artikel}`);
    const { data, image_url } = response.data;

    if (!Array.isArray(data) || data.length === 0) {
      return { success: false, message: "❌ Data MCS tidak ditemukan." };
    }

    // Buat respon berdasarkan status masing-masing MCS
    let messages = [`📦 Hasil pengecekan untuk artikel *${artikel}*:`];

    data.forEach(item => {
      const statusMsg = item.message === "Ada"
        ? `✅ *Tersedia* di rak ${item.no_rak} Model: ${item.nama_model}`
        : item.message === "Sedang dipinjam"
        ? `❌ *Dipinjam* oleh ${item.borrower_name} (ID: ${item.borrower_id})`
        : `⚠️ Status tidak dikenali di rak ${item.no_rak}`;

      messages.push(`• ID ${item.id} - ${statusMsg}`);
    });

    // Balikkan respon dengan gambar dikirim terpisah sekali
    return {
      success: true,
      message: messages.join('\n'),
      imageUrl: image_url && image_url.trim() !== "" ? image_url : null
    };

  } catch (error) {
    console.error("❌ Gagal mengecek Mcs:", error.message);
    return { success: false, message: "❌ MCS belum tersedia di QIP." };
  }
}

module.exports = validateMcs;

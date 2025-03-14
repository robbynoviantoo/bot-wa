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

    if (response.data.message === "Ada") {
      return { success: true, message: `✅ MCS dengan artikel ${artikel} tersedia!` };
    } else if (response.data.message === "Sedang dipinjam") {
      return { 
        success: false, 
        message: `❌ MCS dengan artikel ${artikel} sedang dipinjam oleh ${response.data.borrower_name}.` 
      };
    } else {
      return { success: false, message: `❌ ${response.data.message}` };
    }
  } catch (error) {
    console.error("❌ Gagal mengecek Mcs:", error.message);
    return { success: false, message: "❌ Terjadi kesalahan saat mengecek Mcs." };
  }
}

module.exports = validateMcs;

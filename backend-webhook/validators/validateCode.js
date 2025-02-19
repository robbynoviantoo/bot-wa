// validators/validateCode.js
const axios = require("axios");

async function validateCode(messageText, senderPhone, userToken, userName, API_VALIDATE_URL) {
  const regex = /^V\s+(\d+)$/i;
  const match = messageText.match(regex);

  if (!match) {
    return { success: false, message: "⚠️ Format pesan tidak sesuai." };
  }

  const kode = match[1];
  console.log(`✅ Permintaan validasi untuk kode: ${kode}`);

  try {
    const response = await axios.post(
      API_VALIDATE_URL,
      { code: kode },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );

    return response.data.success
      ? { success: true, message: `✅ BCGrade ${kode} berhasil divalidasi oleh ${userName}!` }
      : { success: false, message: `❌ Gagal: ${response.data.message}` };
  } catch (error) {
    console.error("❌ Gagal validasi:", error.message);
    return { success: false, message: "❌ Terjadi kesalahan saat validasi." };
  }
}

module.exports = validateCode;

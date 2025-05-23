// validators/validateCode.js
const axios = require("axios");

async function validateEdit(messageText, senderPhone, userToken, userName, API_VALIDATE_EDIT_URL) {
  const regex = /^RE\s+(\d+)$/i;
  const match = messageText.match(regex);

  if (!match) {
    return { success: false, message: "⚠️ Format pesan tidak sesuai." };
  }

  const id = match[1];
  console.log(`✅ Permintaan validasi untuk id: ${id}`);

  try {
    const response = await axios.post(
      API_VALIDATE_EDIT_URL,
      { id: id },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );

    return response.data.success
      ? { success: true, message: `✅ BCGrade ${id} berhasil divalidasi oleh ${userName}!` }
      : { success: false, message: `❌ Gagal: ${response.data.message}` };
  } catch (error) {
    console.error("❌ Gagal validasi:", error.message);
    return { success: false, message: "❌ Terjadi kesalahan saat validasi." };
  }
}

module.exports = validateEdit;

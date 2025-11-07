const axios = require("axios");

async function validateBot(messageText, senderPhone, userName, API_AI_URL) {
  const regex = /^-bot\s+(.+)/i;
  const match = messageText.match(regex);

  if (!match) {
    return {
      success: false,
      message: "⚠️ Format tidak sesuai. Gunakan: -bot [pertanyaanmu]",
    };
  }

  const userQuery = match[1].trim();
  console.log(`🧠 Pertanyaan user: ${userQuery}`);

  try {
    // Kirim ke API Laravel yang akan teruskan ke AI
    const response = await axios.post(API_AI_URL, {
      question: userQuery,
      user: userName,
      phone: senderPhone,
    });

    console.log("📥 Response dari API AI:", response.data);

    const aiMessage = response.data.message || "⚠️ Tidak ada jawaban dari AI.";
    return { success: true, message: aiMessage };

  } catch (error) {
    console.error("❌ Gagal memproses AI:", error.message);
    return { success: false, message: "❌ Terjadi kesalahan pada AI service." };
  }
}

module.exports = validateBot;

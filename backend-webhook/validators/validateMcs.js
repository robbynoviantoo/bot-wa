const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const url = require("url");

async function sendImage(imageUrl, senderPhone, artikel) {
  try {
    const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const imageBuffer = Buffer.from(imageResponse.data, "binary");
    const parsedUrl = url.parse(imageUrl);
    const fileName = path.basename(parsedUrl.pathname);

    const form = new FormData();
    form.append("phone", senderPhone);
    form.append("caption", "📷 Gambar artikel " + artikel);
    form.append("view_once", "false");
    form.append("compress", "false");
    form.append("image", imageBuffer, fileName);

    const sendImageResponse = await axios.post(
      "http://10.20.10.106:3000/send/image",
      form,
      { headers: form.getHeaders() }
    );

    return sendImageResponse.status === 200;
  } catch (err) {
    console.error("❌ Gagal kirim gambar:", err.message);
    return false;
  }
}

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

    // Siapkan pesan status dulu
    let messages = [`📦 Hasil pengecekan untuk artikel *${artikel}*:`];
    data.forEach(item => {
      const statusMsg = item.message === "Ada"
        ? `✅ *Tersedia* di rak ${item.no_rak} Model: ${item.nama_model}`
        : item.message === "Sedang dipinjam"
        ? `❌ *Dipinjam* oleh ${item.borrower_name} (ID: ${item.borrower_id})`
        : `⚠️ Status tidak dikenali di rak ${item.no_rak}`;
      messages.push(`• ID ${item.id} - ${statusMsg}`);
    });

    // Kirim pesan teks dulu (return pesan)
    const result = {
      success: true,
      message: messages.join("\n"),
      imageUrl: image_url && image_url.trim() !== "" ? image_url : null
    };

    // Kirim gambar secara async setelah pesan teks berhasil
    if (result.imageUrl) {
      sendImage(result.imageUrl, senderPhone, artikel)
        .then(success => {
          if (success) {
            console.log("✅ Gambar berhasil dikirim.");
          } else {
            console.log("⚠️ Gagal mengirim gambar.");
          }
        })
        .catch(err => {
          console.error("❌ Error kirim gambar:", err.message);
        });
    }

    return result;

  } catch (error) {
    console.error("❌ Gagal mengecek Mcs:", error.message);
    return { success: false, message: "❌ MCS belum tersedia di QIP." };
  }
}

module.exports = validateMcs;

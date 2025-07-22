const axios = require("axios");

// URL API Pivot88
const API_PIVOT_URL = "http://10.20.10.99/qip/api/pivot88/send-etd";

/**
 * Fungsi untuk parsing tanggal dari input user
 * Mendukung format: YYYY-MM-DD dan DD-MM-YYYY
 */
function parseTanggal(input) {
  const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;
  const dmyRegex = /^\d{2}-\d{2}-\d{4}$/;

  if (ymdRegex.test(input)) return input;

  if (dmyRegex.test(input)) {
    const [day, month, year] = input.split("-");
    return `${year}-${month}-${day}`;
  }

  return null;
}

async function validatePivotSend(messageText, userToken) {
  const regex = /^Pivot\s+(\d+)\s+(\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4})$/i;
  const match = messageText.match(regex);

  if (!match) {
    return {
      success: false,
      message: "⚠️ Format salah. Gunakan: Pivot <ID> <ETD>\nContoh: `Pivot 88273 2025-07-25`",
    };
  }

  const id = match[1];
  const etdInput = match[2];
  const etd = parseTanggal(etdInput);

  if (!etd) {
    return {
      success: false,
      message: "❌ Format tanggal tidak valid. Gunakan YYYY-MM-DD atau DD-MM-YYYY.",
    };
  }

  console.log(`🚀 Mengirim data ke Pivot88: ID = ${id}, ETD = ${etd}`);
  console.log(`🔐 Token digunakan: ${userToken}`);

  try {
    const response = await axios.post(
      API_PIVOT_URL,
      { id, etd },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );

    const result = response.data;

    if (result.success) {
      return {
        success: true,
        message: `✅ Data berhasil dikirim ke Pivot88 untuk ID *${id}* dengan ETD *${etd}*.`,
      };
    } else {
      return {
        success: false,
        message: `❌ Gagal: ${result.message || "Tidak diketahui"}`,
      };
    }

  } catch (error) {
    console.error("❌ Error saat kirim ke Pivot88:", error.message);
    return {
      success: false,
      message: `❌ Gagal mengirim ke Pivot88: ${error.message}`,
    };
  }
}

module.exports = validatePivotSend;

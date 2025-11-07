const axios = require("axios");

const API_DEFECT_URL = "http://10.20.10.99/api/defect-summary";

/**
 * Fungsi untuk parsing tanggal dari input user
 * Mendukung format: YYYY-MM-DD dan DD-MM-YYYY
 */
function parseTanggal(input) {
  const ymdRegex = /^\d{4}-\d{2}-\d{2}$/; // 2025-07-16
  const dmyRegex = /^\d{2}-\d{2}-\d{4}$/; // 16-07-2025

  if (ymdRegex.test(input)) {
    return input;
  }

  if (dmyRegex.test(input)) {
    const [day, month, year] = input.split("-");
    return `${year}-${month}-${day}`;
  }

  return null;
}

async function validateDefect(messageText) {
  const regex = /^Defect\s+(\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4})$/i;
  const match = messageText.match(regex);

  if (!match) {
    return {
      success: false,
      message: "⚠️ Format salah. Gunakan: Defect YYYY-MM-DD atau DD-MM-YYYY",
    };
  }

  const inputTanggal = match[1];
  const tanggal = parseTanggal(inputTanggal);

  if (!tanggal) {
    return {
      success: false,
      message: "❌ Format tanggal tidak valid.",
    };
  }

  const requestUrl = `${API_DEFECT_URL}?tanggal=${tanggal}`;
  console.log(`✅ Permintaan Top 3 Defect B/C Grade tanggal: ${tanggal}`);
  console.log(`🔗 Memanggil API URL: ${requestUrl}`);

  try {
    const response = await axios.get(requestUrl);
    const data = response.data;

    if (!Array.isArray(data) || data.length === 0) {
      return {
        success: false,
        message: "❌ Tidak ada data untuk tanggal tersebut.",
      };
    }

    let messages = [`📊 *Top 3 Defect B/C Grade* untuk tanggal *${inputTanggal}*:`];

    for (const row of data) {
      const cell = row.cell || "Tidak diketahui";
      const topDefects = row.top_3_defects || [];

      messages.push(`\n📍 *Cell ${cell}*`);

      if (topDefects.length === 0) {
        messages.push("  Tidak ada defect.");
        continue;
      }

      topDefects.forEach((defect, idx) => {
        const issue = defect.issue || "Tanpa Issue";
        const qty = typeof defect.total_qty === "number" ? defect.total_qty.toFixed(2) : "0.00";
        messages.push(`${idx + 1}. ${issue} — ${qty} pasang`);
      });
    }

    return {
      success: true,
      message: messages.join("\n"),
    };

  } catch (error) {
    console.error("❌ Gagal mengambil data defect:", error.message);
    return {
      success: false,
      message: "❌ Gagal mengambil data defect. Silakan coba lagi.",
    };
  }
}

module.exports = validateDefect;

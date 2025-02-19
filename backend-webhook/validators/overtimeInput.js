const axios = require("axios");

async function overtimeInput(
  messageText,
  senderPhone,
  userToken,
  userName,
  API_VALIDATE_URL
) {
  const regex =
    /^OT\s+(.+),\s*Sabtu:\s*(\d),\s*([\d,\s]+),\s*(\d+(\.\d+)?)$/i;
  const match = messageText.match(regex);

  if (!match) {
    console.log("⚠️ Format pesan tidak sesuai:", messageText);
    return { success: false, message: "Format pesan tidak sesuai" };
  }

  const today = new Date().toISOString().split("T")[0]; // Ambil tanggal hari ini (YYYY-MM-DD)
  const [_, area, isSaturday, nikList, duration] = match;
  const nikArray = nikList.split(",").map((n) => n.trim());

  console.log(
    `✅ Data parsed: Date=${today}, Area=${area}, Sabtu=${isSaturday}, NIKs=${nikArray}, Duration=${duration}`
  );

  // Kirim ke API Laravel
  try {
    const response = await axios.post(
      API_VALIDATE_URL,
      {
        date: today, // Gunakan tanggal hari ini
        area,
        is_saturday: Boolean(Number(isSaturday)), // Convert "1" ke true, "0" ke false
        employees: nikArray.map((nik) => ({
          nik_last4: nik,
          duration: parseFloat(duration),
        })),
        wa_sender: senderPhone,
      },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );

    console.log("📩 Respon dari API:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Gagal mengirim data ke API:", error.response?.data || error.message);
    return { success: false, message: "Gagal mengirim data ke API", error: error.message };
  }
}

module.exports = overtimeInput;

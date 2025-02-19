const { validateCode, overtimeInput } = require("./validators");

const messageHandlers = [
  {
    regex: /^V\s+(\d+)$/i,
    apiUrl: process.env.API_VALIDATE_URL, // 
    handler: async (messageText, senderPhone, userToken, userName, apiUrl) => {
      return await validateCode(messageText, senderPhone, userToken, userName, apiUrl);
    },
  },
  {
    regex: /^OT\s+(.+),\s*Sabtu:\s*(\d),\s*([\d,\s]+),\s*(\d+(\.\d+)?)$/i,
    apiUrl: process.env.API_VALIDATE_URL_OT, // 
    handler: async (messageText, senderPhone, userToken, userName, apiUrl) => {
      return await overtimeInput(messageText, senderPhone, userToken, userName, apiUrl);
    },
  },
  {
    regex: /^INFO$/i,
    apiUrl: null, 
    handler: async (messageText, senderPhone) => {
      return { success: true, message: `📌 Halo ${senderPhone}, ini adalah pesan info.` };
    },
  },
  {
    regex: /^HELP$/i,
    apiUrl: null,
    handler: async () => {
      return {
        success: true,
        message:
          "📜 Format pesan yang tersedia:\n" +
          "✅ `V <kode>` - Validasi kode\n" +
          "🕒 `OT {Area}, Sabtu:{0/1}, {NIK}, {Waktu}` - Input lembur\n" +
          "ℹ️ `INFO` - Dapatkan informasi\n" +
          "❓ `HELP` - Lihat daftar perintah",
      };
    },
  },
];

module.exports = messageHandlers;

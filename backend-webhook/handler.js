const { validateCode, overtimeInput, validateMcs, validateEdit } = require("./validators");

const messageHandlers = [
  {
    regex: /^V\s+(\d+)$/i,
    apiUrl: process.env.API_VALIDATE_URL,
    requiresToken: true, // ✅ Butuh token
    handler: async (messageText, senderPhone, userToken, userName, apiUrl) => {
      return await validateCode(messageText, senderPhone, userToken, userName, apiUrl);
    },
  },
  {
    regex: /^RE\s+(\d+)$/i,
    apiUrl: process.env.API_VALIDATE_EDIT_URL,
    requiresToken: true, // ✅ Butuh token
    handler: async (messageText, senderPhone, userToken, userName, apiUrl) => {
      return await validateEdit(messageText, senderPhone, userToken, userName, apiUrl);
    },
  },
  {
    regex: /^OT\s+(.+),\s*Sabtu:\s*(\d),\s*([\d,\s]+),\s*(\d+(\.\d+)?)$/i,
    apiUrl: process.env.API_VALIDATE_URL_OT,
    requiresToken: true, // ✅ Butuh token
    handler: async (messageText, senderPhone, userToken, userName, apiUrl) => {
      return await overtimeInput(messageText, senderPhone, userToken, userName, apiUrl);
    },
  },
  {
    regex: /^Mcs\s+(\S+)$/i,
    apiUrl: process.env.API_CHECK_MCS_URL,
    requiresToken: false, // ❌ Tidak butuh token
    handler: async (messageText, senderPhone, _, userName, apiUrl) => {
      return await validateMcs(messageText, senderPhone, userName, apiUrl);
    },
  },
  {
    regex: /^INFO$/i,
    apiUrl: null,
    requiresToken: false, // ❌ Tidak butuh token
    handler: async (messageText, senderPhone) => {
      return { success: true, message: `📌 Halo ${senderPhone}, ini adalah pesan info.` };
    },
  },
  {
    regex: /^HELP$/i,
    apiUrl: null,
    requiresToken: false, // ❌ Tidak butuh token
    handler: async () => {
      return {
        success: true,
        message:
          "📛 Format pesan yang tersedia:\n" +
          "✅ `V <kode>` - Validasi kode\n" +
          "✅ `MCS <artikel>` - Check Ketersediaan MCS\n" +
          "🕒 `OT {Area}, Sabtu:{0/1}, {NIK}, {Waktu}` - Input lembur\n" +
          "📦 `Mcs <Artikel>` - Cek status Mcs\n" +
          "ℹ️ `INFO` - Dapatkan informasi\n" +
          "❓ `HELP` - Lihat daftar perintah",
      };
    },
  },
];

module.exports = messageHandlers;
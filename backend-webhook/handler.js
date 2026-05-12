const {
  validateCode,
  overtimeInput,
  validateMcs,
  validateEdit,
  validateDefect,
  validatePivotSend,
  validateSwatchbook
} = require("./validators");

const messageHandlers = [
  {
    regex: /^V\s+(\d+)$/i,
    apiUrl: process.env.API_VALIDATE_URL,
    requiresToken: true,
    handler: async (messageText, senderPhone, userToken, userName, apiUrl) => {
      return await validateCode(
        messageText,
        senderPhone,
        userToken,
        userName,
        apiUrl
      );
    },
  },
  {
    regex: /^RE\s+(\d+)$/i,
    apiUrl: process.env.API_VALIDATE_EDIT_URL,
    requiresToken: true,
    handler: async (messageText, senderPhone, userToken, userName, apiUrl) => {
      return await validateEdit(
        messageText,
        senderPhone,
        userToken,
        userName,
        apiUrl
      );
    },
  },
  {
    regex: /^OT\s+(.+),\s*Sabtu:\s*(\d),\s*([\d,\s]+),\s*(\d+(\.\d+)?)$/i,
    apiUrl: process.env.API_VALIDATE_URL_OT,
    requiresToken: true,
    handler: async (messageText, senderPhone, userToken, userName, apiUrl) => {
      return await overtimeInput(
        messageText,
        senderPhone,
        userToken,
        userName,
        apiUrl
      );
    },
  },
  {
    regex: /^Mcs\s+(\S+)$/i,
    apiUrl: process.env.API_CHECK_MCS_URL,
    requiresToken: false,
    handler: async (messageText, senderPhone, _, userName, apiUrl) => {
      return await validateMcs(messageText, senderPhone, userName, apiUrl);
    },
  },
  {
    regex: /^SB\s+(\S+)$/i,
    apiUrl: process.env.API_CHECK_SWATCHBOOK_URL,
    requiresToken: false,
    handler: async (messageText, senderPhone, _, userName, apiUrl) => {
      return await validateSwatchbook(messageText, senderPhone, userName, apiUrl);
    },
  },
  {
    regex: /^Defect\s+(\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4})$/i,
    apiUrl: process.env.API_DEFECT_URL,
    requiresToken: false,
    handler: async (messageText, senderPhone, _, __, apiUrl) => {
      return await validateDefect(messageText, apiUrl);
    },
  },
  {
    regex: /^INFO$/i,
    apiUrl: null,
    requiresToken: false,
    handler: async (messageText, senderPhone) => {
      return {
        success: true,
        message: `📌 Halo ${senderPhone}, ini adalah pesan info.`,
      };
    },
  },
  {
    regex: /^Pivot\s+(\d+)\s+(\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4})$/i,
    requiresToken: true,
    handler: async (messageText, senderPhone, userToken, userName, apiUrl) => {
      return await validatePivotSend(messageText, userToken);
    },
  },
  {
    regex: /^HELP$/i,
    apiUrl: null,
    requiresToken: false,
    handler: async () => {
      return {
        success: true,
        message:
          "📛 Format pesan yang tersedia:\n" +
          "✅ `V <kode>` - Validasi kode\n" +
          "✅ `RE <kode>` - Edit kode\n" +
          "📦 `Mcs <artikel>` - Cek status MCS\n" +
          "📦 `SB <artikel>` - Cek status Swatchbook\n" +
          "🖼️ `sticker` sebagai caption gambar - Buat stiker dari gambar\n" +
          "🎞️ `stickergif` sebagai caption video - Buat stiker bergerak dari video\n" +
          "🕒 `OT {Area}, Sabtu:{0/1}, {NIK}, {Waktu}` - Input lembur\n" +
          "📊 `Defect <tanggal>` - Cek top 3 defect harian (format: YYYY-MM-DD / DD-MM-YYYY)\n" +
          "ℹ️ `INFO` - Dapatkan informasi\n" +
          "❓ `HELP` - Lihat daftar perintah",
      };
    },
  },
];

module.exports = messageHandlers;

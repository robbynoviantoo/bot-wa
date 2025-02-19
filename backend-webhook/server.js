require("dotenv").config();
const express = require("express");
const cors = require("cors"); // ✅ Tambahkan CORS
const bodyParser = require("body-parser");
const axios = require("axios");
const messageHandlers = require("./handler"); // ✅ Import daftar handler
const mongoose = require("mongoose");
const UserToken = require("./models/UserToken");

const app = express();

// ✅ Middleware CORS
app.use(cors({ origin: "*" })); // Izinkan semua origin (bisa diganti dengan domain tertentu)
app.use(bodyParser.json());

const API_VALIDATE_URL = process.env.API_VALIDATE_URL;
const API_VALIDATE_URL_OT = process.env.API_VALIDATE_URL_OT;
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const BASIC_AUTH_USERS = process.env.APP_BASIC_AUTH.split(",");
const USER_TOKENS = JSON.parse(process.env.USER_TOKENS || "{}");

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  let encodedCreds;
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    encodedCreds = Buffer.from(process.env.APP_BASIC_AUTH).toString("base64");
  } else {
    encodedCreds = authHeader.split(" ")[1];
  }

  const decodedCreds = Buffer.from(encodedCreds, "base64").toString("utf-8");

  if (!BASIC_AUTH_USERS.includes(decodedCreds)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  next();
}

app.post("/webhook", authenticate, async (req, res) => {
  console.log("📩 Pesan diterima dari WhatsApp:", JSON.stringify(req.body, null, 2));

  const senderRaw = req.body?.from || "";
  const messageText = req.body?.message?.text?.trim() || "";

  if (!messageText) {
    console.log("⚠️ Tidak ada teks pesan, abaikan.");
    return res.status(200).json({ success: true });
  }

  let senderPhone, groupId;
  if (senderRaw.includes(" in ")) {
    [senderPhone, groupId] = senderRaw.split(" in ");
  } else {
    senderPhone = senderRaw;
    groupId = null;
  }

  const senderParts = senderPhone.split(":");
  senderPhone = senderParts[0].includes("@s.whatsapp.net")
    ? senderParts[0]
    : senderParts[0] + "@s.whatsapp.net";

  console.log(`👤 Pengirim: ${senderPhone}, 📢 Grup: ${groupId || "Bukan Grup"}`);

  const UserToken = require("./models/UserToken");

  const userData = await UserToken.findOne({ phone: senderPhone });

  if (!userData) {
    console.log("❌ Nomor pengirim tidak memiliki token yang valid.");
    return res.status(200).json({ success: true });
  }

  const userToken = userData.token;
  const userName = userData.name || senderPhone;
  console.log(`🔹 Menggunakan token milik ${userName} untuk validasi...`);

  let validationResult = { success: false, message: "⚠️ Format tidak dikenali." };

  // 🔍 **Gunakan mapping untuk mencari handler yang cocok**
  for (const { regex, handler, apiUrl } of messageHandlers) {
    if (regex.test(messageText)) {
      console.log("✅ Format terdeteksi, menjalankan handler...");
      validationResult = await handler(messageText, senderPhone, userToken, userName, apiUrl);
      break;
    }
  }

  console.log("📤 Balasan:", validationResult.message);

  // 🚀 **Mengirim balasan ke WhatsApp**
  const recipient = groupId || senderPhone;
  const basicAuthHeader = `Basic ${Buffer.from(process.env.APP_BASIC_AUTH).toString("base64")}`;

  try {
    await axios.post(
      WHATSAPP_API_URL,
      {
        phone: recipient,
        message: validationResult.message,
        reply_message_id: req.body?.message?.id || "",
      },
      { headers: { Authorization: basicAuthHeader } }
    );
    console.log("✅ Balasan berhasil dikirim ke:", recipient);
  } catch (error) {
    console.error("❌ Gagal mengirim balasan:", error.response?.data || error.message);
  }

  res.status(200).json({ success: true });
});

app.post("/add-user-token", async (req, res) => {
  const { phone, token, name } = req.body;

  if (!phone || !token || !name) {
    return res.status(400).json({ success: false, message: "Data tidak lengkap" });
  }

  try {
    await UserToken.findOneAndUpdate(
      { phone },
      { token, name },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: "User token berhasil disimpan" });
  } catch (error) {
    console.error("❌ Error menyimpan token:", error);
    res.status(500).json({ success: false, message: "Gagal menyimpan token" });
  }
});
app.post("/api/tokens", async (req, res) => {
  try {
    const { phone, token, name } = req.body;
    
    const existingUser = await UserToken.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "Token already exists for this user" });
    }

    const newUserToken = new UserToken({ phone, token, name });
    await newUserToken.save();

    res.status(201).json({ message: "Token saved successfully", data: newUserToken });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await UserToken.find({}, "name phone token");
    res.status(200).json(users);
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil data user" });
  }
});


app.listen(3001, () => {
  console.log("🚀 Webhook berjalan di http://localhost:3001/webhook");
});

mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

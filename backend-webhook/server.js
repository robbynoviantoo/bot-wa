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

  let userToken = null;
  let userName = senderPhone;

  const UserToken = require("./models/UserToken");
  const userData = await UserToken.findOne({ phone: senderPhone });

  if (userData) {
    userToken = userData.token;
    userName = userData.name || senderPhone;
    console.log(`🔹 Menggunakan token milik ${userName}...`);
  } else {
    console.log("⚠️ Pengirim tidak memiliki token yang valid.");
  }

  let validationResult = null;

  for (const { regex, handler, apiUrl, requiresToken } of messageHandlers) {
    if (regex.test(messageText)) {
      console.log("✅ Format terdeteksi, menjalankan handler...");

      if (requiresToken && !userToken) {
        console.log("❌ Token diperlukan, tetapi tidak ditemukan.");
        validationResult = { success: false, message: "❌ Anda tidak memiliki izin untuk menggunakan perintah ini." };
      } else {
        validationResult = requiresToken
          ? await handler(messageText, senderPhone, userToken, userName, apiUrl)
          : await handler(messageText, senderPhone, null, userName, apiUrl);
      }
      break;
    }
  }

  if (!validationResult) {
    console.log("⚠️ Tidak ada format yang cocok, abaikan pesan.");
    return res.status(200).json({ success: true });
  }

  console.log("📤 Balasan:", validationResult.message);

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
    return res
      .status(400)
      .json({ success: false, message: "Data tidak lengkap" });
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
      return res
        .status(400)
        .json({ message: "Token already exists for this user" });
    }

    const newUserToken = new UserToken({ phone, token, name });
    await newUserToken.save();

    res
      .status(201)
      .json({ message: "Token saved successfully", data: newUserToken });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
});
app.get("/api/users", async (req, res) => {
  try {
    const users = await UserToken.find({}, "name phone token").lean(); // Gunakan .lean() untuk mengembalikan objek biasa
    const formattedUsers = users.map((user) => ({
      ...user,
      id: user._id.toString(), // Ubah _id ke string
    }));

    res.status(200).json(formattedUsers);
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data user" });
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserToken.findById(id, "name phone token");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id.toString(), // Pastikan id dikembalikan sebagai string
        name: user.name,
        phone: user.phone,
        token: user.token,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching user by ID:", error);
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data user" });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, token, name } = req.body;

    if (!phone || !token || !name) {
      return res
        .status(400)
        .json({ success: false, message: "Data tidak lengkap" });
    }

    const updatedUser = await UserToken.findByIdAndUpdate(
      id,
      { phone, token, name },
      { new: true } // Supaya mengembalikan data terbaru setelah update
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    res.status(200).json({
      success: true,
      message: "User berhasil diperbarui",
      data: {
        id: updatedUser._id.toString(), // Konversi ke string
        name: updatedUser.name,
        phone: updatedUser.phone,
        token: updatedUser.token,
      },
    });
  } catch (error) {
    console.error("❌ Error updating user:", error);
    res.status(500).json({ success: false, message: "Gagal memperbarui user" });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah user ada
    const user = await UserToken.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    // Hapus user
    await UserToken.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "User berhasil dihapus" });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    res.status(500).json({ success: false, message: "Gagal menghapus user" });
  }
});

app.listen(3001, () => {
  console.log("🚀 Webhook berjalan di http://localhost:3001/webhook");
});

mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

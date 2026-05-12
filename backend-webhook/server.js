require("dotenv").config();
const express = require("express");
const cors = require("cors"); // ✅ Tambahkan CORS
const bodyParser = require("body-parser");
const axios = require("axios");
const messageHandlers = require("./handler"); // ✅ Import daftar handler
const mongoose = require("mongoose");
const UserToken = require("./models/UserToken");
const FormData = require("form-data");

const app = express();

const processedMessages = new Set();

// ✅ Middleware CORS
app.use(cors({ origin: "*" })); // Izinkan semua origin (bisa diganti dengan domain tertentu)
app.use(bodyParser.json());

const API_VALIDATE_URL = process.env.API_VALIDATE_URL;
const API_VALIDATE_URL_OT = process.env.API_VALIDATE_URL_OT;
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const BASIC_AUTH_USERS = process.env.APP_BASIC_AUTH.split(",");
const USER_TOKENS = JSON.parse(process.env.USER_TOKENS || "{}");
const DEVICE_ID = process.env.WHATSAPP_DEVICE_ID || "asolole";
const WHATSAPP_API_BASE =
  process.env.WHATSAPP_API_BASE ||
  new URL(WHATSAPP_API_URL || "http://10.20.10.106:3000/send/message").origin;

const userCooldown = new Map();
const COOLDOWN_MS = 10 * 1000; // 10 detik

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

async function sendImage(imageUrl, recipientPhone, caption, deviceId = DEVICE_ID) {
  try {
    console.log(`🔍 Mulai download gambar dari URL: ${imageUrl}`);

    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });

    console.log(
      `✅ Gambar berhasil didownload, ukuran: ${imageResponse.data.length} bytes`
    );

    const imageBuffer = Buffer.from(imageResponse.data);
    const fileName = imageUrl.split("/").pop() || "image.jpg";

    const form = new FormData();
    form.append("phone", recipientPhone);
    form.append("caption", caption);
    form.append("view_once", "false");
    form.append("compress", "false");
    form.append("image", imageBuffer, fileName);

    const basicAuthHeader = `Basic ${Buffer.from(
      process.env.APP_BASIC_AUTH
    ).toString("base64")}`;

    console.log(
      `📤 Mengirim gambar ke: ${recipientPhone} dengan nama file: ${fileName}`
    );

    const response = await axios.post(
      `${getWhatsappApiOrigin()}/send/image`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: basicAuthHeader,
          "X-Device-Id": deviceId,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    console.log(
      `✅ Response dari server kirim gambar: status ${response.status}`,
      response.data
    );

    return response.status === 200;
  } catch (err) {
    if (err.response) {
      console.error(
        "❌ Gagal kirim gambar - Response error:",
        err.response.status,
        err.response.data
      );
    } else {
      console.error("❌ Gagal kirim gambar:", err.message);
    }
    return false;
  }
}

function getWhatsappApiOrigin() {
  const fallbackUrl = "http://10.20.10.106:3000/send/message";
  return new URL(process.env.WHATSAPP_API_URL || fallbackUrl).origin;
}

function getStickerApiUrl() {
  return `${getWhatsappApiOrigin()}/send/sticker`;
}

function getVideoApiUrl() {
  return `${getWhatsappApiOrigin()}/send/video`;
}

function isValidDeviceId(value) {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();

  if (!trimmed) return false;
  if (trimmed.includes("@")) return false;
  if (/^\d+$/.test(trimmed)) return false;

  return true;
}

function getWebhookDeviceId(body) {
  const candidates = [
    body?.device_id,
    body?.payload?.device_id,
    body?.device?.id,
    DEVICE_ID,
  ];

  const deviceId = candidates.find(isValidDeviceId);
  if (!deviceId) {
    console.warn("X-Device-Id tidak valid. Isi WHATSAPP_DEVICE_ID di .env dengan device id dari WhatsApp API.");
  }

  return deviceId || DEVICE_ID;
}

function getIncomingMedia(body, isVideo) {
  return (
    (isVideo ? body?.video : body?.image) ||
    (isVideo ? body?.payload?.video : body?.payload?.image) ||
    (isVideo ? body?.video_url : body?.image_url) ||
    (isVideo ? body?.payload?.video_url : body?.payload?.image_url) ||
    body?.payload?.media_path ||
    body?.media_path ||
    body?.payload?.media_url ||
    body?.media_url ||
    body?.payload?.url ||
    body?.url ||
    body?.payload?.media ||
    body?.media ||
    null
  );
}

function getMediaStaticUrl(media) {
  const mediaPath =
    typeof media === "string"
      ? media
      : media?.media_path ||
        media?.path ||
        media?.file_path ||
        media?.local_path ||
        media?.url ||
        media?.media_url ||
        media?.image_url ||
        media?.video_url ||
        media?.download_url;

  if (!mediaPath) return null;
  if (/^https?:\/\//i.test(mediaPath)) return mediaPath;

  let normalizedPath = String(mediaPath).replace(/\\/g, "/").replace(/^\/+/, "");
  const staticsIndex = normalizedPath.indexOf("statics/");
  if (staticsIndex >= 0) {
    normalizedPath = normalizedPath.slice(staticsIndex);
  }

  const staticPath = normalizedPath.startsWith("statics/")
    ? normalizedPath
    : `statics/${normalizedPath}`;

  return `${getWhatsappApiOrigin()}/${staticPath}`;
}

function getIncomingCommand(body) {
  return (
    body?.payload?.body?.trim() ||
    body?.payload?.caption?.trim() ||
    body?.message?.text?.trim() ||
    body?.image?.caption?.trim() ||
    body?.payload?.image?.caption?.trim() ||
    body?.video?.caption?.trim() ||
    body?.payload?.video?.caption?.trim() ||
    ""
  );
}

async function sendStickerFromImage(mediaUrl, recipientPhone, deviceId = DEVICE_ID) {
  const basicAuthHeader = `Basic ${Buffer.from(
    process.env.APP_BASIC_AUTH
  ).toString("base64")}`;
  const form = new FormData();
  form.append("phone", recipientPhone);
  form.append("sticker_url", mediaUrl);
  form.append("is_forwarded", "false");

  const response = await axios.post(
    getStickerApiUrl(),
    form,
    {
      headers: {
        ...form.getHeaders(),
        Authorization: basicAuthHeader,
        "X-Device-Id": deviceId,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    }
  );

  return response.status === 200;
}

async function sendGifPlaybackFromVideo(mediaUrl, recipientPhone, deviceId = DEVICE_ID) {
  const basicAuthHeader = `Basic ${Buffer.from(
    process.env.APP_BASIC_AUTH
  ).toString("base64")}`;
  const form = new FormData();
  form.append("phone", recipientPhone);
  form.append("video_url", mediaUrl);
  form.append("gif_playback", "true");
  form.append("compress", "false");
  form.append("view_once", "false");
  form.append("is_forwarded", "false");

  const response = await axios.post(
    getVideoApiUrl(),
    form,
    {
      headers: {
        ...form.getHeaders(),
        Authorization: basicAuthHeader,
        "X-Device-Id": deviceId,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    }
  );

  return response.status === 200;
}


app.post("/webhook", authenticate, async (req, res) => {


  let deviceId = getWebhookDeviceId(req.body)
  const senderRaw =
    req.body?.from ||
    req.body?.payload?.from ||
    req.body?.payload?.chat_id ||
    "";

  let messageText = getIncomingCommand(req.body);

  if (!messageText) {
    console.log("⚠️ Tidak ada teks pesan, abaikan.");
    return res.status(200).json({ success: true });
  }
  // 1️⃣ HANYA PROSES EVENT MESSAGE
  if (req.body?.event && req.body.event !== "message") {
    return res.status(200).json({ success: true });
  }

  const payload = req.body.payload || {};

  console.log("📩 Pesan diterima dari WhatsApp:", JSON.stringify(req.body, null, 2));

  // 2️⃣ VALIDASI PAYLOAD
  if (!senderRaw) {
    return res.status(200).json({ success: true });
  }

  // 3️⃣ CEGAH DUPLIKASI MESSAGE ID
  if (payload.id && processedMessages.has(payload.id)) {
    console.log("🔁 Pesan duplikat diabaikan:", payload.id);
    return res.status(200).json({ success: true });
  }
  if (payload.id) {
    processedMessages.add(payload.id);
    setTimeout(() => processedMessages.delete(payload.id), 5 * 60 * 1000);
  }

  deviceId = getWebhookDeviceId(req.body);

  // 4️⃣ CEGAH PESAN DARI BOT SENDIRI
  if (
    payload.from === req.body.device_id ||
    payload.from === deviceId
  ) {
    return res.status(200).json({ success: true });
  }

  let senderPhone = payload.from || senderRaw;
  let chatId = payload.chat_id || senderPhone;
  if (senderPhone.includes(" in ")) {
    const senderParts = senderPhone.split(" in ");
    senderPhone = senderParts[0];
    chatId = senderParts[1] || chatId;
  }
  const isGroup = chatId.endsWith("@g.us");
  const groupId = isGroup ? chatId : null;

  senderPhone = senderPhone.split(":")[0];
  if (!senderPhone.includes("@")) {
    senderPhone += "@s.whatsapp.net";
  }

  console.log(`👤 Pengirim: ${senderPhone}, 📢 Chat: ${isGroup ? "Grup" : "Pribadi"}`);

  // 5️⃣ AMBIL TEXT HANYA DARI payload.body
  messageText = getIncomingCommand(req.body);

  if (!messageText) {
    return res.status(200).json({ success: true });
  }

  // ⏳ CEK COOLDOWN PER USER
  const now = Date.now();
  const cooldownUntil = userCooldown.get(senderPhone) || 0;

  if (now < cooldownUntil) {
    console.log(`⏳ Cooldown aktif untuk ${senderPhone}`);
    return res.status(200).json({ success: true });
  }

  // set cooldown 10 detik
  userCooldown.set(senderPhone, now + COOLDOWN_MS);

  let recipient = groupId || senderPhone;
  const normalizedCommand = messageText.toLowerCase();

  if (normalizedCommand === "sticker" || normalizedCommand === "stickergif") {
    const isAnimated = normalizedCommand === "stickergif";
    const media = getIncomingMedia(req.body, isAnimated);
    const mediaUrl = getMediaStaticUrl(media);
    const basicAuthHeader = `Basic ${Buffer.from(process.env.APP_BASIC_AUTH).toString("base64")}`;

    if (!mediaUrl) {
      console.warn(
        "Media untuk sticker tidak ditemukan. Keys webhook:",
        Object.keys(req.body || {}),
        "payload keys:",
        Object.keys(req.body?.payload || {})
      );

      const message = isAnimated
        ? "Kirim video dengan caption `stickergif` untuk membuat stiker bergerak."
        : "Kirim gambar dengan caption `sticker` untuk membuat stiker.";

      try {
        await axios.post(
          WHATSAPP_API_URL,
          {
            phone: recipient,
            message,
            reply_message_id:
              req.body?.payload?.id ||
              req.body?.message?.id ||
              "",
          },
          {
            headers: {
              Authorization: basicAuthHeader,
              "X-Device-Id": deviceId,
            },
          }
        );
      } catch (error) {
        console.error("Gagal mengirim instruksi sticker:", error.response?.data || error.message);
      }

      return res.status(200).json({ success: true });
    }

    try {
      if (isAnimated) {
        await sendGifPlaybackFromVideo(mediaUrl, recipient, deviceId);
      } else {
        await sendStickerFromImage(mediaUrl, recipient, deviceId);
      }
      console.log("Sticker/GIF berhasil dikirim ke:", recipient);
    } catch (error) {
      console.error("Gagal membuat sticker/GIF:", error.response?.data || error.message);
    }

    return res.status(200).json({ success: true });
  }

  let userToken = null;
  let userName = senderPhone;

  const UserToken = require("./models/UserToken");
  const userData = await UserToken.findOne({ phone: senderPhone });

  if (userData) {
    userToken = userData.token;
    userName = userData.name || senderPhone;
  }

  let validationResult = null;

  for (const { regex, handler, apiUrl, requiresToken } of messageHandlers) {
    if (regex.test(messageText)) {
      validationResult = requiresToken && !userToken
        ? { success: false, message: "❌ Anda tidak memiliki izin." }
        : await handler(messageText, senderPhone, userToken, userName, apiUrl);
      break;
    }
  }

  if (!validationResult) {
    return res.status(200).json({ success: true });
  }

  const basicAuthHeader = `Basic ${Buffer.from(process.env.APP_BASIC_AUTH).toString("base64")}`;
  recipient = groupId || senderPhone;
  const headers = {
    Authorization: `Basic ${Buffer.from(process.env.APP_BASIC_AUTH).toString("base64")}`,
    "X-Device-Id": deviceId,
  };

  try {
    // READ
    await markAsRead(payload.id, senderPhone, headers);
    await sleep(random(300, 800));

    // TYPING
    await setTyping(recipient, "start", headers);
    await sleep(3000);
    await setTyping(recipient, "stop", headers);
    await sleep(random(500, 1500));

    // SEND MESSAGE
    await axios.post(
      WHATSAPP_API_URL,
      {
        phone: recipient,
        message: validationResult.message,
        reply_message_id: payload.id,
      },
      { headers }
    );

    // IMAGE
    if (validationResult.imageUrl) {
      await sleep(3000);
      await sendImage(
        validationResult.imageUrl,
        recipient,
        `📷 Gambar artikel untuk permintaan ${messageText}`,
        deviceId
      );
    }

  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
  }

  res.status(200).json({ success: true });
});


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function markAsRead(messageId, phone, headers) {
  if (!messageId) return;

  try {
    await axios.post(
      `${WHATSAPP_API_BASE}/message/${messageId}/read`,
      { phone },
      { headers }
    );
    console.log("👀 Pesan ditandai sudah dibaca");
  } catch (err) {
    console.log("⚠️ Gagal read message:", err.response?.data || err.message);
  }
}

async function setTyping(phone, action, headers) {
  try {
    await axios.post(
      `${WHATSAPP_API_BASE}/send/chat-presence`,
      { phone, action },
      { headers }
    );
    console.log(`⌨️ Typing ${action}`);
  } catch (err) {
    console.log("⚠️ Gagal typing indicator:", err.response?.data || err.message);
  }
}

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

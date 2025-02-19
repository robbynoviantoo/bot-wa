const mongoose = require("mongoose");

const UserTokenSchema = new mongoose.Schema({
  phone: { type: String, unique: true, required: true },
  token: { type: String, required: true },
  name: { type: String, required: true },
});

module.exports = mongoose.model("UserToken", UserTokenSchema);

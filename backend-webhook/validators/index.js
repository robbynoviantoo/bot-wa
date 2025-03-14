// validators/index.js
const validateCode = require("./validateCode");
const validateMcs = require("./validateMcs");
const overtimeInput = require("./overtimeInput");

module.exports = {
  validateCode,
  overtimeInput,
  validateMcs,
};
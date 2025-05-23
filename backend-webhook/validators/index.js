// validators/index.js
const validateCode = require("./validateCode");
const validateMcs = require("./validateMcs");
const overtimeInput = require("./overtimeInput");
const validateEdit = require("./validateEdit");

module.exports = {
  validateCode,
  overtimeInput,
  validateMcs,
  validateEdit,
};
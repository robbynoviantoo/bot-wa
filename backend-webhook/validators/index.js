// validators/index.js
const validateCode = require("./validateCode");
const validateMcs = require("./validateMcs");
const overtimeInput = require("./overtimeInput");
const validateEdit = require("./validateEdit");
const validateDefect = require("./validateDefect");
const validatePivotSend = require("./validatePivotSend");
const validateSwatchbook = require("./validateSwatchbook");

module.exports = {
  validateCode,
  overtimeInput,
  validateMcs,
  validateSwatchbook,
  validateEdit,
  validateDefect,
  validatePivotSend
};
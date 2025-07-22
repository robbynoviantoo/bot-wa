// validators/index.js
const validateCode = require("./validateCode");
const validateMcs = require("./validateMcs");
const overtimeInput = require("./overtimeInput");
const validateEdit = require("./validateEdit");
const validateDefect = require("./validateDefect");
const validatePivotSend = require("./validatePivotSend");

module.exports = {
  validateCode,
  overtimeInput,
  validateMcs,
  validateEdit,
  validateDefect,
  validatePivotSend
};
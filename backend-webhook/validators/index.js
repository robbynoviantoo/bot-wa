// validators/index.js
const validateCode = require("./validateCode");
const validateMcs = require("./validateMcs");
const overtimeInput = require("./overtimeInput");
const validateEdit = require("./validateEdit");
const validateDefect = require("./validateDefect");

module.exports = {
  validateCode,
  overtimeInput,
  validateMcs,
  validateEdit,
  validateDefect,
};
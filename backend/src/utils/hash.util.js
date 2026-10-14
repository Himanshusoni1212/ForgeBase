const bcrypt = require('bcrypt');
const crypto = require('crypto');
const CONSTANTS = require('../config/constants');

async function hash(plaintext) {
  return bcrypt.hash(plaintext, CONSTANTS.BCRYPT_ROUNDS);
}

async function compare(plaintext, hashedValue) {
  return bcrypt.compare(plaintext, hashedValue);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

module.exports = { hash, compare, sha256 };

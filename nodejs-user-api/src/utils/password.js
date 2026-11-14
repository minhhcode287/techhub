const bcrypt = require("bcryptjs");

const hashPassword = async (password) => {
  if (!password) return "";
  return bcrypt.hash(password, 10);
};

const comparePassword = async (password, hashedPassword) => {
  if (!password || !hashedPassword) return false;
  return bcrypt.compare(password, hashedPassword);
};

module.exports = {
  hashPassword,
  comparePassword,
};

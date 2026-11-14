/**
 * Input sanitization middleware to protect against XSS and NoSQL/Mongo Injection
 */

function sanitizeString(str) {
  if (typeof str !== "string") return str;
  // Remove dangerous HTML/script tags and JS event patterns
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/vbscript\s*:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}

function sanitizeObject(obj) {
  if (obj === null || typeof obj !== "object") {
    return typeof obj === "string" ? sanitizeString(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    // Strip MongoDB operator keys like $gt, $where, $ne to protect against NoSQL injection
    if (key.startsWith("$") || key.includes(".")) {
      continue;
    }
    clean[key] = sanitizeObject(value);
  }
  return clean;
}

const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

module.exports = sanitizeInput;

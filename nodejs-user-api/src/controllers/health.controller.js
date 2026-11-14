const { getDBStatus } = require("../config/database");

const healthCheck = (req, res) => {
  const db = getDBStatus();
  res.status(200).json({
    status: "ok",
    service: "TechHub Node.js API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    database: {
      provider: "MongoDB",
      status: db.connected ? "connected" : "in-memory-fallback",
      host: db.host,
    },
    uptime: process.uptime(),
  });
};

module.exports = {
  healthCheck,
};

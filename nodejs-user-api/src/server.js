require("dotenv").config();

const app = require("./app");
const { connectDatabase } = require("./config/database");
const productService = require("./services/product.service");
const rentalService = require("./services/rental.service");
const voucherService = require("./services/voucher.service");
const env = require("./config/env");

const startServer = async () => {
  try {
    const isConnected = await connectDatabase();
    if (isConnected) {
      const { seedUsersIfEmpty } = require("./services/seed.service");
      await seedUsersIfEmpty();
      await productService.seedIfEmpty();
      await rentalService.seedIfEmpty();
      await voucherService.seedIfEmpty();
    }
  } catch (err) {
    console.warn("[Server] DB connection notice:", err.message);
  }

  const server = app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`===============================================`);
    console.log(`🚀 REST API Service running in [${env.NODE_ENV}] mode`);
    console.log(`📡 Listening at: http://0.0.0.0:${env.PORT}`);
    console.log(`📄 Health Check: http://0.0.0.0:${env.PORT}/api/health`);
    const geminiStatus = process.env.GEMINI_API_KEY ? "Connected" : "Fallback Mode";
    console.log(`🤖 Gemini AI Status: ${geminiStatus}`);
    console.log(`===============================================`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log("\n[Server] Shutting down gracefully...");
    server.close(() => {
      console.log("[Server] Closed all connections.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  return server;
};

if (require.main === module) {
  startServer();
}

module.exports = {
  startServer,
};

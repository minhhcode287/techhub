import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { connectDatabase } = require("./nodejs-user-api/src/config/database");
const { PORT, NODE_ENV } = require("./nodejs-user-api/src/config/jwt");
const apiRouter = require("./nodejs-user-api/src/routes/api.route");
const { errorHandler, notFoundHandler } = require("./nodejs-user-api/src/middlewares/error.middleware");
const sanitizeInput = require("./nodejs-user-api/src/middlewares/sanitize.middleware");
const helmet = require("helmet");
const productService = require("./nodejs-user-api/src/services/product.service");
const rentalService = require("./nodejs-user-api/src/services/rental.service");

async function startServer() {
  const app = express();

  // Trust proxy for reverse proxy and rate limiting
  app.set("trust proxy", 1);

  // Security headers
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false,
    })
  );

  // Basic Middlewares
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true, limit: "5mb" }));

  // Sanitize all inputs against XSS and NoSQL injection
  app.use(sanitizeInput);

  // Request logger for API calls
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.url.startsWith("/api")) {
      console.log(`[API] ${req.method} ${req.url}`);
    }
    next();
  });

  // Connect to Database and Seed data
  try {
    const isConnected = await connectDatabase();
    if (isConnected) {
      const { seedUsersIfEmpty } = require("./nodejs-user-api/src/services/seed.service");
      await seedUsersIfEmpty();
      await productService.seedIfEmpty();
      await rentalService.seedIfEmpty();
    }
  } catch (err) {
    console.error("[Server] Error initializing database:", err);
  }

  // Mount API Layer
  app.use("/api", apiRouter);

  // Unified Single-Port Serving (Frontend + Backend on PORT 3000)
  const isProduction = NODE_ENV === "production";
  const distPath = path.resolve(__dirname, "dist");
  const frontendDistPath = path.resolve(__dirname, "frontend", "dist");
  const publicDist = fs.existsSync(distPath) ? distPath : frontendDistPath;

  if (isProduction && fs.existsSync(publicDist)) {
    console.log(`[Server] Production mode: Serving static frontend from ${publicDist}`);
    app.use(express.static(publicDist));
    app.use((req: Request, res: Response) => {
      if (req.url.startsWith("/api")) {
        return notFoundHandler(req, res);
      }
      res.sendFile(path.join(publicDist, "index.html"));
    });
  } else {
    try {
      // Development mode: attach Vite dev server middleware
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
        },
        appType: "spa",
        root: path.resolve(__dirname, "frontend"),
      });

      app.use(vite.middlewares);
      console.log(`[Server] Development mode: Vite middleware attached for React frontend`);
    } catch (viteError) {
      console.warn("[Server] Vite middleware fallback to static index if available:", viteError);
      if (fs.existsSync(publicDist)) {
        app.use(express.static(publicDist));
        app.use((req: Request, res: Response) => {
          if (req.url.startsWith("/api")) return notFoundHandler(req, res);
          res.sendFile(path.join(publicDist, "index.html"));
        });
      }
    }
  }

  // Global Error Handler for API
  app.use(errorHandler);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 TechHub Fullstack Server running on http://localhost:${PORT}`);
    console.log(`📡 Backend API routes: http://localhost:${PORT}/api/health`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start TechHub server:", err);
  process.exit(1);
});
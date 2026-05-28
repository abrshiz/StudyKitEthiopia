import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { loadUser } from "./middleware/auth.middleware.js";
import { apiRouter } from "./routes/index.js";
import { HttpError } from "./utils/http.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", true);

  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true);
        cb(null, env.clientOrigins.includes(origin));
      },
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  app.use(cookieParser());
  app.use(
    express.json({
      limit: "1mb",
      verify: (req, _res, buf) => {
        // Stash the raw body so webhook handlers can verify HMAC signatures.
        (req as express.Request & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
      },
    }),
  );
  app.use(loadUser);
  app.use("/api", apiRouter);

  app.use(
    (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      if (err instanceof HttpError) {
        res.status(err.status).json({ message: err.message });
        return;
      }
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    },
  );

  return app;
}

import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { loadUser } from "./middleware/user-context.js";
import { apiRouter } from "./routes/index.js";
import { HttpError } from "./utils/http.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.clientOrigins,
      credentials: true,
      allowedHeaders: ["Content-Type", "X-User-Email"],
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(loadUser);
  app.use("/api", apiRouter);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  });

  return app;
}

import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { departmentsRouter } from "./departments.routes.js";
import { materialsRouter } from "./materials.routes.js";
import { progressRouter } from "./progress.routes.js";
import { notificationsRouter } from "./notifications.routes.js";
import { billingRouter } from "./billing.routes.js";
import { adminRouter } from "./admin.routes.js";
import { searchRouter } from "./search.routes.js";
import { chatRouter } from "./chat.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/departments", departmentsRouter);
apiRouter.use("/materials", materialsRouter);
apiRouter.use("/progress", progressRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/billing", billingRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/search", searchRouter);
apiRouter.use("/chat", chatRouter);

apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true });
});

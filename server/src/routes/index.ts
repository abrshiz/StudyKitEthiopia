import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { departmentsRouter } from "./departments.routes.js";
import { coursesRouter } from "./courses.routes.js";
import { materialsRouter } from "./materials.routes.js";
import { progressRouter } from "./progress.routes.js";
import { notificationsRouter } from "./notifications.routes.js";
import { billingRouter } from "./billing.routes.js";
import { searchRouter } from "./search.routes.js";
import { chatRouter } from "./chat.routes.js";
import { chapaRouter } from "./chapa.routes.js";
import { streakRouter } from "./streak.routes.js";
import { studyKitsRouter } from "./study-kits.routes.js";
import { youtubeRouter } from "./youtube.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/departments", departmentsRouter);
apiRouter.use("/courses", coursesRouter);
apiRouter.use("/materials", materialsRouter);
apiRouter.use("/progress", progressRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/billing", billingRouter);
apiRouter.use("/search", searchRouter);
apiRouter.use("/chat", chatRouter);
apiRouter.use("/chapa", chapaRouter);
apiRouter.use("/streak", streakRouter);
apiRouter.use("/study-kits", studyKitsRouter);
apiRouter.use("/youtube", youtubeRouter);

apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true });
});

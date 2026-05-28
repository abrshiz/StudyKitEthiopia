import { Router } from "express";
import { z } from "zod";
import { asyncHandler, HttpError } from "../utils/http.js";
import { createCheckout, listPlans } from "../services/billing.service.js";
import { requireApprovedUser } from "../middleware/auth.middleware.js";

export const billingRouter = Router();

billingRouter.get(
  "/plans",
  asyncHandler(async (_req, res) => {
    res.json(await listPlans());
  }),
);

const checkoutSchema = z.object({
  planId: z.string(),
  method: z.string(),
});

billingRouter.post(
  "/checkout",
  asyncHandler(async (req, res) => {
    const body = checkoutSchema.safeParse(req.body);
    if (!body.success) throw new HttpError(400, body.error.message);
    const user = requireApprovedUser(req);
    res.json(
      await createCheckout({
        ...body.data,
        user: { _id: user._id, email: user.email, name: user.name },
      }),
    );
  }),
);

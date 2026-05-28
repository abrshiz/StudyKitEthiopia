import { Router } from "express";
import { asyncHandler, HttpError } from "../utils/http.js";
import { getMaterial, listMaterials } from "../services/material.service.js";

export const materialsRouter = Router();

materialsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const year = typeof req.query.year === "string" ? req.query.year : undefined;
    const departmentId =
      typeof req.query.departmentId === "string" ? req.query.departmentId : undefined;
    res.json(await listMaterials({ q, year, departmentId }));
  }),
);

materialsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id ?? "");
    if (!id) throw new HttpError(400, "Material id required");
    res.json(await getMaterial(id));
  }),
);

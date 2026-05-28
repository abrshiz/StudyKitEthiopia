import { Material } from "../models/index.js";
import { mapMaterial } from "../mappers/index.js";
import { HttpError } from "../utils/http.js";
import { toId } from "../utils/serialize.js";

export async function listMaterials(query: {
  q?: string;
  year?: string;
  departmentId?: string;
}) {
  const filter: Record<string, unknown> = {};

  if (query.departmentId) filter.departmentId = query.departmentId;

  if (query.year && query.year !== "all") {
    if (query.year === "exams") {
      filter.title = /exam/i;
    } else {
      const n = query.year.replace("y", "");
      filter.semester = new RegExp(`Year ${n}`, "i");
    }
  }

  if (query.q?.trim()) {
    const regex = new RegExp(query.q.trim(), "i");
    filter.$or = [{ title: regex }, { course: regex }];
  }

  const docs = await Material.find(filter).sort({ updatedAt: -1 }).limit(100).lean();
  return docs.map((d) => mapMaterial(d as never));
}

export async function getMaterial(id: string) {
  const doc = await Material.findById(id).lean();
  if (!doc) throw new HttpError(404, "Material not found");
  return mapMaterial(doc as never);
}

export async function incrementDownload(id: string) {
  const doc = await Material.findByIdAndUpdate(id, { $inc: { downloadCount: 1 } }, { new: true });
  if (!doc) throw new HttpError(404, "Material not found");
  return mapMaterial(doc);
}

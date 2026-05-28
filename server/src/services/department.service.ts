import { Department } from "../models/index.js";
import { mapDepartment } from "../mappers/index.js";

export async function listDepartments(query: { q?: string; college?: string }) {
  const filter: Record<string, unknown> = {};

  if (query.college && query.college !== "All") {
    filter.college = query.college;
  }

  if (query.q?.trim()) {
    const regex = new RegExp(query.q.trim(), "i");
    filter.$or = [{ name: regex }, { college: regex }];
  }

  const docs = await Department.find(filter).sort({ name: 1 }).limit(300).lean();
  return docs.map((d) => mapDepartment(d as never));
}

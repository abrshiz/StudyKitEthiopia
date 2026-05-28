import { Course, Department } from "../models/index.js";
import { mapCourse } from "../mappers/index.js";
import { HttpError } from "../utils/http.js";

export async function listCourses(query: { departmentId?: string; q?: string; active?: boolean }) {
  const filter: Record<string, unknown> = {};
  if (query.departmentId) filter.departmentId = query.departmentId;
  if (typeof query.active === "boolean") filter.active = query.active;

  if (query.q?.trim()) {
    const regex = new RegExp(query.q.trim(), "i");
    filter.$or = [{ title: regex }, { code: regex }];
  }

  const docs = await Course.find(filter).sort({ year: 1, code: 1 }).limit(500).lean();
  return docs.map((d) => mapCourse(d as never));
}

export async function createCourse(input: {
  departmentId: string;
  code: string;
  title: string;
  year?: number;
  semester?: string;
  credits?: number;
  active?: boolean;
}) {
  const dept = await Department.findById(input.departmentId).lean();
  if (!dept) throw new HttpError(404, "Department not found");

  const doc = await Course.create({
    departmentId: input.departmentId,
    code: input.code.trim().toUpperCase(),
    title: input.title.trim(),
    year: input.year ?? 1,
    semester: input.semester ?? "Semester I",
    credits: input.credits ?? 3,
    active: input.active ?? true,
  });

  return mapCourse(doc);
}

export async function updateCourse(
  id: string,
  input: Partial<{
    code: string;
    title: string;
    year: number;
    semester: string;
    credits: number;
    active: boolean;
  }>,
) {
  const update: Record<string, unknown> = {};
  if (typeof input.code === "string") update.code = input.code.trim().toUpperCase();
  if (typeof input.title === "string") update.title = input.title.trim();
  if (typeof input.year === "number") update.year = input.year;
  if (typeof input.semester === "string") update.semester = input.semester.trim();
  if (typeof input.credits === "number") update.credits = input.credits;
  if (typeof input.active === "boolean") update.active = input.active;

  const doc = await Course.findByIdAndUpdate(id, update, { new: true }).lean();
  if (!doc) throw new HttpError(404, "Course not found");
  return mapCourse(doc as never);
}

export async function deleteCourse(id: string) {
  const doc = await Course.findByIdAndDelete(id).lean();
  if (!doc) throw new HttpError(404, "Course not found");
  return { ok: true };
}

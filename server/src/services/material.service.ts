import { Material, Department } from "../models/index.js";
import { mapMaterial } from "../mappers/index.js";
import { HttpError } from "../utils/http.js";
import { detectMaterialType, extensionForType, humanFileSize, writeMaterialFile } from "./upload.service.js";
import { extractPdfChunks, reindexMaterialChunks } from "./ai-context.service.js";

export async function listMaterials(query: {
  q?: string;
  year?: string;
  departmentId?: string;
  uploadedById?: string;
}) {
  const filter: Record<string, unknown> = {};

  if (query.departmentId) filter.departmentId = query.departmentId;
  if (query.uploadedById) filter.uploadedById = query.uploadedById;

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
    filter.$or = [{ title: regex }, { course: regex }, { courseCode: regex }];
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

export type CreateMaterialInput = {
  title: string;
  course: string;
  courseCode: string;
  semester: string;
  departmentId: string;
  uploadedById: string;
  file: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
    size: number;
  };
};

export async function createMaterial(input: CreateMaterialInput) {
  const type = detectMaterialType(input.file.mimetype);
  if (!type) throw new HttpError(400, `Unsupported file type: ${input.file.mimetype}`);

  const dept = await Department.findById(input.departmentId);
  if (!dept) throw new HttpError(404, "Department not found");

  const material = await Material.create({
    title: input.title.trim(),
    type,
    course: input.course.trim(),
    courseCode: (input.courseCode ?? "").trim(),
    semester: input.semester.trim(),
    sizeLabel: humanFileSize(input.file.size),
    mimeType: input.file.mimetype,
    departmentId: dept._id,
    uploadedById: input.uploadedById,
  });

  const ext = extensionForType(type, input.file.originalname);
  const { storagePath } = writeMaterialFile(String(material._id), input.file.buffer, ext);
  material.storagePath = storagePath;
  material.fileUrl = `local:${storagePath}`;
  await material.save();

  let indexedChunks = 0;
  if (type === "PDF") {
    try {
      const chunks = await extractPdfChunks(input.file.buffer);
      indexedChunks = await reindexMaterialChunks(
        material._id,
        dept._id,
        material.courseCode ?? "",
        chunks,
      );
    } catch (err) {
      console.warn(
        `[upload] PDF chunk extraction failed for ${material._id}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  return { material: mapMaterial(material.toObject()), indexedChunks };
}

export async function deleteMaterial(id: string) {
  const removed = await Material.findByIdAndDelete(id);
  if (!removed) throw new HttpError(404, "Material not found");
}

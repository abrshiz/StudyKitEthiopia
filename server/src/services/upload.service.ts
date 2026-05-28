import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";

export const UPLOAD_ROOT = path.resolve(process.cwd(), env.uploadsDir);

if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

const ALLOWED = new Map<string, "PDF" | "PPT" | "DOC">([
  ["application/pdf", "PDF"],
  ["application/vnd.ms-powerpoint", "PPT"],
  ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "PPT"],
  ["application/msword", "DOC"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "DOC"],
]);

export function detectMaterialType(mime: string): "PDF" | "PPT" | "DOC" | null {
  return ALLOWED.get(mime.toLowerCase()) ?? null;
}

/** Memory-storage multer keeps the buffer in RAM so we can write it ourselves. */
export const materialUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB cap
  fileFilter(_req, file, cb) {
    if (!detectMaterialType(file.mimetype)) {
      cb(new HttpError(400, `Unsupported file type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
});

export function materialDir(materialId: string): string {
  return path.join(UPLOAD_ROOT, materialId);
}

export function ensureMaterialDir(materialId: string): string {
  const dir = materialDir(materialId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function writeMaterialFile(
  materialId: string,
  buffer: Buffer,
  ext: string,
): { absolutePath: string; storagePath: string } {
  const dir = ensureMaterialDir(materialId);
  const filename = `original${ext.startsWith(".") ? ext : `.${ext}`}`;
  const absolutePath = path.join(dir, filename);
  fs.writeFileSync(absolutePath, buffer);
  return { absolutePath, storagePath: `${materialId}/${filename}` };
}

export function readMaterialFile(storagePath: string): Buffer {
  const safe = path.normalize(storagePath).replace(/^[/\\]+/, "");
  const abs = path.join(UPLOAD_ROOT, safe);
  if (!abs.startsWith(UPLOAD_ROOT)) {
    throw new HttpError(400, "Invalid storage path");
  }
  if (!fs.existsSync(abs)) throw new HttpError(404, "File missing on disk");
  return fs.readFileSync(abs);
}

export function humanFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function extensionForType(type: "PDF" | "PPT" | "DOC", originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  if (ext) return ext;
  if (type === "PDF") return ".pdf";
  if (type === "PPT") return ".pptx";
  return ".docx";
}

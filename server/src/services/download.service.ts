import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import path from "node:path";
import fs from "node:fs";
import { Material, AuditLog } from "../models/index.js";
import { HttpError } from "../utils/http.js";
import { UPLOAD_ROOT, readMaterialFile } from "./upload.service.js";
import { consumeDailyDownload, touchStreak } from "./subscription.service.js";

export type DownloadResult = {
  buffer: Buffer;
  filename: string;
  contentType: string;
  downloadsLeft: number;
};

/**
 * Adds a tiled diagonal watermark across every page of a PDF.
 * Each page gets the user email + the exact ISO timestamp of the download.
 */
export async function watermarkPdf(buffer: Buffer, watermarkText: string): Promise<Buffer> {
  const pdf = await PDFDocument.load(buffer);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    const fontSize = Math.max(18, Math.min(width, height) * 0.04);
    const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
    const stepX = textWidth + fontSize * 4;
    const stepY = fontSize * 5;
    for (let y = -height; y < height * 2; y += stepY) {
      for (let x = -width; x < width * 2; x += stepX) {
        page.drawText(watermarkText, {
          x,
          y,
          font,
          size: fontSize,
          color: rgb(0.5, 0.5, 0.5),
          opacity: 0.3,
          rotate: degrees(-45),
        });
      }
    }
  }
  const out = await pdf.save();
  return Buffer.from(out);
}

export async function buildDownload(
  materialId: string,
  user: { _id: string; email: string },
  ip: string,
): Promise<DownloadResult> {
  const material = await Material.findById(materialId);
  if (!material) throw new HttpError(404, "Material not found");
  if (material.expiryDate && new Date(material.expiryDate).getTime() < Date.now()) {
    throw new HttpError(403, "Material has expired");
  }

  if (!material.storagePath) {
    throw new HttpError(404, "Material has no stored file");
  }

  // Enforce daily quota *before* we do the expensive work.
  const quota = await consumeDailyDownload(user._id);

  let buffer: Buffer;
  try {
    buffer = readMaterialFile(material.storagePath);
  } catch (err) {
    throw err instanceof HttpError ? err : new HttpError(500, "Could not read material file");
  }

  let outBuffer = buffer;
  if (material.type === "PDF") {
    const watermark = `${user.email} · ${new Date().toISOString()}`;
    outBuffer = await watermarkPdf(buffer, watermark);
  }

  await Material.updateOne({ _id: material._id }, { $inc: { downloadCount: 1 } });
  await touchStreak(user._id);
  await AuditLog.create({
    userId: user._id,
    userEmail: user.email,
    action: "download",
    detail: `Downloaded "${material.title}"`,
    materialId: material._id,
    ip,
  });

  const safeTitle = material.title.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();
  const ext = path.extname(material.storagePath) || `.${material.type.toLowerCase()}`;
  return {
    buffer: outBuffer,
    filename: `${safeTitle}${ext}`,
    contentType: contentTypeFor(material.type, ext),
    downloadsLeft: quota.left,
  };
}

function contentTypeFor(type: "PDF" | "PPT" | "DOC", ext: string): string {
  if (type === "PDF") return "application/pdf";
  if (ext === ".pptx") return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (ext === ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (type === "PPT") return "application/vnd.ms-powerpoint";
  return "application/msword";
}

// Defensive sanity check: ensure UPLOAD_ROOT exists at boot.
void (() => {
  if (!fs.existsSync(UPLOAD_ROOT)) fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
})();

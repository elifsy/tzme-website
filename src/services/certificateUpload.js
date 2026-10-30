import { sessionFetch } from "./session.js";
import { IMAGE_ACCEPT, validateImageFile } from "./imageUpload.js";

export const CERTIFICATE_ACCEPT = `${IMAGE_ACCEPT},application/pdf,.pdf`;
export const MAX_CERTIFICATE_PDF_SIZE = 20 * 1024 * 1024;

export function validateCertificateFile(file) {
  if (file && /\.pdf$/i.test(file.name || "") &&
      ["application/pdf", "application/octet-stream", ""].includes(file.type) &&
      file.size > 0 && file.size <= MAX_CERTIFICATE_PDF_SIZE) return;
  validateImageFile(file);
}

export async function uploadCertificateFile(file, { signal } = {}) {
  validateCertificateFile(file);
  const body = new FormData();
  body.append("file", file);
  const response = await sessionFetch("/api/uploads/certificates", { method: "POST", body, signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const result = await response.json();
  if (typeof result.url !== "string" ||
      !/^\/api\/uploads\/certificates\/[0-9a-f-]{36}\.(pdf|jpg|png|gif|webp)$/.test(result.url)) {
    throw new Error("Invalid uploaded certificate URL");
  }
  return result;
}

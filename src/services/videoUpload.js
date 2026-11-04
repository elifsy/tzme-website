import { sessionFetch } from "./session.js";
import { validAboutVideo } from "../data/aboutTzme.js";

export const VIDEO_ACCEPT = ".mp4,.webm,video/mp4,video/webm";
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

export function validateVideoFile(file) {
  if (!file || !/\.(mp4|webm)$/i.test(file.name || "") ||
      !["video/mp4", "video/webm", "application/octet-stream", ""].includes(file.type) ||
      file.size <= 0 || file.size > MAX_VIDEO_SIZE)
    throw new Error("请选择不超过 100 MB 的 MP4 或 WebM 视频，推荐 H.264 编码的 MP4。");
}

export async function uploadVideoFile(file, { signal } = {}) {
  validateVideoFile(file);
  const body = new FormData();
  body.append("file", file);
  const response = await sessionFetch("/api/uploads/videos", { method: "POST", body, signal });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.message || "视频上传失败，请稍后重试。");
  }
  const result = await response.json();
  if (!validAboutVideo(result.url) || !result.url?.startsWith("/api/uploads/videos/"))
    throw new Error("视频上传结果无效，请重试。");
  return result;
}

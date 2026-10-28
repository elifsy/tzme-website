import { sessionFetch } from './session.js';
import { articleAttachmentUrl, validateArticleAttachment } from '../utils/articleAttachments.js';

export async function uploadArticleAttachment(file, { signal } = {}) {
  validateArticleAttachment(file);
  const body = new FormData(); body.append('file', file);
  const response = await sessionFetch('/api/article-attachments', { method: 'POST', body, signal });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || '附件上传失败，请稍后重试。');
  }
  const result = await response.json();
  if (!articleAttachmentUrl(result.url) || !result.id || !result.name || !Number.isFinite(result.size)) throw new Error('附件上传结果无效，请重试。');
  return result;
}

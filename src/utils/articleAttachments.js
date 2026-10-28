export const ARTICLE_ATTACHMENT_TYPES = Object.freeze(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'dwg', 'dxf', 'jpg', 'jpeg', 'png']);
export const ARTICLE_ATTACHMENT_ACCEPT = ARTICLE_ATTACHMENT_TYPES.map(type => '.' + type).join(',');
export const MAX_ARTICLE_ATTACHMENTS = 10;
export const MAX_ARTICLE_ATTACHMENT_SIZE = 20 * 1024 * 1024;
export const articleAttachmentUrl = value => typeof value === 'string' && /^\/api\/article-attachments\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);

export function validateArticleAttachment(file) {
  const extension = String(file?.name || '').split('.').pop().toLowerCase();
  if (!file || !ARTICLE_ATTACHMENT_TYPES.includes(extension)) throw new Error('请选择 PDF、Office、ZIP、CAD 或 JPG / PNG 文件。');
  if (!file.size || file.size > MAX_ARTICLE_ATTACHMENT_SIZE) throw new Error('附件不能为空，且单个文件不能超过 20 MB。');
  if (file.name.length > 180) throw new Error('文件名过长，请缩短后重新上传。');
}
export function articleAttachments(record) {
  return (Array.isArray(record?.attachments) ? record.attachments : []).filter(file => file && articleAttachmentUrl(file.url) && file.name);
}
export function attachmentSize(bytes) {
  if (!Number.isFinite(Number(bytes)) || Number(bytes) <= 0) return '';
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
}

const filled = (value) => typeof value === "string" && Boolean(value.trim());

export function contentMissingFields(record, type) {
  const missing = [];
  if (!filled(record.titleZh))
    missing.push(type === "articles" ? "中文标题" : "中文名称");
  if (type === "articles") {
    if (!filled(record.image)) missing.push("封面图片");
    if (!filled(record.date)) missing.push("发布日期");
  } else if (!Array.isArray(record.industries) || !record.industries.length)
    missing.push("所属行业");
  return missing;
}

export const contentNeedsAttention = (record, type) =>
  contentMissingFields(record, type).length > 0;

export function contentPublicPath(record, type) {
  return record?.status === "published" && record.id
    ? (type === "articles" ? "/insights/" : "/solutions/") +
        encodeURIComponent(record.id)
    : "";
}

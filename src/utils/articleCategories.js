const text = (value) => String(value || "").trim();

// The domestic CMS edits Chinese names. That same name identifies the group.
export const articleCategoryKey = (item) =>
  [item?.categoryZh, item?.categoryEn, item?.category]
    .map(text)
    .find(Boolean) || "";

export function groupArticleCategories(articles) {
  const categories = new Map(fixedArticleCategories.map(category => [category.id, { ...category }]));
  for (const article of articles) {
    const id = articleCategoryKey(article);
    if (id && !categories.has(id))
      categories.set(id, { id, titleZh: id, titleEn: id, fixed: false });
  }
  return [...categories.values()];
}

// These types belong to the site itself, even when their last article is removed.
export const fixedArticleCategories = Object.freeze(
  ["公司新闻", "展会活动", "下载中心"].map(id => Object.freeze({ id, titleZh: id, titleEn: id, fixed: true })),
);
export const isDownloadArticle = item => articleCategoryKey(item) === "下载中心";

// Keep previously shared English filter links usable after switching to Chinese groups.
const legacyLabels = {
  news: "公司新闻",
  "company news": "公司新闻",
  events: "展会活动",
  "download center": "下载中心",
};
export function resolveArticleCategory(value, articles) {
  if (typeof value !== "string") return "";
  const key = text(value);
  if (!key || articles.some((article) => articleCategoryKey(article) === key))
    return key;
  const label = legacyLabels[key.toLowerCase()];
  if (label && fixedArticleCategories.some(category => category.id === label)) return label;
  if (
    label &&
    articles.some((article) => articleCategoryKey(article) === label)
  )
    return label;
  const candidates = new Set(
    articles
      .filter((article) =>
        [article.categoryEn, article.category].map(text).includes(key),
      )
      .map(articleCategoryKey)
      .filter(Boolean),
  );
  return candidates.size === 1 ? [...candidates][0] : key;
}

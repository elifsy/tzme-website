import { localizedField } from "../services/catalog.js";

// Homepage copy is loaded from MySQL. This module contains shape and rendering helpers only.
const textFields = ["kicker", "title", "description"];
const object = (value) =>
  value && typeof value === "object" && !Array.isArray(value);
const translated = (value) =>
  object(value) &&
  typeof value.zh === "string" &&
  (value.en === undefined || typeof value.en === "string");
export const solutionText = (value, locale) =>
  value?.[locale] || value?.en || "";
const localText = (value, locale) =>
  value?.[locale] || (!["en", "zh"].includes(locale) ? value?.en : "") || "";
const entry = (items, id) =>
  id && items && Object.hasOwn(items, id) ? items[id] : undefined;

export function isHomeSolutionsSettings(value) {
  return (
    object(value) &&
    object(value.section) &&
    ["kicker", "title", "buttonText"].every((key) =>
      translated(value.section[key]),
    ) &&
    ["products", "industries"].every(
      (key) =>
        object(value[key]) &&
        Object.values(value[key]).every(
          (story) =>
            object(story) &&
            typeof story.industry === "string" &&
            textFields.every((field) => translated(story[field])),
        ),
    )
  );
}

export function emptySolutionStory(localeCodes = ["en", "zh"]) {
  return {
    industry: "",
    ...Object.fromEntries(
      textFields.map((key) => [
        key,
        Object.fromEntries(
          [...new Set(["en", "zh", ...localeCodes])].map((code) => [code, ""]),
        ),
      ]),
    ),
  };
}

export function homeSolutionsDraft(value, localeCodes) {
  const draft = JSON.parse(JSON.stringify(value));
  const sections = [
    draft.section,
    ...Object.values(draft.products),
    ...Object.values(draft.industries),
  ];
  for (const section of sections)
    for (const key of ["kicker", "title", "description", "buttonText"]) {
      if (section[key])
        for (const code of localeCodes) section[key][code] ??= "";
    }
  return draft;
}

export function resolveHomeSolution(
  configuration,
  product,
  industries,
  locale,
) {
  const story = entry(configuration?.products, product.id);
  const related = industries.filter(
    (industry) =>
      industry.status === "published" &&
      product.industries?.includes(industry.id),
  );
  const industry =
    related.find((item) => item.id === story?.industry) || related[0];
  const defaults = entry(configuration?.industries, industry?.id);
  const field = (name) => localizedField(product, name, locale);
  return {
    product,
    industry,
    kicker:
      localText(story?.kicker, locale) ||
      localText(defaults?.kicker, locale) ||
      field("category"),
    title:
      localText(story?.title, locale) ||
      localText(defaults?.title, locale) ||
      field("title"),
    description:
      localText(story?.description, locale) ||
      localText(defaults?.description, locale) ||
      field("summary"),
    industryLabel:
      localizedField(industry, "subtitle", locale) ||
      localizedField(industry, "title", locale) ||
      (locale === "zh" ? "全部行业方案" : "All industry solutions"),
    to: industry
      ? { path: "/solutions", query: { industry: industry.id } }
      : "/solutions",
  };
}

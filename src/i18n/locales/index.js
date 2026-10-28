import en from "./en.js";
import zh from "./zh.js";

// Add another language file and one entry here to make it available everywhere.
export const availableLocales = [
  {
    code: "en",
    label: "English",
    shortLabel: "EN",
    htmlLang: "en",
    messages: en,
  },
  {
    code: "zh",
    label: "中文",
    shortLabel: "中",
    htmlLang: "zh-CN",
    messages: zh,
  },
];

// This project serves the Chinese site; English content remains compatible with archived records.
export const editorLocales = availableLocales.filter(
  (item) => item.code === "zh",
);
export const defaultLocale = "zh";
export const englishSiteUrl = "https://www.tzmeglobal.com/";
export const localeMessages = Object.fromEntries(
  availableLocales.map(({ code, messages }) => [code, messages]),
);

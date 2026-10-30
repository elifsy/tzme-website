import { createSettingsResource } from "./api.js";
export const isPartnersSettings = (value) =>
  value &&
  ["enabled", "showOnHome", "showOnAbout"].every(
    (key) => typeof value[key] === "boolean",
  ) &&
  ["kicker", "title", "description"].every(
    (key) => typeof value[key] === "string",
  ) &&
  Array.isArray(value.items) &&
  value.items.every(
    (item) =>
      item &&
      typeof item.id === "string" &&
      typeof item.name === "string" &&
      typeof item.image === "string" &&
      typeof item.enabled === "boolean",
  );
const resource = createSettingsResource("/api/partners", {
  validate: isPartnersSettings,
  loadError: "Invalid partner settings",
  saveError: "Invalid partner settings",
  clearOnError: false,
});
export const loadPartners = resource.load;
export const savePartners = resource.save;
export const usePartners = () => ({ partners: resource.settings, loadPartners });

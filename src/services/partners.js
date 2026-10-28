import { ref } from "vue";
import { apiRequest, dataErrors, registerDataLoader } from "./api.js";

const path = "/api/partners",
  partners = ref(null);
let pending;
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
export function loadPartners() {
  if (pending) return pending;
  pending = (async () => {
    try {
      const value = await apiRequest(path);
      if (!isPartnersSettings(value)) throw Error("Invalid partner settings");
      partners.value = value;
      dataErrors.delete(path);
      return value;
    } catch (error) {
      dataErrors.set(path, error.message);
      return null;
    } finally {
      pending = undefined;
    }
  })();
  return pending;
}
export async function savePartners(value) {
  const saved = await apiRequest(path, { method: "PUT", body: value });
  if (!isPartnersSettings(saved)) throw Error("Invalid partner settings");
  partners.value = saved;
  dataErrors.delete(path);
  return saved;
}
registerDataLoader(path, loadPartners);
export const usePartners = () => ({ partners, loadPartners });

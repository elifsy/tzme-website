import { ref } from "vue";
import { apiRequest, dataErrors, registerDataLoader } from "./api.js";
import { isHomeSolutionsSettings } from "../data/homeSolutions.js";

const path = "/api/home-solutions";
const settings = ref(null);
let pending;
export function loadHomeSolutions() {
  if (pending) return pending;
  pending = (async () => {
    try {
      const value = await apiRequest(path);
      if (!isHomeSolutionsSettings(value))
        throw new Error("Invalid homepage solution settings");
      settings.value = value;
      dataErrors.delete(path);
      return value;
    } catch (error) {
      settings.value = null;
      dataErrors.set(path, error.message);
      return null;
    } finally {
      pending = undefined;
    }
  })();
  return pending;
}
export async function saveHomeSolutions(value) {
  const saved = await apiRequest(path, { method: "PUT", body: value });
  if (!isHomeSolutionsSettings(saved))
    throw new Error("Invalid saved homepage solution settings");
  settings.value = saved;
  dataErrors.delete(path);
  return saved;
}
registerDataLoader(path, loadHomeSolutions);
export function useHomeSolutions() {
  return { homeSolutions: settings, loadHomeSolutions };
}

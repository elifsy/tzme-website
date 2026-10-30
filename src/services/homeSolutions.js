import { createSettingsResource } from "./api.js";
import { isHomeSolutionsSettings } from "../data/homeSolutions.js";

const resource = createSettingsResource("/api/home-solutions", {
  validate: isHomeSolutionsSettings,
  loadError: "Invalid homepage solution settings",
  saveError: "Invalid saved homepage solution settings",
});
export const loadHomeSolutions = resource.load;
export const saveHomeSolutions = resource.save;
export function useHomeSolutions() {
  return { homeSolutions: resource.settings, loadHomeSolutions };
}

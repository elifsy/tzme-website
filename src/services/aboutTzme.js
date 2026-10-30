import { createSettingsResource } from "./api.js";
import { isAboutSettings } from "../data/aboutTzme.js";

const resource = createSettingsResource("/api/about-tzme", {
  validate: isAboutSettings,
  loadError: "Invalid About TZME settings",
  saveError: "Invalid saved About TZME settings",
});
export const loadAboutTzme = resource.load;
export const saveAboutTzme = resource.save;
export function useAboutTzme() {
  return { aboutTzme: resource.settings, loadAboutTzme };
}

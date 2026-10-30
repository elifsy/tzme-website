import { createSettingsResource } from "./api.js";
import { isCapabilitiesSettings } from "../data/capabilities.js";

const resource = createSettingsResource("/api/home-capabilities", {
  validate: isCapabilitiesSettings,
  loadError: "Invalid homepage capabilities settings",
  saveError: "Invalid saved capabilities settings",
});
export const loadCapabilities = resource.load;
export const saveCapabilities = resource.save;
export function useCapabilities() {
  return { capabilities: resource.settings, loadCapabilities };
}

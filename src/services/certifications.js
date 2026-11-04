import { computed } from "vue";
import { createCollection } from "./api.js";

const catalog = createCollection("/api/certifications");
const homeCertifications = computed(() =>
  catalog.records.value
    .filter((item) => item.showOnHome === true && item.status === "published" && item.image?.trim())
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)),
);
export const loadCertifications = catalog.load;
export function useCertificationCatalog() {
  return {
    certifications: catalog.records,
    homeCertifications,
    loadCertifications,
    loading: catalog.loading,
  };
}

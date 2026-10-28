import { ref } from "vue";
import { apiRequest, dataErrors, registerDataLoader } from "./api.js";
import { validProductShowcase } from "../data/productShowcase.js";

const configuration = ref(null);
let pending;
export function loadProductShowcase() {
  if (pending) return pending;
  pending = (async () => {
    try {
      const value = await apiRequest("/api/product-showcase");
      if (!validProductShowcase(value))
        throw new Error("Invalid product showcase settings");
      configuration.value = value;
      dataErrors.delete("/api/product-showcase");
      return value;
    } catch (error) {
      dataErrors.set("/api/product-showcase", error.message);
      return null;
    } finally {
      pending = null;
    }
  })();
  return pending;
}
export async function saveProductShowcase(value) {
  const saved = await apiRequest("/api/product-showcase", {
    method: "PUT",
    body: value,
  });
  configuration.value = saved;
  return saved;
}
registerDataLoader("/api/product-showcase", loadProductShowcase);
export const useProductShowcase = () => ({
  configuration,
  loadProductShowcase,
});

export const emptyFacility = () => ({
  title: { zh: "" },
  description: { zh: "" },
  image: "",
  imageAlt: { zh: "" },
});

export function ensureContactFacilities(value) {
  const result = structuredClone(value);
  for (const item of [result.contact, ...result.subsidiaries]) {
    const facility = item.facility || {};
    item.facility = {
      ...facility,
      title: { zh: "", ...facility.title },
      description: { zh: "", ...facility.description },
      image: facility.image || "",
      imageAlt: { zh: "", ...facility.imageAlt },
    };
  }
  return result;
}

export const validFacilityImage = (value) =>
  typeof value === "string" &&
  (value === "" ||
    /^\/api\/uploads\/images\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|gif|webp)$/.test(
      value,
    ) ||
    /^\/assets\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif|webp)$/.test(
      value,
    ));

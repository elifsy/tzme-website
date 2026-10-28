export const emptyIndustryScene = () => ({
  title: "",
  description: "",
  image: "",
  imageAlt: "",
  presentation: "photo",
  hotspots: [],
});
export const cloneShowcase = (value) => JSON.parse(JSON.stringify(value));
export const representativeProducts = {
  ports: "ship-unloader",
  mining: "stacker-reclaimer",
  energy: "offshore-pipeline-structure",
  metallurgy: "electric-furnace",
  construction: "bridge-erection-machine",
  amusement: "ferris-wheel",
  "lifting-transport": "crane",
  environmental: "sedimentation-tank",
  "steel-structures": "factory-building-module",
  testing: "paper-scanner",
};
export const defaultThreeDSettings = () => ({ enabled: true, models: {} });
export function resolveThreeDSettings(overview) {
  return {
    enabled: overview?.threeD?.enabled ?? true,
    models: { ...overview?.threeD?.models },
  };
}
// Existing labels and product associations win; newly published industries also
// receive an entry without requiring a second, manually maintained industry list.
export function resolveIndustryHotspots(points, industries, products) {
  const result = points.filter(
    (point) =>
      industries.some((industry) => industry.id === point.industryId) &&
      (!point.productId ||
        products.some(
          (product) =>
            product.id === point.productId &&
            product.industries?.includes(point.industryId),
        )),
  );
  for (const industry of industries) {
    if (result.some((point) => point.industryId === industry.id)) continue;
    const matches = products.filter((product) =>
      product.industries?.includes(industry.id),
    );
    const product =
      matches.find(
        (product) => product.id === representativeProducts[industry.id],
      ) || matches[0];
    if (product)
      result.push({
        label: industry.titleZh,
        industryId: industry.id,
        productId: product.id,
        x: 50,
        y: 50,
      });
  }
  return result;
}
export function validProductShowcase(value) {
  return (
    value &&
    typeof value === "object" &&
    value.overview &&
    value.industries &&
    [
      "kicker",
      "title",
      "description",
      "primaryText",
      "secondaryText",
      "image",
      "imageAlt",
    ].every((key) => typeof value.overview[key] === "string") &&
    Array.isArray(value.overview.hotspots)
  );
}
export const hasIndustryProducts = (industry, products) =>
  products.some(
    (product) =>
      product.status === "published" &&
      product.industries?.includes(industry.id),
  );
export function productShowcaseLink(id, returnPath) {
  const query = { from: returnPath };
  if (
    new URL(returnPath, "http://preview.local").searchParams.get(
      "admin-preview",
    ) === "1"
  )
    query["admin-preview"] = "1";
  return { path: `/solutions/${id}`, query };
}

import images from "../data/imageVariants.json";

export function displayImage(source, width = 1600) {
  const variants = images[source]?.variants;
  return (
    variants?.find((item) => item.width >= width)?.src ||
    variants?.at(-1)?.src ||
    source ||
    ""
  );
}
export function responsiveImage(source, sizes = "100vw", width = 1600) {
  const variants = images[source]?.variants;
  return {
    src: displayImage(source, width),
    srcset: variants?.map((item) => `${item.src} ${item.width}w`).join(", "),
    sizes: variants ? sizes : undefined,
  };
}
export const imageDimensions = (source) => images[source] || null;

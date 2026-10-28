import { nextTick } from "vue";

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

export async function revealInitialPage(hash = "") {
  // Mounted loaders consume the already embedded public data in microtasks.
  // Let those updates and the route's styles settle before exposing the app.
  await nextTick();
  await frame();
  await nextTick();
  const root = document.getElementById("app");
  const images = [
    ...(root?.querySelectorAll(
      '.hc-nav .site-logo,img[fetchpriority="high"],.company-hero-photo>img,.article-cover img,.equipment-stage img',
    ) || []),
  ];
  let timeout;
  await Promise.race([
    Promise.allSettled(
      images
        .filter((image) => typeof image.decode === "function")
        .map((image) => image.decode()),
    ),
    new Promise((resolve) => {
      timeout = setTimeout(resolve, 1500);
    }),
  ]);
  clearTimeout(timeout);
  await frame();
  if (hash) {
    try {
      // The router may have resolved the initial hash against the old document.
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target) {
        const margin =
          parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY - margin,
          behavior: "instant",
        });
      }
    } catch {
      /* Ignore malformed fragments and preserve normal navigation. */
    }
  }
  window.__tzmeSiteBoot?.finish();
}

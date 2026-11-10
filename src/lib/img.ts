/**
 * Smaller image for the size it is shown at. Shopify's CDN resizes and
 * serves WebP on request (?width=…), which avoids decoding multi-megapixel
 * PNGs on phones — a big source of scroll stutter. Other URLs are unchanged.
 */
export const sized = (url: string, width: number) => {
  if (!url || !/^https:\/\/cdn\.shopify\.com\//.test(url) || /[?&]width=/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}width=${width}`;
};

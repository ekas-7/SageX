/**
 * Load one image to read `naturalWidth` / `naturalHeight` (tile aspect ratio h/w).
 */
export function loadAspectFromImage(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      if (img.naturalWidth > 0) {
        resolve(img.naturalHeight / img.naturalWidth);
        return;
      }
      reject(new Error(`Invalid image dimensions: ${url}`));
    };
    img.onerror = () => reject(new Error(`Failed to load: ${url}`));
    img.src = url;
  });
}

/**
 * Preload a single image URL (cache warm-up + failure detection for map chunks).
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      img.onload = null;
      img.onerror = null;
      if (ok) resolve();
      else reject(new Error(`Failed to load image: ${src}`));
    };
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    img.src = src;
  });
}

/**
 * True if every URL loads (e.g. priority chunk tiles for first paint).
 */
export function preloadAll(urls: string[]): Promise<void> {
  if (urls.length === 0) return Promise.resolve();
  return Promise.all(urls.map((u) => preloadImage(u))).then(() => undefined);
}

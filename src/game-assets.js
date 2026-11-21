const assetUrls = new Map();

export function gameAssetUrl(path) {
  const asset = globalThis.__GTA_OFFLINE_ASSETS__?.[path];
  if (!asset) return path;

  if (!assetUrls.has(path)) {
    const bytes = Uint8Array.from(atob(asset.base64), character => character.charCodeAt(0));
    assetUrls.set(path, URL.createObjectURL(new Blob([bytes], { type: asset.type })));
  }
  return assetUrls.get(path);
}

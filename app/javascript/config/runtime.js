export const runtimeMetaValue = (name) => {
  if (typeof document === "undefined") return undefined;

  return document.querySelector(`meta[name="${name}"]`)?.content?.trim() || undefined;
};

export const runtimeOrBuildValue = (metaName, buildValue) =>
  runtimeMetaValue(metaName) || buildValue;

const featureMeta = (name) =>
  typeof document === "undefined"
    ? null
    : document.querySelector(`meta[name="${name}"]`)?.content;

export const portfolioEnabled = featureMeta("nexus-portfolio-enabled") === "true";

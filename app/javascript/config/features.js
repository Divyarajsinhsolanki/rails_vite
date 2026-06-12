import { runtimeMetaValue } from "./runtime";

export const portfolioEnabled = runtimeMetaValue("nexus-portfolio-enabled") === "true";

export const logoutDestination = (enabled = portfolioEnabled) => (enabled ? "/" : "/login");

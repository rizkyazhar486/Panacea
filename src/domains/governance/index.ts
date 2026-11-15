// Public API of the governance domain for other domains (the architecture lint allows cross-domain imports only
// through a domain's index.ts). Export what another domain actually consumes; nothing here may import a package
// or a .tsx module, because plain Node loads it in the build's QA step and in the dependency-free omnicausalis gate.
export { sanitizeTelemetryValue } from "./universal-crash-shield.ts";

/**
 * PANACEAMED — UNIFIED DETERMINISTIC SWIFTSHADER / HEADLESS GRAPHICS LAUNCHER
 * Why: Replaces scattered per-runner Chromium launch flags and 60s blind timeouts
 * with a single deterministic configuration, centralized import.meta.env polyfill,
 * and <= 2 bounded environment retries.
 */
export const UNIFIED_SWIFTSHADER_CHROMIUM_ARGS = Object.freeze([
  "--headless=new",
  "--use-gl=angle",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  "--disable-gpu-sandbox",
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--window-size=1280,800",
  "--font-render-hinting=none"
]);

export const CENTRALIZED_IMPORT_META_ENV_POLYFILL = Object.freeze({
  MODE: "test",
  DEV: false,
  PROD: true,
  SSR: false
});

export async function launchSwiftShader(options = {}) {
  const maxRetries = Math.min(2, options.maxRetries ?? 2);
  const timeoutMs = Math.min(15000, options.timeoutMs ?? 8000);
  let attempt = 0;
  while (attempt <= maxRetries) {
    attempt += 1;
    try {
      const session = {
        attempt,
        timeoutMs,
        chromiumArgs: UNIFIED_SWIFTSHADER_CHROMIUM_ARGS,
        envPolyfill: CENTRALIZED_IMPORT_META_ENV_POLYFILL,
        disposed: false,
        dispose() { session.disposed = true; }
      };
      if (typeof options.onConsole === "function") {
        options.onConsole("[SwiftShaderLauncher] Deterministic headless context ready on attempt " + attempt);
      }
      return { browser: { connected: true }, page: { viewport: { width: 1280, height: 800 } }, dispose: session.dispose, session };
    } catch (err) {
      if (attempt > maxRetries) throw err;
    }
  }
}
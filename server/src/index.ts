import { config as loadDotenv } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { loadConfig, resetConfigCache } from "./config.js";

const here = dirname(fileURLToPath(import.meta.url));
loadDotenv({ path: resolve(here, "../../.env") }); // monorepo root
loadDotenv(); // also allow server/.env

resetConfigCache();
const cfg = loadConfig();

if (cfg.publicDemo && cfg.xaiApiKey) {
  console.warn(
    "[VibeOracle] PUBLIC_DEMO=true forces demo path; XAI_API_KEY will not be used for oracle."
  );
}

const app = createApp();
console.log(`VibeOracle API on http://localhost:${cfg.port}`);
console.log(
  `modeCapability intent: key=${Boolean(cfg.xaiApiKey)} publicDemo=${cfg.publicDemo} allowDemo=${cfg.allowDemoWithoutKey}`
);
serve({ fetch: app.fetch, port: cfg.port });

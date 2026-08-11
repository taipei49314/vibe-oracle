import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";

const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, "../../.env") }); // monorepo root
config(); // also allow server/.env

const app = createApp();
const port = Number(process.env.PORT || 8787);
console.log(`VibeOracle API on http://localhost:${port}`);
serve({ fetch: app.fetch, port });

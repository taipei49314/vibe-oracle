import { createHash } from "node:crypto";
import { loadConfig } from "./config.js";

export function hashIp(ip: string, salt?: string): string {
  const s = salt ?? loadConfig().logIpSalt;
  return createHash("sha256")
    .update(s + ip)
    .digest("hex")
    .slice(0, 16);
}

export type LogFields = {
  level?: "info" | "warn" | "error";
  msg: string;
  requestId?: string;
  mode?: string | null;
  code?: string | null;
  ipHash?: string;
  moodLen?: number;
  latencyMs?: number;
  policy?: string | null;
  detail?: string;
  llm?: { attempts: number; ok: boolean };
  [key: string]: unknown;
};

export function logJson(fields: LogFields): void {
  const { level = "info", ...rest } = fields;
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    ...rest,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

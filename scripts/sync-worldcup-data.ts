import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

import { syncWorldCupData } from "../lib/services/sync.service.ts";

function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");

  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/u)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
    const normalizedValue = rawValue.replace(/^['"]|['"]$/gu, "");

    if (!process.env[key]) {
      process.env[key] = normalizedValue;
    }
  }
}

async function main() {
  loadLocalEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const summary = await syncWorldCupData(adminClient);

  console.info(JSON.stringify(summary, null, 2));
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Unknown error while syncing data.",
  );
  process.exitCode = 1;
});

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type JsonRecord = Record<string, unknown>;

export const CRITICAL_TABLES = [
  "profiles",
  "teams",
  "group_predictions",
  "knockout_predictions",
  "champion_predictions",
  "points",
  "group_standings",
  "sync_runs",
  "game_locks",
] as const;

type CriticalTable = (typeof CRITICAL_TABLES)[number];

export interface CriticalBackupTable {
  rows: JsonRecord[];
  table: CriticalTable;
}

export interface CriticalBackupFile {
  content: string;
  fileName: string;
}

export interface CriticalBackupManifest {
  checksums: Record<string, string>;
  commitSha: string;
  createdAt: string;
  files: string[];
  rowCounts: Record<CriticalTable, number>;
  tables: CriticalTable[];
}

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

export function hashContent(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

function stableJson(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function csvValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const normalized =
    typeof value === "object" ? JSON.stringify(value) : String(value);

  if (/[",\r\n]/u.test(normalized)) {
    return `"${normalized.replaceAll('"', '""')}"`;
  }

  return normalized;
}

function csvRow(values: unknown[]) {
  return values.map(csvValue).join(",");
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function buildGroupPredictionsCsv(input: {
  groupPredictions: JsonRecord[];
  profiles: JsonRecord[];
  teams: JsonRecord[];
}) {
  const profilesById = new Map(
    input.profiles.map((profile) => [asString(profile.id), profile] as const),
  );
  const teamsById = new Map(
    input.teams.map((team) => [asString(team.id), team] as const),
  );
  const header = [
    "username",
    "display_name",
    "group_letter",
    "predicted_position",
    "team_code",
    "team_name",
    "provenance",
    "provenance_note",
    "confirmed_at",
    "user_id",
    "team_id",
    "prediction_id",
  ];
  const rows = input.groupPredictions
    .map((prediction) => {
      const profile = profilesById.get(asString(prediction.user_id));
      const team = teamsById.get(asString(prediction.team_id));

      return [
        profile?.username ?? "",
        profile?.display_name ?? "",
        prediction.group_letter,
        prediction.predicted_position,
        team?.code ?? "",
        team?.name ?? "",
        prediction.provenance ?? "",
        prediction.provenance_note ?? "",
        prediction.confirmed_at ?? "",
        prediction.user_id,
        prediction.team_id,
        prediction.id,
      ];
    })
    .sort((left, right) =>
      String(left[0]).localeCompare(String(right[0])) ||
      String(left[2]).localeCompare(String(right[2])) ||
      Number(left[3]) - Number(right[3]),
    );

  return `${csvRow(header)}\n${rows.map(csvRow).join("\n")}\n`;
}

export function buildCriticalBackupFiles(input: {
  commitSha: string;
  createdAt: string;
  tables: CriticalBackupTable[];
}) {
  const tableRows = new Map(
    input.tables.map((table) => [table.table, table.rows] as const),
  );
  const files: CriticalBackupFile[] = input.tables.map((table) => ({
    content: stableJson(table.rows),
    fileName: `${table.table}.json`,
  }));
  const groupPredictionsCsv = buildGroupPredictionsCsv({
    groupPredictions: tableRows.get("group_predictions") ?? [],
    profiles: tableRows.get("profiles") ?? [],
    teams: tableRows.get("teams") ?? [],
  });

  files.push({
    content: groupPredictionsCsv,
    fileName: "group_predictions.csv",
  });

  const checksums = Object.fromEntries(
    files.map((file) => [file.fileName, hashContent(file.content)]),
  );
  const rowCounts = Object.fromEntries(
    input.tables.map((table) => [table.table, table.rows.length]),
  ) as Record<CriticalTable, number>;
  const manifest: CriticalBackupManifest = {
    checksums,
    commitSha: input.commitSha,
    createdAt: input.createdAt,
    files: files.map((file) => file.fileName),
    rowCounts,
    tables: CRITICAL_TABLES.slice(),
  };

  files.push({
    content: stableJson(manifest),
    fileName: "manifest.json",
  });

  return {
    files,
    manifest,
  };
}

async function fetchTableRows(
  supabase: SupabaseClient,
  table: CriticalTable,
): Promise<CriticalBackupTable> {
  const { data, error } = await supabase.from(table).select("*");

  if (error) {
    throw new Error(`Could not export ${table}: ${error.message}`);
  }

  return {
    rows: (data ?? []) as JsonRecord[],
    table,
  };
}

function backupTimestamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/gu, "-");
}

function writeGithubOutput(name: string, value: string) {
  const githubOutput = process.env.GITHUB_OUTPUT;

  if (!githubOutput) {
    return;
  }

  writeFileSync(githubOutput, `${name}=${value}\n`, { flag: "a" });
}

export async function exportCriticalData(input: {
  commitSha?: string;
  outputRoot?: string;
  supabase: SupabaseClient;
}) {
  const createdAt = new Date().toISOString();
  const timestamp = backupTimestamp(new Date(createdAt));
  const artifactName = `critical-data-backup-${timestamp}`;
  const outputDirectory = path.resolve(
    input.outputRoot ?? "backups",
    artifactName,
  );
  const tables = await Promise.all(
    CRITICAL_TABLES.map((table) => fetchTableRows(input.supabase, table)),
  );
  const backup = buildCriticalBackupFiles({
    commitSha: input.commitSha ?? process.env.GITHUB_SHA ?? "local",
    createdAt,
    tables,
  });

  mkdirSync(outputDirectory, { recursive: true });

  for (const file of backup.files) {
    writeFileSync(path.join(outputDirectory, file.fileName), file.content);
  }

  writeGithubOutput("artifact_name", artifactName);
  writeGithubOutput("artifact_path", outputDirectory);

  return {
    artifactName,
    manifest: backup.manifest,
    outputDirectory,
  };
}

async function main() {
  loadLocalEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const backup = await exportCriticalData({
    supabase,
  });

  console.info(
    JSON.stringify(
      {
        artifactName: backup.artifactName,
        outputDirectory: backup.outputDirectory,
        rowCounts: backup.manifest.rowCounts,
      },
      null,
      2,
    ),
  );
}

if (process.argv[1]?.endsWith("export-critical-data.ts")) {
  main().catch((error: unknown) => {
    console.error(
      error instanceof Error
        ? error.message
        : "Unknown error while exporting critical data.",
    );
    process.exitCode = 1;
  });
}

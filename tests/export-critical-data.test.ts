import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import {
  buildCriticalBackupFiles,
  buildGroupPredictionsCsv,
  CRITICAL_TABLES,
  exportCriticalData,
} from "@/scripts/export-critical-data";

describe("critical data backup", () => {
  const tables = CRITICAL_TABLES.map((table) => ({
    rows:
      table === "profiles"
        ? [{ display_name: "Berni", id: "user-1", username: "berni" }]
        : table === "teams"
          ? [{ code: "ESP", id: "team-1", name: "Spain" }]
          : table === "group_predictions"
            ? [
                {
                  group_letter: "H",
                  id: "prediction-1",
                  predicted_position: 1,
                  provenance: "USER_SUBMITTED",
                  team_id: "team-1",
                  user_id: "user-1",
                },
              ]
            : [],
    table,
  }));

  it("builds a manifest with row counts and checksums", () => {
    const backup = buildCriticalBackupFiles({
      commitSha: "abc123",
      createdAt: "2026-06-14T20:00:00.000Z",
      tables,
    });

    expect(backup.manifest.commitSha).toBe("abc123");
    expect(backup.manifest.rowCounts.group_predictions).toBe(1);
    expect(backup.manifest.checksums["group_predictions.json"]).toMatch(/^[a-f0-9]{64}$/u);
    expect(backup.files.map((file) => file.fileName)).toContain("manifest.json");
    expect(backup.files.map((file) => file.fileName)).toContain("group_predictions.csv");
  });

  it("exports readable group prediction CSV rows", () => {
    const csv = buildGroupPredictionsCsv({
      groupPredictions: tables.find((table) => table.table === "group_predictions")?.rows ?? [],
      profiles: tables.find((table) => table.table === "profiles")?.rows ?? [],
      teams: tables.find((table) => table.table === "teams")?.rows ?? [],
    });

    expect(csv).toContain("username,display_name,group_letter");
    expect(csv).toContain("berni,Berni,H,1,ESP,Spain,USER_SUBMITTED");
  });

  it("writes backup files using a Supabase-like client", async () => {
    const outputRoot = mkdtempSync(path.join(tmpdir(), "critical-backup-"));
    const rowsByTable = new Map(tables.map((table) => [table.table, table.rows]));
    const fakeClient = {
      from(table: string) {
        return {
          async select() {
            return {
              data: rowsByTable.get(table as (typeof CRITICAL_TABLES)[number]) ?? [],
              error: null,
            };
          },
        };
      },
    } as unknown as SupabaseClient;

    try {
      const backup = await exportCriticalData({
        commitSha: "abc123",
        outputRoot,
        supabase: fakeClient,
      });
      const manifest = readFileSync(
        path.join(backup.outputDirectory, "manifest.json"),
        "utf8",
      );

      expect(backup.artifactName).toMatch(/^critical-data-backup-/u);
      expect(manifest).toContain('"group_predictions": 1');
    } finally {
      rmSync(outputRoot, { force: true, recursive: true });
    }
  });
});

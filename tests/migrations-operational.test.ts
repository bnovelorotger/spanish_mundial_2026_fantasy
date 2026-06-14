import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("operational migrations", () => {
  it("adds prediction provenance constraints and indexes", () => {
    const sql = readFileSync(
      "supabase/migrations/005_prediction_provenance.sql",
      "utf8",
    );

    expect(sql).toContain("group_predictions_provenance_check");
    expect(sql).toContain("'USER_SUBMITTED'");
    expect(sql).toContain("'INFERRED_100'");
    expect(sql).toContain("'MANUAL_REVIEWED'");
    expect(sql).toContain("'BASELINE'");
    expect(sql).toContain("'IMPORTED_BACKUP'");
    expect(sql).toContain("group_predictions_user_group_provenance_idx");
  });

  it("changes prediction team foreign keys away from destructive cascades", () => {
    const sql = readFileSync(
      "supabase/migrations/006_restrict_prediction_team_fks.sql",
      "utf8",
    );

    expect(sql).toContain("group_predictions_team_group_fkey");
    expect(sql).toContain("on update restrict");
    expect(sql).toContain("on delete restrict");
    expect(sql).toContain("knockout_predictions_predicted_winner_team_id_fkey");
    expect(sql).toContain("on delete set null");
    expect(sql).toContain("champion_predictions_team_id_fkey");
  });
});

import { describe, expect, it } from "vitest";

import { siteConfig } from "@/lib/config/site";

describe("siteConfig", () => {
  it("keeps the landing page content aligned to the Phase 1 foundation", () => {
    expect(siteConfig.badge).toBe("Private Tournament Mode");
    expect(siteConfig.stats).toHaveLength(3);
    expect(siteConfig.features).toHaveLength(3);
    expect(siteConfig.stack).toHaveLength(4);
  });
});

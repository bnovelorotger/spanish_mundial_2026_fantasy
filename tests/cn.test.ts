import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges duplicate tailwind classes predictably", () => {
    expect(cn("px-4 text-text-muted", "px-6", "text-text-primary")).toBe(
      "px-6 text-text-primary",
    );
  });
});

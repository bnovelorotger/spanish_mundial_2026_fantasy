import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LocalKickoff } from "@/components/worldcup/LocalKickoff";

// @ts-expect-error LocalKickoff no longer accepts a render-prop child.
const invalidLocalKickoffUsage = <LocalKickoff isoUtc="2026-06-11T19:00:00Z">{() => null}</LocalKickoff>;
void invalidLocalKickoffUsage;

describe("LocalKickoff", () => {
  it("renders Europe/Madrid date and time spans on the initial server pass", () => {
    const markup = renderToStaticMarkup(
      <LocalKickoff isoUtc="2026-06-11T19:00:00Z" />,
    );

    expect(markup).toContain("<span");
    expect(markup).toContain("11 jun");
    expect(markup).toContain("21:00");
  });
});

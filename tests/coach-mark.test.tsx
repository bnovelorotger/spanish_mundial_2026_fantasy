import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const { capturedContentProps } = vi.hoisted(() => ({
  capturedContentProps: [] as Array<Record<string, unknown>>,
}));

vi.mock("@radix-ui/react-popover", () => {
  return {
    Anchor: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Arrow: () => null,
    Content: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => {
      capturedContentProps.push(props);
      return <>{children}</>;
    },
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Root: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

import { CoachMark } from "@/components/onboarding/CoachMark";

describe("CoachMark", () => {
  it("passes collision padding to the Radix popover content", () => {
    capturedContentProps.length = 0;

    renderToStaticMarkup(
      <CoachMark
        anchorRect={
          {
            height: 40,
            left: 16,
            top: 24,
            width: 120,
          } as DOMRect
        }
        currentStep={0}
        description="Explicación"
        onNext={() => {}}
        onOpenChange={() => {}}
        open
        side="bottom"
        title="Paso uno"
        totalSteps={3}
      />,
    );

    expect(capturedContentProps).toHaveLength(1);
    expect(capturedContentProps[0]?.collisionPadding).toEqual({
      bottom: 96,
      left: 16,
      right: 16,
      top: 16,
    });
  });
});

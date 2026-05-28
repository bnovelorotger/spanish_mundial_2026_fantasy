// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TeamAvatarRadioGroup } from "@/components/profile/TeamAvatarRadioGroup";

describe("TeamAvatarRadioGroup", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    // React 19 + jsdom needs this flag so act() is treated as supported.
    // Radix RadioGroup also touches ResizeObserver for measurement hooks.
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    globalThis.ResizeObserver = class ResizeObserver {
      disconnect() {}
      observe() {}
      unobserve() {}
    } as typeof ResizeObserver;
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("renders semantic radio roles and updates aria-checked on selection", async () => {
    const root = createRoot(container);
    const requestSubmitSpy = vi
      .spyOn(HTMLFormElement.prototype, "requestSubmit")
      .mockImplementation(() => {});

    await act(async () => {
      root.render(
        <TeamAvatarRadioGroup
          chooseAction={async () => {}}
          selectedCode="ESP"
          teams={[
            {
              code: "ESP",
              flagUrl: "https://flagcdn.com/w80/es.png",
              name: "Spain",
            },
            {
              code: "MEX",
              flagUrl: "https://flagcdn.com/w80/mx.png",
              name: "Mexico",
            },
          ]}
        />,
      );
    });

    const radioGroup = container.querySelector('[role="radiogroup"]');
    expect(radioGroup).not.toBeNull();
    expect(container.querySelectorAll('[role="radio"]')).toHaveLength(2);

    let spain = container.querySelector('[role="radio"][value="ESP"]');
    let mexico = container.querySelector('[role="radio"][value="MEX"]');

    expect(spain?.getAttribute("aria-checked")).toBe("true");
    expect(mexico?.getAttribute("aria-checked")).toBe("false");

    await act(async () => {
      (mexico as HTMLButtonElement).click();
    });

    spain = container.querySelector('[role="radio"][value="ESP"]');
    mexico = container.querySelector('[role="radio"][value="MEX"]');

    expect(spain?.getAttribute("aria-checked")).toBe("false");
    expect(mexico?.getAttribute("aria-checked")).toBe("true");
    expect(requestSubmitSpy).toHaveBeenCalled();

    root.unmount();
  });
});

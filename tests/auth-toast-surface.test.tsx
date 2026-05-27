import { beforeEach, describe, expect, it, vi } from "vitest";

const { toastMock } = vi.hoisted(() => ({
  toastMock: {
    dismiss: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

import {
  consumeAuthStatusFromSearchParams,
} from "@/components/auth/AuthToastSurface";

describe("auth toast surface helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a success toast and clears the query param for login success", () => {
    const replace = vi.fn();
    const handledKey = consumeAuthStatusFromSearchParams({
      lastHandledKey: null,
      pathname: "/home",
      replace,
      searchParams: new URLSearchParams("auth_status=login_success"),
    });

    expect(toastMock.dismiss).toHaveBeenCalledTimes(2);
    expect(toastMock.success).toHaveBeenCalledWith("Sesión iniciada");
    expect(replace).toHaveBeenCalledWith("/home");
    expect(handledKey).toBe("/home?auth_status=login_success");
  });

  it("shows a generic credentials error for invalid auth search params", () => {
    const replace = vi.fn();

    consumeAuthStatusFromSearchParams({
      lastHandledKey: null,
      pathname: "/login",
      replace,
      searchParams: new URLSearchParams("auth_status=invalid_credentials"),
    });

    expect(toastMock.error).toHaveBeenCalledWith("Email o contraseña incorrectos");
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("does nothing beyond dismissing pending loaders when there is no auth status", () => {
    const replace = vi.fn();

    const handledKey = consumeAuthStatusFromSearchParams({
      lastHandledKey: null,
      pathname: "/login",
      replace,
      searchParams: new URLSearchParams("group=A"),
    });

    expect(toastMock.dismiss).toHaveBeenCalledTimes(2);
    expect(toastMock.success).not.toHaveBeenCalled();
    expect(toastMock.error).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(handledKey).toBeNull();
  });
});

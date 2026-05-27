import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("@/components/auth/AuthForm", () => ({
  AuthForm: () => <div data-testid="auth-form" />,
}));

vi.mock("@/app/(auth)/login/actions", () => ({
  authenticate: vi.fn(),
}));

import LoginPage from "@/app/(auth)/login/page";

describe("LoginPage", () => {
  it("does not render the legacy inline banner when an old error param is present", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: null,
          },
        }),
      },
    });

    const markup = renderToStaticMarkup(
      await LoginPage({
        searchParams: Promise.resolve({
          error: "Mensaje legacy",
        }),
      }),
    );

    expect(markup).toContain('data-testid="auth-form"');
    expect(markup).not.toContain("Mensaje legacy");
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@tanstack/react-start", () => ({
  useServerFn: () => async () => ({ available: true }),
  createServerFn: () => ({ middleware: () => ({ inputValidator: () => ({ handler: () => async () => null }), inputValidator: () => ({ handler: () => async () => null }), handler: () => async () => null }) }),
  createMiddleware: () => ({ server: () => ({}), client: () => ({}) }),
}));
vi.mock("@/lib/links.functions", () => ({
  createLink: async () => null,
  checkSlug: async () => ({ available: true }),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: any) => <>{children}</>,
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { ShortenForm } from "@/components/shorten-form";

describe("ShortenForm", () => {
  it("renders URL input and submit button", () => {
    render(<ShortenForm />);
    expect(screen.getByLabelText(/paste a long url/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /shorten url/i })).toBeInTheDocument();
  });

  it("shows custom slug + expiry inputs", () => {
    render(<ShortenForm />);
    expect(screen.getByLabelText(/custom slug/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/expires in/i)).toBeInTheDocument();
  });
});

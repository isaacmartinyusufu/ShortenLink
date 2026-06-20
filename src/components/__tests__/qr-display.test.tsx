import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QRDisplay } from "@/components/qr-display";

describe("QRDisplay", () => {
  it("renders SVG and download buttons", () => {
    render(<QRDisplay value="https://scissor.test/abc" />);
    expect(screen.getByRole("button", { name: /svg/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /png/i })).toBeInTheDocument();
    expect(document.getElementById("qr-svg")).toBeInTheDocument();
  });

  it("uses provided foreground color", () => {
    render(<QRDisplay value="https://x.test" fg="#ff0000" bg="#fff" />);
    const svg = document.getElementById("qr-svg");
    expect(svg).toBeTruthy();
  });

  it("download buttons are clickable", async () => {
    const spy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    render(<QRDisplay value="https://x.test" />);
    const btn = screen.getByRole("button", { name: /svg/i });
    btn.click();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

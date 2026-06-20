import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";

describe("AnalyticsDashboard", () => {
  it("shows empty state when no clicks", () => {
    render(<AnalyticsDashboard clicks={[]} />);
    expect(screen.getByText(/no clicks yet/i)).toBeInTheDocument();
  });

  it("renders chart sections with click data", () => {
    const clicks = [
      { created_at: new Date().toISOString(), referrer: "https://twitter.com/x", country: "US", device: "mobile", browser: "Chrome" },
      { created_at: new Date().toISOString(), referrer: null, country: "DE", device: "desktop", browser: "Firefox" },
    ];
    render(<AnalyticsDashboard clicks={clicks} />);
    expect(screen.getByText(/clicks over time/i)).toBeInTheDocument();
    expect(screen.getByText(/top referrers/i)).toBeInTheDocument();
    expect(screen.getByText(/devices/i)).toBeInTheDocument();
    expect(screen.getByText(/countries/i)).toBeInTheDocument();
  });
});

import { describe, it, expect } from "vitest";
import {
  validateUrl,
  validateSlug,
  generateSlug,
  computeExpiry,
  RESERVED_SLUGS,
  shortUrl,
} from "../scissor";

describe("validateUrl", () => {
  it("accepts a normal https URL", () => {
    const r = validateUrl("https://example.com/foo?x=1");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url).toContain("example.com");
  });

  it("prepends https if missing", () => {
    const r = validateUrl("example.com/path");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url.startsWith("https://")).toBe(true);
  });

  it("rejects javascript: and malformed input", () => {
    expect(validateUrl("javascript:alert(1)").ok).toBe(false);
    expect(validateUrl("not a url").ok).toBe(false);
    expect(validateUrl("").ok).toBe(false);
  });

  it("rejects blocked hosts", () => {
    expect(validateUrl("https://bit.ly/abc").ok).toBe(false);
  });
});

describe("validateSlug", () => {
  it("requires 3-50 alphanumeric/hyphen chars", () => {
    expect(validateSlug("ab").ok).toBe(false);
    expect(validateSlug("ab!c").ok).toBe(false);
    expect(validateSlug("hello-world-123").ok).toBe(true);
  });
  it("blocks reserved words", () => {
    for (const r of ["api", "dashboard", "admin"]) {
      expect(validateSlug(r).ok).toBe(false);
      expect(RESERVED_SLUGS.has(r)).toBe(true);
    }
  });
});

describe("generateSlug", () => {
  it("returns 6 alphanumeric chars and is collision-resistant in small batches", () => {
    const set = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const s = generateSlug();
      expect(s).toMatch(/^[a-zA-Z0-9]{6}$/);
      set.add(s);
    }
    expect(set.size).toBeGreaterThan(195);
  });
});

describe("computeExpiry", () => {
  it("returns null for null/0", () => {
    expect(computeExpiry(null)).toBeNull();
    expect(computeExpiry(0)).toBeNull();
  });
  it("returns a future ISO date for positive days", () => {
    const iso = computeExpiry(7)!;
    expect(new Date(iso).getTime()).toBeGreaterThan(Date.now());
  });
});

describe("shortUrl", () => {
  it("composes origin + slug", () => {
    expect(shortUrl("https://sc.io/", "abc")).toBe("https://sc.io/abc");
    expect(shortUrl("https://sc.io", "abc")).toBe("https://sc.io/abc");
  });
});

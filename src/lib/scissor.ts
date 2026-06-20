// Client-safe helpers: URL validation, slug rules, reserved list, formatting.
import { customAlphabet } from "nanoid";

export const RESERVED_SLUGS = new Set([
  "api",
  "auth",
  "dashboard",
  "admin",
  "login",
  "logout",
  "signup",
  "register",
  "reset-password",
  "link",
  "links",
  "settings",
  "account",
  "billing",
  "pricing",
  "about",
  "contact",
  "terms",
  "privacy",
  "docs",
  "help",
  "support",
  "robots.txt",
  "sitemap.xml",
  "favicon.ico",
  "_authenticated",
]);

// Minimal phishing/abuse blocklist; extend as needed.
export const BLOCKED_HOSTS = new Set([
  "bit.ly",
  "tinyurl.com",
  "phishing.example",
]);

export const SLUG_RE = /^[a-zA-Z0-9-]{3,50}$/;

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const _nanoid = customAlphabet(ALPHABET, 6);
export const generateSlug = () => _nanoid();

export type UrlValidation = { ok: true; url: string } | { ok: false; error: string };

export function validateUrl(input: string): UrlValidation {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "Enter a URL" };
  if (trimmed.length > 2048) return { ok: false, error: "URL too long" };
  let url: URL;
  try {
    url = new URL(trimmed.match(/^https?:\/\//i) ? trimmed : `https://${trimmed}`);
  } catch {
    return { ok: false, error: "Not a valid URL" };
  }
  if (!/^https?:$/.test(url.protocol)) return { ok: false, error: "Only http/https links" };
  if (!url.hostname.includes(".")) return { ok: false, error: "Hostname looks invalid" };
  if (BLOCKED_HOSTS.has(url.hostname.toLowerCase())) {
    return { ok: false, error: "This domain is blocked" };
  }
  return { ok: true, url: url.toString() };
}

export type SlugValidation = { ok: true } | { ok: false; error: string };

export function validateSlug(slug: string): SlugValidation {
  if (!slug) return { ok: false, error: "Slug required" };
  if (!SLUG_RE.test(slug)) return { ok: false, error: "3–50 chars: letters, numbers, hyphens" };
  if (RESERVED_SLUGS.has(slug.toLowerCase())) return { ok: false, error: "Reserved word" };
  return { ok: true };
}

export function computeExpiry(days: number | null): string | null {
  if (!days || days <= 0) return null;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function shortUrl(origin: string, slug: string): string {
  return `${origin.replace(/\/$/, "")}/${slug}`;
}

import { createFileRoute } from "@tanstack/react-router";
import { UAParser } from "ua-parser-js";

function expiredPage(slug: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Link expired</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font-family:system-ui,sans-serif;background:#fafaf7;color:#1a1a1a;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
.card{max-width:440px;padding:40px;text-align:center}
h1{font-size:48px;margin:0 0 8px;letter-spacing:-0.02em}
p{color:#666;margin:0 0 24px}
a{color:#e0533d;text-decoration:none;font-weight:600}</style></head>
<body><div class="card"><h1>410</h1><p>The short link <code>/${slug}</code> has expired.</p>
<a href="/">← Create a new one</a></div></body></html>`;
}

function notFoundPage(slug: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Not found</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font-family:system-ui,sans-serif;background:#fafaf7;color:#1a1a1a;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
.card{max-width:440px;padding:40px;text-align:center}
h1{font-size:48px;margin:0 0 8px;letter-spacing:-0.02em}
p{color:#666;margin:0 0 24px}
a{color:#e0533d;text-decoration:none;font-weight:600}</style></head>
<body><div class="card"><h1>404</h1><p>No short link found for <code>/${slug}</code>.</p>
<a href="/">← Shorten a URL</a></div></body></html>`;
}

export const Route = createFileRoute("/$slug")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const slug = params.slug;
        if (!slug || slug.length > 60) {
          return new Response(notFoundPage(slug ?? ""), {
            status: 404,
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: link } = await supabaseAdmin
          .from("links")
          .select("id, original_url, expires_at, expired")
          .eq("slug", slug)
          .maybeSingle();

        if (!link) {
          return new Response(notFoundPage(slug), {
            status: 404,
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }
        const isExpired =
          link.expired || (link.expires_at && new Date(link.expires_at).getTime() < Date.now());
        if (isExpired) {
          if (!link.expired) {
            await supabaseAdmin.from("links").update({ expired: true }).eq("id", link.id);
          }
          return new Response(expiredPage(slug), {
            status: 410,
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }

        try {
          const ua = request.headers.get("user-agent") ?? "";
          const referrer = request.headers.get("referer") ?? null;
          const country =
            request.headers.get("cf-ipcountry") ||
            request.headers.get("x-vercel-ip-country") ||
            null;
          const parser = new UAParser(ua);
          const device = parser.getDevice().type || "desktop";
          const browser = parser.getBrowser().name ?? null;
          const os = parser.getOS().name ?? null;
          await supabaseAdmin.from("clicks").insert({
            link_id: link.id,
            referrer,
            country,
            device,
            browser,
            os,
            user_agent: ua.slice(0, 500),
          });
        } catch (e) {
          console.error("click log failed", e);
        }

        return new Response(null, {
          status: 302,
          headers: { location: link.original_url, "cache-control": "no-store" },
        });
      },
    },
  },
});

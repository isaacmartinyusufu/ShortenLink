import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateSlug, validateSlug, validateUrl } from "./scissor";

const ANON_DAILY_LIMIT = 5;

function clientIp(): string {
  try {
    const req = getRequest();
    const h = req?.headers;
    if (!h) return "unknown";
    return (
      h.get("cf-connecting-ip") ||
      h.get("x-real-ip") ||
      (h.get("x-forwarded-for") || "").split(",")[0].trim() ||
      "unknown"
    );
  } catch {
    return "unknown";
  }
}

const createInput = z.object({
  originalUrl: z.string(),
  customSlug: z.string().optional().nullable(),
  expiresAt: z.string().nullable().optional(),
  qrFg: z.string().optional(),
  qrBg: z.string().optional(),
  qrLevel: z.enum(["L", "M", "Q", "H"]).optional(),
  userId: z.string().nullable().optional(),
});

/** Create a short link. Anonymous allowed (rate-limited by IP). */
export const createLink = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => createInput.parse(d))
  .handler(async ({ data }) => {
    const v = validateUrl(data.originalUrl);
    if (!v.ok) throw new Error(v.error);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ip = clientIp();
    let userId: string | null = null;

    // Try to identify user via bearer if present.
    try {
      const req = getRequest();
      const auth = req?.headers.get("authorization");
      if (auth?.startsWith("Bearer ")) {
        const token = auth.slice(7);
        const { data: claims } = await supabaseAdmin.auth.getUser(token);
        userId = claims.user?.id ?? null;
      }
    } catch {
      // ignore
    }

    if (!userId) {
      // Anonymous rate limit per IP per UTC day.
      const since = new Date();
      since.setUTCHours(0, 0, 0, 0);
      const { count } = await supabaseAdmin
        .from("links")
        .select("id", { count: "exact", head: true })
        .is("user_id", null)
        .eq("created_ip", ip)
        .gte("created_at", since.toISOString());
      if ((count ?? 0) >= ANON_DAILY_LIMIT) {
        throw new Error(`Anonymous limit reached (${ANON_DAILY_LIMIT}/day). Sign in for unlimited.`);
      }
    }

    // Resolve slug (custom or generated, retry on collision).
    let slug = data.customSlug?.trim() || "";
    if (slug) {
      const sv = validateSlug(slug);
      if (!sv.ok) throw new Error(sv.error);
      const { data: exists } = await supabaseAdmin
        .from("links")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (exists) throw new Error("That slug is taken");
    } else {
      for (let i = 0; i < 6; i++) {
        const candidate = generateSlug();
        const { data: exists } = await supabaseAdmin
          .from("links")
          .select("id")
          .eq("slug", candidate)
          .maybeSingle();
        if (!exists) {
          slug = candidate;
          break;
        }
      }
      if (!slug) throw new Error("Could not generate unique slug");
    }

    const { data: row, error } = await supabaseAdmin
      .from("links")
      .insert({
        user_id: userId,
        slug,
        original_url: v.url,
        expires_at: data.expiresAt ?? null,
        qr_fg: data.qrFg ?? "#0a0a0a",
        qr_bg: data.qrBg ?? "#ffffff",
        qr_level: data.qrLevel ?? "M",
        created_ip: ip,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

/** Check slug availability (debounced from UI). */
export const checkSlug = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const v = validateSlug(data.slug);
    if (!v.ok) return { available: false, reason: v.error };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("links")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();
    return row ? { available: false, reason: "Taken" } : { available: true };
  });

/** List the signed-in user's links with click counts. */
export const getMyLinks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("links")
      .select("*, clicks(count)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((l: any) => ({
      ...l,
      click_count: l.clicks?.[0]?.count ?? 0,
    }));
  });

export const getLinkWithAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: link, error } = await context.supabase
      .from("links")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();
    if (error || !link) throw new Error("Not found");
    const { data: clicks } = await context.supabase
      .from("clicks")
      .select("*")
      .eq("link_id", link.id)
      .order("created_at", { ascending: false })
      .limit(1000);
    return { link, clicks: clicks ?? [] };
  });

export const deleteLinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ ids: z.array(z.string()).min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("links")
      .delete()
      .in("id", data.ids)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string(),
        qrFg: z.string().optional(),
        qrBg: z.string().optional(),
        qrLevel: z.enum(["L", "M", "Q", "H"]).optional(),
        expiresAt: z.string().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch: {
      qr_fg?: string;
      qr_bg?: string;
      qr_level?: string;
      expires_at?: string | null;
    } = {};
    if (data.qrFg !== undefined) patch.qr_fg = data.qrFg;
    if (data.qrBg !== undefined) patch.qr_bg = data.qrBg;
    if (data.qrLevel !== undefined) patch.qr_level = data.qrLevel;
    if (data.expiresAt !== undefined) patch.expires_at = data.expiresAt;
    const { error } = await context.supabase
      .from("links")
      .update(patch)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

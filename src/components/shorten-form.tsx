import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link as RLink } from "@tanstack/react-router";
import { Copy, Check, Loader2, Sparkles, Scissors } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { createLink, checkSlug } from "@/lib/links.functions";
import { computeExpiry, shortUrl, validateSlug, validateUrl } from "@/lib/scissor";
import { QRDisplay } from "./qr-display";

type Created = {
  id: string;
  slug: string;
  original_url: string;
};

export function ShortenForm() {
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [expiryDays, setExpiryDays] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [slugStatus, setSlugStatus] = useState<
    { state: "idle" } | { state: "checking" } | { state: "ok" } | { state: "err"; msg: string }
  >({ state: "idle" });
  const [result, setResult] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);

  const createFn = useServerFn(createLink);
  const checkFn = useServerFn(checkSlug);
  const [origin, setOrigin] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  useEffect(() => {
    if (!slug) return setSlugStatus({ state: "idle" });
    const v = validateSlug(slug);
    if (!v.ok) return setSlugStatus({ state: "err", msg: v.error });
    setSlugStatus({ state: "checking" });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await checkFn({ data: { slug } });
        setSlugStatus(
          res.available ? { state: "ok" } : { state: "err", msg: res.reason ?? "Taken" },
        );
      } catch {
        setSlugStatus({ state: "idle" });
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [slug, checkFn]);

  const urlValid = useMemo(() => validateUrl(url), [url]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!urlValid.ok) return toast.error(urlValid.error);
    if (slug && slugStatus.state === "err") return toast.error(slugStatus.msg);
    setSubmitting(true);
    try {
      const days = expiryDays ? parseInt(expiryDays, 10) : null;
      const res = await createFn({
        data: {
          originalUrl: url,
          customSlug: slug || null,
          expiresAt: computeExpiry(days),
        },
      });
      setResult(res as Created);
      toast.success("Short link ready!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to shorten");
    } finally {
      setSubmitting(false);
    }
  }

  function copy() {
    if (!result) return;
    navigator.clipboard.writeText(shortUrl(origin, result.slug));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function reset() {
    setUrl("");
    setSlug("");
    setExpiryDays("");
    setResult(null);
  }

  if (result) {
    const short = shortUrl(origin, result.slug);
    return (
      <Card className="p-6 md:p-8 shadow-card">
        <div className="flex items-center gap-2 text-sm font-medium text-success mb-4">
          <Sparkles className="w-4 h-4" /> Your link is live
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-4 min-w-0">
            <div className="font-mono text-xl md:text-2xl break-all">{short}</div>
            <div className="text-sm text-muted-foreground break-all">→ {result.original_url}</div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={copy} variant="default">
                {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? "Copied" : "Copy link"}
              </Button>
              <Button onClick={reset} variant="outline">
                Shorten another
              </Button>
              <Button asChild variant="ghost">
                <RLink to="/dashboard">View analytics →</RLink>
              </Button>
            </div>
          </div>
          <QRDisplay value={short} fg="#0a0a0a" bg="#ffffff" level="M" size={156} />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 md:p-8 shadow-card">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="url">Paste a long URL</Label>
          <Input
            id="url"
            placeholder="https://example.com/very/long/path?with=params"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-12 text-base"
            autoFocus
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="slug">Custom slug (optional)</Label>
            <div className="flex items-center rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring overflow-hidden">
              <span className="text-sm text-muted-foreground pl-3 select-none whitespace-nowrap">
                {origin.replace(/^https?:\/\//, "")}/
              </span>
              <Input
                id="slug"
                placeholder="my-brand"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="border-0 focus-visible:ring-0 shadow-none h-10"
              />
            </div>
            <p className="text-xs h-4">
              {slugStatus.state === "checking" && (
                <span className="text-muted-foreground">Checking…</span>
              )}
              {slugStatus.state === "ok" && <span className="text-success">Available</span>}
              {slugStatus.state === "err" && (
                <span className="text-destructive">{slugStatus.msg}</span>
              )}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="exp">Expires in (days, optional)</Label>
            <Input
              id="exp"
              type="number"
              min={1}
              max={3650}
              placeholder="e.g. 30"
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              className="h-10"
            />
          </div>
        </div>
        <Button type="submit" disabled={submitting} className="w-full h-12 text-base">
          {submitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Scissors className="w-4 h-4 mr-2" />
          )}
          Shorten URL
        </Button>
      </form>
    </Card>
  );
}

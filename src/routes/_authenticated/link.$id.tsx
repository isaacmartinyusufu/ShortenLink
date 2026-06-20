import { createFileRoute, Link as RLink } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QRDisplay } from "@/components/qr-display";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { getLinkWithAnalytics } from "@/lib/links.functions";
import { shortUrl } from "@/lib/scissor";

export const Route = createFileRoute("/_authenticated/link/$id")({
  head: () => ({ meta: [{ title: "Link analytics — Scissor" }] }),
  component: LinkDetail,
});

function LinkDetail() {
  const { id } = Route.useParams();
  const fetchFn = useServerFn(getLinkWithAnalytics);
  const { data, isLoading } = useQuery({
    queryKey: ["link", id],
    queryFn: () => fetchFn({ data: { id } }),
    refetchInterval: 10_000,
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <Button asChild variant="ghost" size="sm">
          <RLink to="/dashboard">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </RLink>
        </Button>

        {isLoading || !data ? (
          <Card className="p-10 text-muted-foreground">Loading…</Card>
        ) : (
          <>
            <Card className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      data.link.expired
                        ? "bg-muted text-muted-foreground"
                        : "bg-success text-success-foreground hover:bg-success"
                    }
                  >
                    {data.link.expired ? "Expired" : "Active"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {data.clicks.length} click{data.clicks.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="font-mono text-2xl md:text-3xl break-all">
                  {shortUrl(origin, data.link.slug)}
                </div>
                <div className="text-sm text-muted-foreground break-all">→ {data.link.original_url}</div>
                {data.link.expires_at && (
                  <div className="text-xs text-muted-foreground">
                    Expires {new Date(data.link.expires_at).toLocaleString()}
                  </div>
                )}
              </div>
              <QRDisplay
                value={shortUrl(origin, data.link.slug)}
                fg={data.link.qr_fg}
                bg={data.link.qr_bg}
                level={data.link.qr_level as "L" | "M" | "Q" | "H"}
                size={180}
              />
            </Card>

            <AnalyticsDashboard clicks={data.clicks} />
          </>
        )}
      </main>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { ShortenForm } from "@/components/shorten-form";
import { LinksTable } from "@/components/links-table";
import { getMyLinks } from "@/lib/links.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Scissor" }] }),
  component: Dashboard,
});

function Dashboard() {
  const fetchLinks = useServerFn(getMyLinks);
  const { data: links } = useQuery({
    queryKey: ["my-links"],
    queryFn: () => fetchLinks(),
    refetchInterval: 15_000,
  });

  const total = links?.length ?? 0;
  const clicks = links?.reduce((a, l: any) => a + (l.click_count ?? 0), 0) ?? 0;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Your links</h1>
            <p className="text-muted-foreground mt-1">
              {total} link{total === 1 ? "" : "s"} · {clicks} click{clicks === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <ShortenForm />

        <LinksTable links={(links ?? []) as any} />
      </main>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Zap, BarChart3, QrCode, Shield } from "lucide-react";
import { Header } from "@/components/header";
import { ShortenForm } from "@/components/shorten-form";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Scissor — Short links, QR codes, and click analytics" },
      {
        name: "description",
        content:
          "Paste a long URL, get a short one in under a second. Branded slugs, QR codes, and live click analytics.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none [mask-image:radial-gradient(circle_at_center,black_30%,transparent_75%)]" />
          <div className="relative mx-auto max-w-3xl px-6 py-16 md:py-24 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Real-time click analytics
            </div>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">
              Short links that <span className="gradient-text">cut through</span> the noise.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Paste a URL, get a branded short link in under a second — with QR codes and analytics built in.
            </p>
          </div>
          <div className="relative mx-auto max-w-3xl px-6 pb-20">
            <ShortenForm />
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-16 grid md:grid-cols-4 gap-6">
          <Feature icon={Zap} title="Sub-second" body="Edge-rendered redirects keep links fast worldwide." />
          <Feature icon={QrCode} title="QR codes" body="Download SVG or PNG, customize colors and error level." />
          <Feature icon={BarChart3} title="Live analytics" body="Clicks, devices, referrers, countries — in real time." />
          <Feature icon={Shield} title="Branded slugs" body="Pick your own slug or let nanoid generate one." />
        </section>
      </main>
      <footer className="border-t mt-8">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground flex items-center justify-between">
          <span>© {new Date().getFullYear()} Scissor</span>
          <span>Made for fast links.</span>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Zap;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary grid place-items-center mb-3">
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{body}</p>
    </div>
  );
}

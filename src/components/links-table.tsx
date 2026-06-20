import { useMemo, useState } from "react";
import { Link as RLink } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, Trash2, BarChart3, Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { deleteLinks } from "@/lib/links.functions";
import { shortUrl } from "@/lib/scissor";

type Row = {
  id: string;
  slug: string;
  original_url: string;
  expires_at: string | null;
  expired: boolean;
  created_at: string;
  click_count: number;
};

export function LinksTable({ links }: { links: Row[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "expired">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const del = useServerFn(deleteLinks);
  const qc = useQueryClient();
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const filtered = useMemo(() => {
    return links.filter((l) => {
      if (status === "active" && (l.expired || isPastExpiry(l.expires_at))) return false;
      if (status === "expired" && !(l.expired || isPastExpiry(l.expires_at))) return false;
      if (!q) return true;
      const t = q.toLowerCase();
      return l.slug.toLowerCase().includes(t) || l.original_url.toLowerCase().includes(t);
    });
  }, [links, q, status]);

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function bulkDelete() {
    const ids = Array.from(selected);
    if (!ids.length) return;
    try {
      await del({ data: { ids } });
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["my-links"] });
      toast.success(`Deleted ${ids.length} link${ids.length > 1 ? "s" : ""}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  function copy(slug: string, id: string) {
    navigator.clipboard.writeText(shortUrl(origin, slug));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  }

  return (
    <Card className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search links…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "expired"] as const).map((s) => (
            <Button
              key={s}
              variant={status === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatus(s)}
              className="capitalize"
            >
              {s}
            </Button>
          ))}
          {selected.size > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-1" /> Delete ({selected.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {selected.size} link(s)?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This cannot be undone. Click analytics will also be removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={bulkDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground border-b">
            <tr>
              <th className="w-8 py-2"></th>
              <th className="py-2 pr-3">Short</th>
              <th className="py-2 pr-3">Destination</th>
              <th className="py-2 pr-3 text-right">Clicks</th>
              <th className="py-2 pr-3">Created</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-muted-foreground">
                  No links match.
                </td>
              </tr>
            )}
            {filtered.map((l) => {
              const expired = l.expired || isPastExpiry(l.expires_at);
              return (
                <tr key={l.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="py-3">
                    <Checkbox
                      checked={selected.has(l.id)}
                      onCheckedChange={() => toggle(l.id)}
                      aria-label="Select"
                    />
                  </td>
                  <td className="py-3 pr-3 font-mono">
                    <a href={`/${l.slug}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      /{l.slug}
                    </a>
                  </td>
                  <td className="py-3 pr-3 max-w-xs truncate text-muted-foreground" title={l.original_url}>
                    {l.original_url}
                  </td>
                  <td className="py-3 pr-3 text-right font-medium">{l.click_count}</td>
                  <td className="py-3 pr-3 text-muted-foreground">
                    {new Date(l.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 pr-3">
                    {expired ? (
                      <Badge variant="secondary">Expired</Badge>
                    ) : (
                      <Badge className="bg-success text-success-foreground hover:bg-success">Active</Badge>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => copy(l.slug, l.id)} aria-label="Copy">
                        {copiedId === l.id ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button asChild variant="ghost" size="icon" aria-label="Analytics">
                        <RLink to="/link/$id" params={{ id: l.id }}>
                          <BarChart3 className="w-4 h-4" />
                        </RLink>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function isPastExpiry(d: string | null) {
  return d ? new Date(d).getTime() < Date.now() : false;
}

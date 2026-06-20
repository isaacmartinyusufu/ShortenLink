import { Link, useRouter } from "@tanstack/react-router";
import { Scissors, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export function Header() {
  const { user } = useAuth();
  const router = useRouter();
  return (
    <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
            <Scissors className="w-4 h-4" />
          </span>
          <span>Scissor</span>
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.navigate({ to: "/" });
                }}
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Get started
                </Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

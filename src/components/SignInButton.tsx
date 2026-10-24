import { useState } from "react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";

export function SignInButton({ redirect = "/sessions" }: { redirect?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="signal"
      size="lg"
      disabled={busy}
      className="h-12 w-full text-base sm:w-auto"
      onClick={async () => {
        setBusy(true);
        const safe = redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/sessions";
        sessionStorage.setItem("post-auth-redirect", safe);
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin + "/auth",
        });
        if (result.error) {
          toast.error("Sign-in failed. Please try again.");
          setBusy(false);
          return;
        }
        if (result.redirected) return;
        window.location.assign(safe);
      }}
    >
      Continue with Google
    </Button>
  );
}

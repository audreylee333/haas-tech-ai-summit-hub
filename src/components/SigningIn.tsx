import wordmarkAsset from "@/assets/wordmark.png.asset.json";

const RETURNING_KEY = "auth-returning";
const SIGNING_OUT_KEY = "auth-signing-out";
const WINDOW_MS = 15000;

/** True when this page load is a return from Google sign-in (flag set by an early script in the root head). */
export function hasAuthReturnInUrl() {
  if (typeof window === "undefined") return false;
  const { hash, search } = window.location;
  if (/access_token=|refresh_token=/.test(hash) || /[?&]code=/.test(search)) return true;
  const at = Number(sessionStorage.getItem(RETURNING_KEY) ?? 0);
  sessionStorage.removeItem(RETURNING_KEY);
  return Date.now() - at < WINDOW_MS;
}

// Cached so repeated reads in one page load agree (React can mount effects twice).
let signingOutSeen: boolean | null = null;

/** Remember that the visitor just clicked Sign out, so the transition screen can say so. */
export function markSigningOut() {
  signingOutSeen = true;
  if (typeof window !== "undefined") sessionStorage.setItem(SIGNING_OUT_KEY, String(Date.now()));
}

/** True while this visitor is finishing a sign-out they started. */
export function isSigningOut() {
  if (typeof window === "undefined") return false;
  if (signingOutSeen !== null) return signingOutSeen;
  const at = Number(sessionStorage.getItem(SIGNING_OUT_KEY) ?? 0);
  signingOutSeen = at > 0 && Date.now() - at < WINDOW_MS;
  return signingOutSeen;
}

/** Forget the sign-out once the sign-in form is on screen. */
export function clearSigningOut() {
  signingOutSeen = null;
  if (typeof window !== "undefined") sessionStorage.removeItem(SIGNING_OUT_KEY);
}

export function SigningIn({ message = "Signing you in…" }: { message?: string }) {
  return (
    <main
      className="dotgrid mx-auto flex min-h-screen max-w-md flex-col items-start justify-center px-6"
      aria-busy="true"
    >
      <img src={wordmarkAsset.url} alt="Where Intelligence Goes Next" className="w-full max-w-[15rem]" />
      <p className="eyebrow mt-7 text-signal">Haas Tech & AI Summit 2026</p>
      <h1 className="display mt-3 text-4xl">{message}</h1>
      <span className="mt-4 block h-1 w-16 animate-pulse bg-signal" aria-hidden="true" />
    </main>
  );
}

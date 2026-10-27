import wordmarkAsset from "@/assets/wordmark.png.asset.json";

/** True when this page load is a return from Google sign-in (flag set by an early script in the root head). */
export function hasAuthReturnInUrl() {
  if (typeof window === "undefined") return false;
  const { hash, search } = window.location;
  if (/access_token=|refresh_token=/.test(hash) || /[?&]code=/.test(search)) return true;
  const at = Number(sessionStorage.getItem("auth-returning") ?? 0);
  sessionStorage.removeItem("auth-returning");
  return Date.now() - at < 15000;
}

export function SigningIn() {
  return (
    <main
      className="dotgrid mx-auto flex min-h-screen max-w-md flex-col items-start justify-center px-6"
      aria-busy="true"
    >
      <img src={wordmarkAsset.url} alt="Where Intelligence Goes Next" className="w-full max-w-[15rem]" />
      <p className="eyebrow mt-7 text-signal">Haas Tech & AI Summit 2026</p>
      <h1 className="display mt-3 text-4xl">Signing you in…</h1>
      <span className="mt-4 block h-1 w-16 animate-pulse bg-signal" aria-hidden="true" />
    </main>
  );
}

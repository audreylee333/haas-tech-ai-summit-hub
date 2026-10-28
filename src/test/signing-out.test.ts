import { beforeEach, describe, expect, it } from "vitest";
import { clearSigningOut, isSigningOut, markSigningOut } from "@/components/SigningIn";

describe("sign-out transition flag", () => {
  beforeEach(() => {
    clearSigningOut();
  });

  it("is off until someone clicks Sign out", () => {
    expect(isSigningOut()).toBe(false);
  });

  it("turns on after Sign out and survives a re-read", () => {
    markSigningOut();
    expect(isSigningOut()).toBe(true);
    expect(isSigningOut()).toBe(true);
  });

  it("turns off once the sign-in form is shown", () => {
    markSigningOut();
    clearSigningOut();
    expect(isSigningOut()).toBe(false);
    expect(sessionStorage.getItem("auth-signing-out")).toBe(null);
  });

  it("ignores a stale flag from more than 15s ago", () => {
    clearSigningOut();
    sessionStorage.setItem("auth-signing-out", String(Date.now() - 20000));
    expect(isSigningOut()).toBe(false);
  });
});

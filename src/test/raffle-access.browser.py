"""Raffle access regression check.

Usage: python raffle-access.browser.py <admin|attendee>

Run signed in as a moderator for the admin role, and as a plain attendee for the
attendee role. The database is the authorization authority, so this checks the
security-definer functions directly rather than what the screens happen to show.
"""
import asyncio
import json
import os
import sys
from pathlib import Path
from playwright.async_api import async_playwright

ROLE = sys.argv[1]


async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()
        if os.environ.get("LOVABLE_BROWSER_AUTH_STATUS") == "injected":
            storage_key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
            session_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
            cookies = json.loads(os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON") or "[]")
        else:
            with open(os.path.expanduser("~/.cache/lovable-auth/session.json")) as file:
                minted = json.load(file)
            storage_key = minted["storage_key"]
            session_json = json.dumps(minted["session"])
            cookies = minted.get("cookies") or []
        if cookies:
            await context.add_cookies([{**cookie, "url": "http://localhost:8080"} for cookie in cookies])
        await page.goto("http://localhost:8080")
        await page.evaluate("([k,v]) => window.localStorage.setItem(k,v)", [storage_key, session_json])

        await page.goto("http://localhost:8080/sessions", wait_until="domcontentloaded")
        await page.wait_for_timeout(1500)

        results = await page.evaluate("""async () => {
            const { supabase } = await import('/src/integrations/supabase/client.ts');
            const out = {};
            for (const fn of ['raffle_leaderboard', 'draw_raffle_winner']) {
                const r = await supabase.rpc(fn);
                out[fn] = { error: r.error ? String(r.error.message) : null, rows: Array.isArray(r.data) ? r.data.length : null };
            }
            return out;
        }""")
        print("rpc results:", json.dumps(results))

        leaderboard = results["raffle_leaderboard"]
        draw = results["draw_raffle_winner"]

        if ROLE == "attendee":
            assert leaderboard["error"] and "Forbidden" in leaderboard["error"], \
                "Attendees must not read the raffle leaderboard"
            assert draw["error"] and "Forbidden" in draw["error"], \
                "Attendees must not be able to draw a winner"
            assert draw["rows"] is None, "A rejected draw must not return a winner"
            print("PASS: attendees cannot read the leaderboard or draw a winner")
        else:
            assert leaderboard["error"] is None, "Moderators must be able to read the leaderboard"
            assert leaderboard["rows"] is not None, "The leaderboard must return a list"
            print(f"PASS: moderators read the leaderboard ({leaderboard['rows']} attendees)")

        screenshots = Path("/tmp/browser/raffle-access")
        screenshots.mkdir(parents=True, exist_ok=True)
        await page.screenshot(path=str(screenshots / f"{ROLE}.png"))
        await browser.close()


asyncio.run(main())

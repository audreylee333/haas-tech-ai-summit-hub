"""Authenticated upvote regression check. Pass a session path containing other attendees' questions."""
import asyncio
import json
import os
import sys
from pathlib import Path
from playwright.async_api import async_playwright


async def main():
    session_path = sys.argv[1]
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
        await page.goto(f"http://localhost:8080{session_path}")
        vote = page.locator('button[aria-label="Upvote"]:not([disabled])').first
        await vote.wait_for()
        question = vote.locator("xpath=..")
        original_count = int((await vote.inner_text()).split()[-1])
        question_text = await question.locator("p").first.inner_text()
        async with page.expect_response(lambda response: "/rest/v1/question_votes" in response.url and response.request.method == "POST") as response:
            await vote.click()
        assert (await response.value).status == 201, "Another attendee's question must accept an upvote"
        voted_question = page.get_by_role("listitem").filter(has=page.get_by_text(question_text, exact=True))
        remove = voted_question.get_by_role("button", name="Remove upvote", exact=True)
        await remove.wait_for()
        assert int((await remove.inner_text()).split()[-1]) == original_count + 1
        await page.reload()
        await remove.wait_for()
        assert int((await remove.inner_text()).split()[-1]) == original_count + 1, "Vote must persist after reload"
        screenshots = Path("/tmp/browser/upvotes")
        screenshots.mkdir(parents=True, exist_ok=True)
        await voted_question.screenshot(path=str(screenshots / "vote-added.png"))
        async with page.expect_response(lambda response: "/rest/v1/question_votes" in response.url and response.request.method == "DELETE") as response:
            await remove.click()
        assert (await response.value).status == 204
        restored = voted_question.get_by_role("button", name="Upvote", exact=True)
        await restored.wait_for()
        assert int((await restored.inner_text()).split()[-1]) == original_count, "Removing a vote must restore the count"
        await voted_question.screenshot(path=str(screenshots / "vote-removed.png"))
        own_buttons = page.locator('button[aria-label="Upvote"][disabled]')
        assert await own_buttons.count() > 0, "Use an account with its own question to test self-vote protection"
        self_vote_status = await page.evaluate("""async (sessionId) => {
            const { supabase } = await import('/src/integrations/supabase/client.ts');
            const { data: { user } } = await supabase.auth.getUser();
            const { data: questions, error } = await supabase.from('questions').select('id,user_id').eq('session_id', sessionId);
            if (error || !user || !questions?.length) throw new Error('Missing own question fixture');
            if (questions.some(q => q.user_id !== user.id)) throw new Error('Private question rows exposed');
            const result = await supabase.from('question_votes').insert({question_id: questions[0].id, user_id: user.id});
            return result.status;
        }""", session_path.rsplit("/", 1)[-1])
        assert self_vote_status == 403, "Self-votes must be rejected by the database, not just disabled in the UI"
        print("PASS: attendee upvote, persistence, removal, self-vote rejection, and question privacy")
        await page.locator("header").screenshot(path="/tmp/browser/upvotes/header.png")
        await page.get_by_role("button", name="Sign out", exact=True).click()
        await page.wait_for_url("**/auth*")
        await page.get_by_role("heading", name="Sign in to get started.", exact=True).wait_for()
        print("PASS: rounded Sign out button returns to sign-in")
        await browser.close()


asyncio.run(main())
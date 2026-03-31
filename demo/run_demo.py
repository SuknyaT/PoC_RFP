"""
RFP Proposal AI - Automated Video Demo with English Voice Narration
"""

import asyncio
import json
import os
import subprocess
import time
import urllib.request
from pathlib import Path

import edge_tts
from playwright.async_api import async_playwright

# ─── CONFIG ───────────────────────────────────────────────────────
APP_URL = "http://localhost:5180"
API_URL = "http://localhost:3001/api"
DEMO_EMAIL = "demo@rfpai.com"
DEMO_PASSWORD = "demo123456"
OUTPUT_DIR = Path(__file__).parent / "output"
AUDIO_DIR = OUTPUT_DIR / "audio_clips"
VIDEO_DIR = OUTPUT_DIR / "video"
FINAL_OUTPUT = OUTPUT_DIR / "RFP_Proposal_AI_Demo.mp4"

TTS_VOICE = "en-US-JennyNeural"
TTS_RATE = "-2%"
TTS_PITCH = "+2Hz"

VIEWPORT = {"width": 1440, "height": 900}
DEVICE_SCALE_FACTOR = 1

# ─── NARRATION ────────────────────────────────────────────────────
NARRATION_STEPS = [
    {
        "id": "intro",
        "text": (
            "Hey there! Welcome to the RFP Proposal AI demo. "
            "This tool helps businesses create winning proposals for Requests for Proposals "
            "using AI to analyze scoring, assess competitors, and generate bid documents. "
            "Let me show you how it works!"
        ),
    },
    {
        "id": "login",
        "text": (
            "Here's our login page with role-based access. "
            "Let me sign in with the demo manager account."
        ),
    },
    {
        "id": "dashboard",
        "text": (
            "This is the Dashboard. "
            "Key metrics at a glance — total RFPs, proposals generated, "
            "win rate, and active RFPs. "
            "The pipeline chart shows RFP workflow status."
        ),
    },
    {
        "id": "rfp_list",
        "text": (
            "The RFP Management page lists all uploaded RFPs. "
            "We have three active RFPs — airport advertising, metro construction, "
            "and warehouse logistics. Each shows client, industry, value, and status."
        ),
    },
    {
        "id": "rfp_detail_top",
        "text": (
            "Let's open the Cochin Airport RFP worth 10 million dollars. "
            "The AI has parsed the document and extracted key details — "
            "project scope, deadline, contract duration, and location. "
            "On the right sidebar, you can see the linked competitors "
            "with their threat levels and predicted strategies."
        ),
    },
    {
        "id": "rfp_scoring_criteria",
        "text": (
            "Scrolling down to the scoring criteria table. "
            "The AI has analyzed each criterion — financial offer, experience, "
            "approach, innovation — and generated strategies to maximize our score."
        ),
    },
    {
        "id": "generate_proposal_explain",
        "text": (
            "Now let me tell you about the Generate Proposal feature. "
            "On the right sidebar, you can see previously generated proposals. "
            "When users click the Generate Proposal button, "
            "the AI takes all the RFP details, scoring criteria, "
            "competitor analysis, and historical winning bid data, "
            "and creates a complete, optimized proposal in about 30 to 60 seconds. "
            "Each time you generate, it creates a new version, "
            "so you can compare and pick the best one. "
            "Let's open the proposal that was already generated."
        ),
    },
    {
        "id": "proposal_overview",
        "text": (
            "Here's the generated proposal! "
            "The Overview tab shows the AI's recommended revenue model — "
            "Minimum Annual Guarantee, Revenue Share percentage, "
            "Annual Escalation, and a predicted score of 92 out of 100. "
            "Below is the rationale explaining this financial model."
        ),
    },
    {
        "id": "proposal_sections_checklist",
        "text": (
            "Scrolling down, all 13 proposal sections are listed with green checkmarks — "
            "every section was generated successfully by the AI."
        ),
    },
    {
        "id": "proposal_sections_edit",
        "text": (
            "Switching to the Proposal Sections tab, here's all the editable content. "
            "Executive Summary, Company Overview, Experience and Track Record, "
            "Technical Approach, Project Timeline, Team Structure, "
            "Financial Proposal, Cost Overview. "
            "Let me scroll through to show you all of them."
        ),
    },
    {
        "id": "proposal_sections_scroll",
        "text": (
            "Continuing with Risk Mitigation, Value Proposition, "
            "Competitive Advantages, Compliance Statement, "
            "and Terms and Conditions. "
            "Every section is fully editable so the team can refine the AI's content "
            "before finalizing the proposal."
        ),
    },
    {
        "id": "proposal_financials",
        "text": (
            "The Financial Projections tab gives a year-by-year breakdown. "
            "Guaranteed amounts, projected revenue, profit share, "
            "and total to client for each contract year. "
            "The totals row sums up the entire contract value."
        ),
    },
    {
        "id": "proposal_scoring",
        "text": (
            "The Scoring Strategy tab shows how the AI expects us to score "
            "against each RFP criterion. "
            "Each has a progress bar and justification. "
            "Easy to spot areas for improvement before submission."
        ),
    },
    {
        "id": "download_pdf",
        "text": (
            "When you're happy with the proposal, you can download it as a "
            "professionally formatted PDF — with a branded cover page, "
            "table of contents, all 15 sections, financial tables, "
            "and scoring breakdown. Ready to share with the client. "
            "Let me click the download button."
        ),
    },
    {
        "id": "competitors_page",
        "text": (
            "The Competitors page manages competitor intelligence — "
            "industry focus, strengths, weaknesses, and bidding style. "
            "This feeds into the AI when generating proposals."
        ),
    },
    {
        "id": "historical_page",
        "text": (
            "Historical Bids stores past bid data — "
            "outcomes, financial terms, and lessons learned. "
            "The AI uses this to improve future proposals."
        ),
    },
    {
        "id": "conclusion",
        "text": (
            "And that's the RFP Proposal AI system! "
            "End-to-end support from document parsing, competitor analysis, "
            "AI proposal generation, scoring optimization, "
            "to professional PDF export. Thanks for watching!"
        ),
    },
]


# ─── AUDIO ────────────────────────────────────────────────────────
async def generate_audio_clips():
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    durations = {}
    for step in NARRATION_STEPS:
        ap = AUDIO_DIR / f"{step['id']}.mp3"
        if ap.exists():
            print(f"  [skip] {step['id']}.mp3")
        else:
            print(f"  [tts]  Generating {step['id']}.mp3 ...")
            c = edge_tts.Communicate(step["text"], TTS_VOICE, rate=TTS_RATE, pitch=TTS_PITCH)
            await c.save(str(ap))
        d = get_audio_duration(str(ap))
        durations[step["id"]] = d
        print(f"         {d:.1f}s")
    return durations


def get_ffmpeg_path():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return "ffmpeg"


def get_audio_duration(path: str) -> float:
    ffmpeg = get_ffmpeg_path()
    r = subprocess.run([ffmpeg, "-i", path, "-f", "null", "-"],
                       capture_output=True, text=True, timeout=10)
    for line in r.stderr.split("\n"):
        if "Duration:" in line:
            p = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = p.split(":")
            return float(h) * 3600 + float(m) * 60 + float(s)
    return 5.0


# ─── HELPERS ──────────────────────────────────────────────────────
async def scroll_to(page, positions, duration):
    if not positions or duration <= 0:
        await asyncio.sleep(max(duration, 0))
        return
    per = duration / len(positions)
    for y in positions:
        await page.evaluate(f"window.scrollTo({{ top: {y}, behavior: 'smooth' }})")
        await asyncio.sleep(per)


async def wait_done(sid, s, dur):
    remaining = dur.get(sid, 5.0) - (time.time() - s) + 1.0
    if remaining > 0:
        await asyncio.sleep(remaining)


async def ensure(page, sel, timeout=12000):
    try:
        await page.wait_for_selector(sel, timeout=timeout)
        return True
    except Exception:
        return False


# ─── PRE-FLIGHT ───────────────────────────────────────────────────
def preflight():
    def api(path, token=None, method="GET", body=None):
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        data = json.dumps(body).encode() if body else None
        req = urllib.request.Request(f"{API_URL}{path}", data=data, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())

    auth = api("/auth/login", method="POST", body={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    token = auth["token"]
    rfps = api("/rfps", token=token)
    rfp = next((r for r in rfps if "Cochin" in r.get("title", "")), rfps[0])
    rfp_id = rfp["id"]
    proposals = api(f"/rfps/{rfp_id}/proposals", token=token)
    proposal_id = proposals[0]["id"] if proposals else None

    print(f"  RFP: {rfp['title'][:50]}...")
    print(f"  Proposal: {'v' + str(proposals[0]['version']) if proposals else 'NONE'}")
    return rfp_id, proposal_id, token


# ─── BROWSER DEMO ────────────────────────────────────────────────
async def run_browser_demo(dur: dict, rfp_id: str, proposal_id: str | None, token: str):
    VIDEO_DIR.mkdir(parents=True, exist_ok=True)
    timestamps = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            viewport=VIEWPORT,
            device_scale_factor=DEVICE_SCALE_FACTOR,
            record_video_dir=str(VIDEO_DIR),
            record_video_size=VIEWPORT,
        )
        page = await context.new_page()
        t0 = time.time()

        def mark(sid):
            elapsed = time.time() - t0
            timestamps.append({"step_id": sid, "start_time": elapsed})
            print(f"  [{elapsed:6.1f}s] >>> {sid}")

        # ═══════════════════════════════════════════
        # INTRO
        # ═══════════════════════════════════════════
        mark("intro")
        s = time.time()
        await page.goto(APP_URL, wait_until="networkidle")
        await wait_done("intro", s, dur)

        # ═══════════════════════════════════════════
        # LOGIN
        # ═══════════════════════════════════════════
        mark("login")
        s = time.time()
        await asyncio.sleep(1)
        await page.fill('input[type="email"]', "")
        await page.type('input[type="email"]', DEMO_EMAIL, delay=40)
        await asyncio.sleep(0.5)
        await page.type('input[type="password"]', DEMO_PASSWORD, delay=40)
        await asyncio.sleep(0.8)
        await page.click('button[type="submit"]')
        await page.wait_for_selector('text=Dashboard', timeout=15000)
        await wait_done("login", s, dur)

        # ═══════════════════════════════════════════
        # DASHBOARD
        # ═══════════════════════════════════════════
        mark("dashboard")
        s = time.time()
        await asyncio.sleep(1.5)
        d = dur.get("dashboard", 10)
        await scroll_to(page, [0, 200, 400, 200, 0], d - 2)
        await wait_done("dashboard", s, dur)

        # ═══════════════════════════════════════════
        # RFP LIST
        # ═══════════════════════════════════════════
        mark("rfp_list")
        s = time.time()
        await page.goto(f"{APP_URL}/rfps", wait_until="networkidle")
        found = await ensure(page, f'a[href="/rfps/{rfp_id}"]', timeout=15000)
        if not found:
            await ensure(page, 'a[href*="/rfps/"]', timeout=10000)
        await asyncio.sleep(2)
        d = dur.get("rfp_list", 12)
        await scroll_to(page, [0, 150, 300, 150, 0], d - 3)
        await wait_done("rfp_list", s, dur)

        # ═══════════════════════════════════════════
        # RFP DETAIL — top (details + sidebar with competitors)
        # ═══════════════════════════════════════════
        mark("rfp_detail_top")
        s = time.time()
        await page.goto(f"{APP_URL}/rfps/{rfp_id}", wait_until="networkidle")
        await ensure(page, 'text=Cochin', timeout=10000)
        await asyncio.sleep(2)
        d = dur.get("rfp_detail_top", 12)
        # Stay near top so details + competitor sidebar are both visible
        await scroll_to(page, [0, 50, 120, 80, 30, 0], d - 2)
        await wait_done("rfp_detail_top", s, dur)

        # ═══════════════════════════════════════════
        # RFP SCORING CRITERIA
        # ═══════════════════════════════════════════
        mark("rfp_scoring_criteria")
        s = time.time()
        d = dur.get("rfp_scoring_criteria", 10)
        await scroll_to(page, [200, 400, 600, 800, 600, 400], d - 0.5)
        await wait_done("rfp_scoring_criteria", s, dur)

        # ═══════════════════════════════════════════
        # GENERATE PROPOSAL EXPLANATION
        # Scroll back up to show the Proposals sidebar + explain the feature
        # ═══════════════════════════════════════════
        mark("generate_proposal_explain")
        s = time.time()
        # Scroll back to top to show the sidebar with proposals and generate button area
        await page.evaluate("window.scrollTo({ top: 0, behavior: 'smooth' })")
        await asyncio.sleep(2)
        d = dur.get("generate_proposal_explain", 20)
        # Slowly pan between top area (buttons) and sidebar (proposals list)
        await scroll_to(page, [0, 80, 160, 80, 0, 50, 0], d - 4)
        # At the end, click on the existing proposal to navigate to it
        proposal_btn = await page.query_selector(f'button:has-text("Version")')
        if proposal_btn:
            await asyncio.sleep(1)
            await proposal_btn.click()
            await asyncio.sleep(2)
        else:
            # Direct navigate
            await page.goto(
                f"{APP_URL}/rfps/{rfp_id}/proposals/{proposal_id}",
                wait_until="networkidle",
            )
            await asyncio.sleep(2)
        await wait_done("generate_proposal_explain", s, dur)

        # ═══════════════════════════════════════════
        # PROPOSAL OVERVIEW
        # ═══════════════════════════════════════════
        mark("proposal_overview")
        s = time.time()
        await ensure(page, 'text=Overview', timeout=10000)
        await asyncio.sleep(1.5)
        d = dur.get("proposal_overview", 15)
        await scroll_to(page, [0, 50, 100, 180, 120, 50, 0], d - 2)
        await wait_done("proposal_overview", s, dur)

        # ═══════════════════════════════════════════
        # PROPOSAL SECTIONS CHECKLIST
        # ═══════════════════════════════════════════
        mark("proposal_sections_checklist")
        s = time.time()
        d = dur.get("proposal_sections_checklist", 8)
        await scroll_to(page, [300, 450, 550, 500, 400], d - 0.5)
        await wait_done("proposal_sections_checklist", s, dur)

        # ═══════════════════════════════════════════
        # PROPOSAL SECTIONS EDIT — first half
        # ═══════════════════════════════════════════
        mark("proposal_sections_edit")
        s = time.time()
        tab = await page.query_selector('button:has-text("Proposal Sections")')
        if tab:
            await tab.click()
        await asyncio.sleep(1.5)
        d = dur.get("proposal_sections_edit", 20)
        await scroll_to(
            page,
            [0, 300, 600, 900, 1200, 1500, 1800, 2100, 2400],
            d - 2,
        )
        await wait_done("proposal_sections_edit", s, dur)

        # ═══════════════════════════════════════════
        # PROPOSAL SECTIONS SCROLL — second half
        # ═══════════════════════════════════════════
        mark("proposal_sections_scroll")
        s = time.time()
        d = dur.get("proposal_sections_scroll", 15)
        await scroll_to(
            page,
            [2700, 3000, 3300, 3600, 3900, 4200, 4500, 4000, 3000, 2000, 1000, 0],
            d - 1,
        )
        await wait_done("proposal_sections_scroll", s, dur)

        # ═══════════════════════════════════════════
        # FINANCIAL PROJECTIONS TAB
        # ═══════════════════════════════════════════
        mark("proposal_financials")
        s = time.time()
        tab = await page.query_selector('button:has-text("Financial Projections")')
        if tab:
            await tab.click()
        await asyncio.sleep(1.5)
        d = dur.get("proposal_financials", 12)
        await scroll_to(page, [0, 100, 250, 400, 300, 150, 0], d - 2)
        await wait_done("proposal_financials", s, dur)

        # ═══════════════════════════════════════════
        # SCORING STRATEGY TAB
        # ═══════════════════════════════════════════
        mark("proposal_scoring")
        s = time.time()
        tab = await page.query_selector('button:has-text("Scoring Strategy")')
        if tab:
            await tab.click()
        await asyncio.sleep(1.5)
        d = dur.get("proposal_scoring", 12)
        await scroll_to(page, [0, 200, 400, 600, 400, 200, 0], d - 2)
        await wait_done("proposal_scoring", s, dur)

        # ═══════════════════════════════════════════
        # DOWNLOAD PDF
        # ═══════════════════════════════════════════
        mark("download_pdf")
        s = time.time()
        tab = await page.query_selector('button:has-text("Overview")')
        if tab:
            await tab.click()
        await asyncio.sleep(1)
        await page.evaluate("window.scrollTo({ top: 0, behavior: 'smooth' })")
        await asyncio.sleep(1.5)
        d = dur.get("download_pdf", 12)
        # Let narration describe the PDF features first, then click near the end
        await asyncio.sleep(max(d - 4, 3))
        dl_btn = await page.query_selector('button:has-text("Download PDF")')
        if dl_btn:
            try:
                async with page.expect_download(timeout=30000) as dl_info:
                    await dl_btn.click()
                download = await dl_info.value
                await download.save_as(str(OUTPUT_DIR / "Proposal.pdf"))
                print(f"         PDF downloaded")
            except Exception as e:
                print(f"         Download: {e}")
        await wait_done("download_pdf", s, dur)

        # ═══════════════════════════════════════════
        # COMPETITORS PAGE
        # ═══════════════════════════════════════════
        mark("competitors_page")
        s = time.time()
        await page.goto(f"{APP_URL}/competitors", wait_until="networkidle")
        await ensure(page, 'text=Competitors', timeout=10000)
        await asyncio.sleep(2)
        d = dur.get("competitors_page", 10)
        await scroll_to(page, [0, 200, 400, 300, 150, 0], d - 2.5)
        await wait_done("competitors_page", s, dur)

        # ═══════════════════════════════════════════
        # HISTORICAL BIDS
        # ═══════════════════════════════════════════
        mark("historical_page")
        s = time.time()
        await page.goto(f"{APP_URL}/historical", wait_until="networkidle")
        await ensure(page, 'text=Historical', timeout=10000)
        await asyncio.sleep(2)
        d = dur.get("historical_page", 10)
        await scroll_to(page, [0, 200, 400, 300, 150, 0], d - 2.5)
        await wait_done("historical_page", s, dur)

        # ═══════════════════════════════════════════
        # CONCLUSION
        # ═══════════════════════════════════════════
        mark("conclusion")
        s = time.time()
        await page.goto(f"{APP_URL}/dashboard", wait_until="networkidle")
        await asyncio.sleep(1)
        d = dur.get("conclusion", 10)
        await scroll_to(page, [0, 100, 200, 100, 0], d - 2)
        await wait_done("conclusion", s, dur)
        await asyncio.sleep(1)

        await context.close()
        await browser.close()

    vids = list(VIDEO_DIR.glob("*.webm"))
    if not vids:
        print("ERROR: No video!")
        return None, None
    vp = vids[0]
    print(f"\n  Video: {vp}")
    with open(OUTPUT_DIR / "timestamps.json", "w") as f:
        json.dump(timestamps, f, indent=2)
    return vp, timestamps


# ─── MERGE ────────────────────────────────────────────────────────
def merge_video_audio(video_path, timestamps):
    ffmpeg = get_ffmpeg_path()
    inputs = ["-i", str(video_path)]
    fp = []
    ai = []
    for i, ts in enumerate(timestamps):
        af = AUDIO_DIR / f"{ts['step_id']}.mp3"
        if not af.exists():
            continue
        inputs.extend(["-i", str(af)])
        idx = i + 1
        ms = int(ts["start_time"] * 1000)
        fp.append(f"[{idx}:a]adelay={ms}|{ms}[a{idx}]")
        ai.append(f"[a{idx}]")

    if not ai:
        print("ERROR: No audio!")
        return

    filt = ";".join(fp) + f";{''.join(ai)}amix=inputs={len(ai)}:dropout_transition=0:normalize=0[aout]"
    cmd = [ffmpeg, *inputs, "-filter_complex", filt,
           "-map", "0:v", "-map", "[aout]",
           "-c:v", "libx264", "-preset", "fast", "-crf", "23",
           "-c:a", "aac", "-b:a", "192k",
           "-shortest", "-y", str(FINAL_OUTPUT)]

    print("\n  Merging video + audio...")
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if r.returncode != 0:
        print("  Primary failed, fallback...")
        fallback_merge(ffmpeg, video_path, timestamps)
    else:
        mb = FINAL_OUTPUT.stat().st_size / (1024 * 1024)
        print(f"\n  >>> Final video: {FINAL_OUTPUT}")
        print(f"  >>> Size: {mb:.1f} MB")


def fallback_merge(ffmpeg, video_path, timestamps):
    cl = OUTPUT_DIR / "concat_list.txt"
    ta = OUTPUT_DIR / "narration_full.mp3"
    with open(cl, "w") as f:
        pe = 0.0
        for ts in timestamps:
            af = AUDIO_DIR / f"{ts['step_id']}.mp3"
            if not af.exists():
                continue
            gap = ts["start_time"] - pe
            if gap > 0.1:
                sf = AUDIO_DIR / f"silence_{ts['step_id']}.mp3"
                subprocess.run([ffmpeg, "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo",
                                "-t", str(gap), "-c:a", "libmp3lame", "-y", str(sf)],
                               capture_output=True, timeout=30)
                f.write(f"file '{sf}'\n")
            f.write(f"file '{af}'\n")
            pe = ts["start_time"] + get_audio_duration(str(af))

    subprocess.run([ffmpeg, "-f", "concat", "-safe", "0", "-i", str(cl),
                    "-c:a", "libmp3lame", "-y", str(ta)], capture_output=True, timeout=60)
    r = subprocess.run([ffmpeg, "-i", str(video_path), "-i", str(ta),
                        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
                        "-c:a", "aac", "-b:a", "192k",
                        "-shortest", "-y", str(FINAL_OUTPUT)],
                       capture_output=True, text=True, timeout=300)
    if r.returncode == 0:
        mb = FINAL_OUTPUT.stat().st_size / (1024 * 1024)
        print(f"\n  >>> Final video: {FINAL_OUTPUT}")
        print(f"  >>> Size: {mb:.1f} MB")
    else:
        subprocess.run([ffmpeg, "-i", str(video_path), "-c:v", "libx264",
                        "-preset", "fast", "-crf", "23", "-y", str(FINAL_OUTPUT)],
                       capture_output=True, timeout=300)


# ─── MAIN ─────────────────────────────────────────────────────────
async def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    if VIDEO_DIR.exists():
        for f in VIDEO_DIR.glob("*"):
            f.unlink()

    print("=" * 60)
    print("  RFP Proposal AI - Video Demo Generator")
    print("=" * 60)

    print("\n[0/3] Pre-flight...\n")
    rfp_id, proposal_id, token = preflight()

    print("\n[1/3] Generating narration audio...\n")
    audio_durations = await generate_audio_clips()

    print("\n[2/3] Recording browser demo...\n")
    video_path, timestamps = await run_browser_demo(audio_durations, rfp_id, proposal_id, token)
    if not video_path:
        print("\nERROR: No video recorded.")
        return

    print("\n[3/3] Merging video and audio...\n")
    merge_video_audio(video_path, timestamps)

    print("\n" + "=" * 60)
    print("  Demo complete!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())

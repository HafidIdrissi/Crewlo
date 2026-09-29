"""Build the local Crewlo tutorial reader, prompt files and agent role manifests.

Inputs are the authored English Markdown guides. Requires Python-Markdown.
Does not start agents, call providers, record videos or publish the kit.
"""
from pathlib import Path
import html
import json
import re
import zipfile

import markdown

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/crewlo/launch-kit/use-cases/playbooks"
SITE = "https://hafididrissi.github.io/Crewlo/"
PUBLIC_GUIDES = SITE + "crewlo/launch-kit/use-cases/playbooks/"
REPO_GUIDES = "https://github.com/HafidIdrissi/Crewlo/tree/main/docs/crewlo/launch-kit/use-cases/playbooks"
GUIDES = [
    ("GETTING-STARTED.en", "Get started", "Three agents, one folder, a clear workflow."),
    ("01-taskboard.en", "TaskBoard", "Build a usable task manager."),
    ("02-clientflow.en", "ClientFlow", "Build a small CRM for a freelancer."),
    ("03-launchpage.en", "LaunchPage", "Connect a launch page to a local API."),
    ("04-filming.en", "Record the result", "A storyboard for a three-minute video."),
]

STYLE = """
:root{color-scheme:light;--ink:#18382d;--muted:#50695f;--line:#d8e2d9;--paper:#fffefa;--accent:#2d6045;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#f1f4ed;color:var(--ink)}
*{box-sizing:border-box}body{margin:0}a{color:#265f43;text-underline-offset:3px}a:hover{color:#123321}button{font:inherit;cursor:pointer}button:disabled{cursor:default;opacity:.5}a:focus-visible,button:focus-visible,summary:focus-visible{outline:3px solid #ad681e;outline-offset:4px}.skip{position:absolute;left:12px;top:-80px;background:white;padding:12px;z-index:20}.skip:focus{top:12px}
.top{background:#18382d;color:#f6f4e9;padding:20px clamp(20px,4vw,60px);display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap}.brand{font-weight:800;letter-spacing:.19em;font-size:15px}.top a{color:#def0bb}.tag{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#def0bb}.layout{max-width:1460px;margin:auto;display:grid;grid-template-columns:270px minmax(0,1fr);gap:48px;padding:36px 36px 80px}aside{position:sticky;top:20px;align-self:start;max-height:calc(100vh - 40px);overflow:auto}nav ul{list-style:none;padding:0;margin:8px 0 25px}nav a{display:block;border-radius:10px;padding:10px 14px;text-decoration:none;margin:3px 0}nav a[aria-current=page]{background:#dce8d3;font-weight:750}nav a:hover{background:#e4ece0}.nav-title{font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:750;color:var(--muted)}.toc{font-size:13px}.toc ul{list-style:none;padding-left:12px}.toc>ul{padding-left:0}.toc a{display:block;padding:5px 0;text-decoration:none}.toc ul ul ul{display:none}main{min-width:0;max-width:980px}.intro{display:flex;justify-content:space-between;gap:15px;align-items:center;margin-bottom:22px}.intro p{margin:0;color:var(--muted);font-size:14px}.intro a{font-size:13px}.paper{background:var(--paper);border:1px solid var(--line);border-radius:22px;padding:clamp(22px,4vw,50px);box-shadow:0 10px 40px #18382d06}h1{font-size:clamp(30px,3.6vw,49px);letter-spacing:-.035em;line-height:1.12;margin:0 0 27px}h2{font-size:25px;line-height:1.25;border-top:1px solid var(--line);padding-top:34px;margin-top:40px;scroll-margin-top:25px}h3{font-size:19px;margin-top:28px;scroll-margin-top:25px}p,li{line-height:1.75;font-size:16px}p{margin:16px 0}li{margin:8px 0}strong{font-weight:740}code{font-family:ui-monospace,Consolas,monospace;font-size:.88em;background:#eaf0e5;padding:2px 5px;border-radius:4px;overflow-wrap:anywhere}pre{background:#f0f4ec;border:1px solid #d2dfcd;border-radius:14px;padding:54px 22px 22px;position:relative;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.65;margin:24px 0}pre code{background:none;padding:0;font-size:14px}.copy{position:absolute;top:12px;right:12px;border:1px solid #bad0ae;background:#fffefa;color:var(--ink);padding:6px 12px;border-radius:8px;font-size:12px}.copy:hover{background:#dce8d3}.prompt-label{position:absolute;left:20px;top:18px;color:#47633d;letter-spacing:.06em;font-size:10px;font-weight:800}.table-scroll{overflow-x:auto;margin:22px 0}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;padding:12px;border:1px solid var(--line);vertical-align:top;line-height:1.6}th{background:#eaf0e3}td{min-width:140px}footer{margin-top:28px;color:var(--muted);font-size:13px;line-height:1.7}.pager{display:flex;gap:15px;justify-content:space-between;margin-top:28px}.pager a{border:1px solid #c7d7c0;padding:11px 16px;border-radius:12px;text-decoration:none;background:#f8faf4}.status{min-height:24px;font-size:13px;color:var(--muted)}
@media(max-width:960px){.layout{grid-template-columns:210px minmax(0,1fr);gap:22px;padding:25px 20px}.paper{padding:26px}h1{font-size:35px}}
@media(max-width:700px){.layout{display:block;padding:20px 14px}aside{position:static;max-height:none;margin-bottom:18px}nav ul{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px}nav a{padding:8px 10px;font-size:13px}.toc,.toc-label{display:none}.paper{padding:23px 18px;border-radius:15px}h1{font-size:32px}h2{font-size:22px}p,li{font-size:15px}pre{padding:53px 14px 18px}pre code{font-size:13px}.top{padding:17px 20px}.intro{align-items:flex-start}.pager{flex-wrap:wrap}}
@media print{.top,aside,.intro,.copy,.pager,.status,.skip{display:none}.layout{display:block;padding:0}main{max-width:none}.paper{border:0;box-shadow:none;padding:0}pre{padding:14px;break-inside:avoid}.prompt-label{display:none}h1{font-size:28px}h2{font-size:21px}p,li{font-size:11pt}.table-scroll{overflow:visible}a{color:inherit}}
"""

SCRIPT = """
document.querySelectorAll('pre').forEach((pre,i)=>{
  const code=pre.querySelector('code'); if(!code)return;
  const label=document.createElement('span');label.className='prompt-label';label.textContent='COPYABLE PROMPT';pre.prepend(label);
  const button=document.createElement('button');button.className='copy';button.type='button';button.textContent='Copy';button.setAttribute('aria-label','Copy prompt '+(i+1));
  button.addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(code.textContent);button.textContent='Copied';document.getElementById('status').textContent='Prompt copied. Paste it into the named agent’s conversation.';setTimeout(()=>button.textContent='Copy',2200);}
    catch{const range=document.createRange();range.selectNodeContents(code);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);document.getElementById('status').textContent='Text selected. Use Ctrl+C, or Cmd+C on Mac.';}
  });pre.append(button);
});
document.querySelectorAll('table').forEach(table=>{const wrapper=document.createElement('div');wrapper.className='table-scroll';table.before(wrapper);wrapper.append(table);});
"""


def main():
    (OUT / "agents").mkdir(exist_ok=True)
    (OUT / "prompts").mkdir(exist_ok=True)
    start = (OUT / "GETTING-STARTED.en.md").read_text(encoding="utf-8")
    roles = re.findall(r"### Permanent role for (.+?)\n\n```text\n(.*?)\n```", start, re.S)
    if len(roles) != 3:
        raise ValueError("Expected three permanent roles in the getting-started guide")
    descriptions = {
        "Product": "Scope the MVP and prepare its delivery",
        "Dev": "Build the product and fix defects",
        "QA": "Verify behavior and document evidence",
    }
    for name, goal in roles:
        manifest = dict(spec="munder-difflin/hire@1", name=name,
                        description=descriptions[name], goal=goal, isolate=False)
        (OUT / "agents" / f"{name.lower()}.json").write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    prompt_count = 0
    for n, (stem, label, subtitle) in enumerate(GUIDES):
        raw = (OUT / (stem + ".md")).read_text(encoding="utf-8")
        md = markdown.Markdown(extensions=["fenced_code", "tables", "toc"])
        body = md.convert(raw)
        # Markdown links open readable source files on GitHub; the site reader
        # links to generated HTML. Keep downloads and external links unchanged.
        for guide_stem, _, _ in GUIDES:
            body = body.replace(f'href="{guide_stem}.md"', f'href="{guide_stem}.html"')
        nav = "".join(f'<li><a href="{s}.html"' + (' aria-current="page"' if s == stem else '') + f'>{html.escape(l)}</a></li>' for s, l, _ in GUIDES)
        blocks = re.findall(r"```text\n(.*?)\n```", raw, re.S)
        for i, block in enumerate(blocks, 1):
            (OUT / "prompts" / f"{stem}-{i:02}.txt").write_text(block + "\n", encoding="utf-8")
        prompt_count += len(blocks)
        previous = f'<a href="{GUIDES[n-1][0]}.html">← {html.escape(GUIDES[n-1][1])}</a>' if n else '<span></span>'
        following = f'<a href="{GUIDES[n+1][0]}.html">{html.escape(GUIDES[n+1][1])} →</a>' if n+1 < len(GUIDES) else '<a href="GETTING-STARTED.en.html">Back to the start →</a>'
        page = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Crewlo — {html.escape(label)} · practical guide</title><meta name="description" content="{html.escape(subtitle)} Agent roles, copyable prompts and step-by-step checks with Crewlo."><meta name="theme-color" content="#18382d"><link rel="canonical" href="{PUBLIC_GUIDES}{stem}.html"><link rel="icon" href="{SITE}crewlo/favicon.svg" type="image/svg+xml"><style>{STYLE}</style></head>
<body><a class="skip" href="#main">Skip to the guide</a><header class="top"><div><a class="brand" href="{SITE}">CREWLO</a> &nbsp; / &nbsp; MVP WORKSHOPS</div><a href="{SITE}use-cases.html">All use cases</a><a href="{REPO_GUIDES}">Read on GitHub</a><a href="crewlo-playbooks-en.zip" download>Download the kit</a></header>
<div class="layout"><aside><nav aria-label="Workflows"><div class="nav-title">From brief to result</div><ul>{nav}</ul></nav><div class="nav-title toc-label">In this guide</div>{md.toc}</aside>
<main id="main"><div class="intro"><p>{html.escape(subtitle)}<br>{len(blocks)} copyable prompts</p><a href="{stem}.md" download>Markdown version</a></div><div class="status" id="status" role="status" aria-live="polite"></div><article class="paper">{body}</article><div class="pager">{previous}{following}</div><footer>Local kit · 29 September 2026. These workflows describe work to perform; verify the results during execution. Crewlo is an independent fork of Munder Difflin.</footer></main></div><script>{SCRIPT}</script></body></html>'''
        (OUT / (stem + ".html")).write_text(page, encoding="utf-8")
        if n == 0:
            (OUT / "index.html").write_text(page, encoding="utf-8")

    # Explicit contents keep legacy redirects and local review files out of the kit.
    files = [OUT / "README.md", OUT / "index.html"]
    files += [OUT / f"{stem}.{ext}" for stem, _, _ in GUIDES for ext in ("md", "html")]
    files += [OUT / "agents" / f"{name.lower()}.json" for name, _ in roles]
    files += [OUT / "prompts" / f"{stem}-{i:02}.txt" for stem, _, _ in GUIDES
              for i in range(1, len(re.findall(r"```text\n(.*?)\n```", (OUT / f"{stem}.md").read_text(encoding="utf-8"), re.S)) + 1)]
    with zipfile.ZipFile(OUT / "crewlo-playbooks-en.zip", "w", zipfile.ZIP_DEFLATED) as archive:
        for path in files:
            entry = zipfile.ZipInfo("crewlo-playbooks-en/" + path.relative_to(OUT).as_posix(), (2026, 9, 29, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.external_attr = 0o644 << 16
            archive.writestr(entry, path.read_bytes())
    legacy = ["DEMARRER.fr", "01-taskboard.fr", "02-clientflow.fr", "03-launchpage.fr", "04-tournage.fr"]
    for old, (new, _, _) in zip(legacy, GUIDES):
        (OUT / f"{old}.html").write_text(
            f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Crewlo — guide moved</title>'
            f'<meta http-equiv="refresh" content="0;url={new}.html"><meta name="robots" content="noindex">'
            f'<link rel="canonical" href="{PUBLIC_GUIDES}{new}.html"></head>'
            f'<body><p>This guide is now available in English. <a href="{new}.html">Open the guide</a>.</p></body></html>\n',
            encoding="utf-8")
    print(f"Built {len(GUIDES)} English guides, {len(roles)} agent manifests, {prompt_count} prompt files, and ZIP ({len(files)} files).")


if __name__ == "__main__":
    main()

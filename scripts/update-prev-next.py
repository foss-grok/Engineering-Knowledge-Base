#!/usr/bin/env python3
"""Write "Previous / Next" links on learn pages that follow a reading order.

Each track lists its pages in reading order (the same order as the
"Suggested reading order" list on the track's learn hub). The script puts a
<nav class="prev-next"> block between the markers
    <!-- prev-next:start -->  ...  <!-- prev-next:end -->
or, the first time, right before <nav class="page-footer-nav">.

Run it after adding a page to a track, then run scripts/check-links.py:
  python3 scripts/update-prev-next.py
"""
import os
import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent

TRACKS = {
    "CS-Fundamentals/learn": [
        "Operating-Systems/os-processes-threads-scheduling.html",
        "Operating-Systems/os-virtual-memory-paging.html",
        "Operating-Systems/os-file-systems-io.html",
        "Operating-Systems/os-concurrency-synchronization-deadlocks.html",
        "Databases/dbms-normalization-schema-design.html",
        "Databases/dbms-transactions-isolation-mvcc.html",
        "Databases/dbms-indexing-btrees-query-plans.html",
        "Computer-Networks/cn-ip-addressing-subnetting-routing.html",
        "Computer-Networks/cn-tcp-deep-dive.html",
        "Computer-Networks/cn-dns-http.html",
        "Scenarios/scenario-slow-api-debugging.html",
        "Scenarios/scenario-service-cannot-reach-database.html",
    ],
}

START, END = "<!-- prev-next:start -->", "<!-- prev-next:end -->"
BLOCK_RE = re.compile(re.escape(START) + r".*?" + re.escape(END) + r"\n?", re.S)
H1_RE = re.compile(r"<h1>(.*?)</h1>", re.S)


def title_of(path: Path) -> str:
    m = H1_RE.search(path.read_text(encoding="utf-8"))
    return m.group(1).strip() if m else path.stem


def link(from_page: Path, to_page: Path) -> str:
    return os.path.relpath(to_page, from_page.parent).replace(os.sep, "/")


changed = 0
for base, order in TRACKS.items():
    pages = [root / base / p for p in order]
    for i, page in enumerate(pages):
        total = len(pages)
        parts = [f'{START}\n  <nav class="prev-next" aria-label="Reading order">']
        if i > 0:
            prev = pages[i - 1]
            parts.append(
                f'    <a class="prev-next-prev" href="{link(page, prev)}" rel="prev">'
                f'<span class="prev-next-label">&larr; Previous</span>'
                f'<span class="prev-next-title">{title_of(prev)}</span></a>'
            )
        if i < total - 1:
            nxt = pages[i + 1]
            parts.append(
                f'    <a class="prev-next-next" href="{link(page, nxt)}" rel="next">'
                f'<span class="prev-next-label">Next &rarr;</span>'
                f'<span class="prev-next-title">{title_of(nxt)}</span></a>'
            )
        parts.append(f'    <p class="prev-next-step">Page {i + 1} of {total} in the suggested reading order</p>')
        parts.append(f"  </nav>\n  {END}\n")
        block = "\n".join(parts)

        text = page.read_text(encoding="utf-8")
        if START in text:
            new = BLOCK_RE.sub(lambda _m: block, text, count=1)
        else:
            marker = '<nav class="page-footer-nav">'
            if marker not in text:
                raise SystemExit(f"{page}: no page-footer-nav to anchor the prev/next block")
            new = text.replace("  " + marker, "  " + block + "\n  " + marker, 1)
        if new != text:
            page.write_text(new, encoding="utf-8")
            changed += 1

print(f"prev/next links updated on {changed} page(s)")

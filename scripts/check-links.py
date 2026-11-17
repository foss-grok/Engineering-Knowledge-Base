#!/usr/bin/env python3
"""Check internal links in the static site.

Verifies that every relative or root-relative (/...) href/src points to an existing file and that every
#fragment (same-page or cross-page) matches an id on the target page.

Usage:
  python3 scripts/check-links.py                 # whole site
  python3 scripts/check-links.py Docker-Kubernetes   # one folder
Exit code is 1 when anything is broken, so it can run in CI.
"""
import re
import sys
from pathlib import Path
from urllib.parse import unquote

root = Path(__file__).resolve().parent.parent
scan = root / (sys.argv[1] if len(sys.argv) > 1 else ".")

ATTR = re.compile(r'\b(?:href|src)="([^"]+)"')
ID = re.compile(r'\bid="([^"]+)"')
_ids_cache = {}


def ids_in(path: Path) -> set:
    if path not in _ids_cache:
        _ids_cache[path] = set(ID.findall(path.read_text(encoding="utf-8", errors="replace")))
    return _ids_cache[path]


broken = []
checked = 0
for html in sorted(scan.rglob("*.html")):
    if ".git" in html.parts:
        continue
    text = html.read_text(encoding="utf-8", errors="replace")
    # ignore links inside <pre>/<code> samples
    text_no_code = re.sub(r"<pre[\s\S]*?</pre>", "", text)
    for ref in ATTR.findall(text_no_code):
        if ref.startswith(("http://", "https://", "mailto:", "javascript:", "data:", "//")):
            continue
        checked += 1
        path_part, _, fragment = ref.partition("#")
        if path_part.startswith("/"):
            # root-relative link (used by 404.html, which can be served at any depth)
            target = (root / unquote(path_part.lstrip("/"))).resolve()
        else:
            target = (html.parent / unquote(path_part)).resolve() if path_part else html
        if not target.exists():
            broken.append((html.relative_to(root).as_posix(), ref, "missing file"))
            continue
        if fragment and target.suffix == ".html" and fragment not in ids_in(target):
            broken.append((html.relative_to(root).as_posix(), ref, "missing #id"))

for src, ref, why in sorted(set(broken)):
    print(f"{src} -> {ref} ({why})")
print(f"checked {checked} internal links, broken: {len(set(broken))}")
sys.exit(1 if broken else 0)

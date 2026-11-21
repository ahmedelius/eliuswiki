#!/usr/bin/env python3
"""Check local links, fragments, duplicate IDs, and required metadata."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote
import sys

ROOT = Path(__file__).resolve().parent
HTML = sorted(ROOT.rglob("*.html"))

class Parser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links = []      # (attr, value, tag)
        self.ids = []
        self.title = None
        self._in_title = False
        self._title_text = []
        self.metas = []
        self.h1s = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "title":
            self._in_title = True
        if tag == "h1":
            self.h1s.append(a)
        if "id" in a:
            self.ids.append(a["id"])
        for attr in ("href", "src"):
            if attr in a:
                self.links.append((attr, a[attr], tag))
        if tag == "meta":
            self.metas.append(a)

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._in_title:
            self._title_text.append(data)

parsed = {}
for f in HTML:
    p = Parser()
    p.feed(f.read_text(encoding="utf-8"))
    p.title = "".join(p._title_text).strip()
    parsed[f] = p

errors = []
warnings = []

for f, p in parsed.items():
    rel = f.relative_to(ROOT)
    if not p.title:
        errors.append(f"{rel}: missing <title>")
    if len(p.h1s) == 0:
        warnings.append(f"{rel}: no <h1>")
    if len(p.h1s) > 1:
        warnings.append(f"{rel}: {len(p.h1s)} <h1> elements")
    dupes = {i for i in p.ids if p.ids.count(i) > 1}
    if dupes:
        errors.append(f"{rel}: duplicate ids {sorted(dupes)}")
    if not any(m.get("name") == "description" for m in p.metas):
        warnings.append(f"{rel}: missing meta description")

    for attr, value, tag in p.links:
        if not value:
            errors.append(f"{rel}: empty {attr} on <{tag}>")
            continue
        parsed_url = urlparse(value)
        if parsed_url.scheme in ("http", "https", "mailto", "tel", "data"):
            continue
        if value.startswith("#"):
            target = f
            frag = unquote(value[1:])
            if frag and frag not in parsed[target].ids:
                errors.append(f"{rel}: missing fragment #{frag}")
            continue
        if value.startswith("//"):
            continue
        path_part = unquote(parsed_url.path)
        frag = unquote(parsed_url.fragment)
        if path_part.startswith("/"):
            target = (ROOT / path_part.lstrip("/")).resolve()
        else:
            target = (f.parent / path_part).resolve()
        if not target.exists():
            errors.append(f"{rel}: missing target {value} -> {target.relative_to(ROOT)}")
            continue
        if frag and target.suffix == ".html":
            if frag not in parsed.get(target, Parser()).ids:
                errors.append(f"{rel}: missing fragment #{frag} in {target.relative_to(ROOT)}")

# Check required assets referenced in metadata
for asset in ["assets/img/og.png", "assets/img/favicon.svg", "sitemap.xml", "robots.txt",
              "site.webmanifest", "CNAME", ".nojekyll"]:
    if not (ROOT / asset).exists():
        errors.append(f"missing required file: {asset}")

print(f"Checked {len(HTML)} HTML files.")
for e in errors:
    print("ERROR:", e)
for w in warnings:
    print("WARN:", w)
print(f"\n{len(errors)} errors, {len(warnings)} warnings")
sys.exit(1 if errors else 0)

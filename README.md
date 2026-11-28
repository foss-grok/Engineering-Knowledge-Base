<p align="center">
  <img src="assets/logo.svg" width="96" height="96" alt="Engineering Knowledge Base logo">
</p>

<h1 align="center">Engineering Knowledge Base</h1>

<p align="center">
  Static HTML notes and interview Q&amp;A for engineering topics.
</p>

<p align="center">
  <a href="https://engineering.msaqlain.com">Live site</a>
  ·
  <a href="https://github.com/saqlain2204/Engineering-Knowledge-Base">GitHub</a>
  ·
  <a href="https://github.com/saqlain2204/Engineering-Knowledge-Base/issues">Issues</a>
</p>

<p align="center">
  <a href="https://github.com/saqlain2204">@saqlain2204</a>
</p>

## Overview

Engineering Knowledge Base is a static learning site organized by subject. Each subject typically includes:

| Track | Description |
|-------|-------------|
| **Learn** | Reference notes with concepts, tradeoffs, and code snippets |
| **Interview Prep** | Expandable Q&amp;A using HTML `<details>` elements |
| **Research** | Selected paper breakdowns (where available) |

Pages use relative links and work locally or on any static host. Site search uses fuzzy matching over a generated index.

## Quick start

Clone the repository and open `index.html`, or serve the repo root:

```bash
git clone https://github.com/saqlain2204/Engineering-Knowledge-Base.git
cd Engineering-Knowledge-Base
python -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080).

**Important:** Open the repository root (`Engineering-Knowledge-Base/`), not the `AI Engineer/` folder alone. Shared assets (`styles.css`, `assets/`) live at the repo root.

## Content

### AI Engineering

| Track | Path | Pages |
|-------|------|------:|
| Hub | [`AI Engineer/ai-engineering.html`](AI%20Engineer/ai-engineering.html) | 1 |
| Learn | [`AI Engineer/learn/`](AI%20Engineer/learn/) | 34 |
| Interview | [`AI Engineer/interview/`](AI%20Engineer/interview/) | 24 |
| Research | [`AI Engineer/research/`](AI%20Engineer/research/) | 2 |

Topics are grouped by category (for example `Training-Pipeline/`, `Prompting-and-Retrieval/`). The learn hub has a suggested reading order from classical ML to LLM apps, and pages on it have Previous / Next links.

### CS Fundamentals

| Track | Path | Pages |
|-------|------|------:|
| Hub | [`CS-Fundamentals/cs-fundamentals.html`](CS-Fundamentals/cs-fundamentals.html) | 1 |
| Learn | [`CS-Fundamentals/learn/`](CS-Fundamentals/learn/) | 27 |

Operating systems, databases, and computer networks from zero, grouped by subject (`Operating-Systems/`, `Databases/`, `Computer-Networks/`), plus end-to-end walkthroughs in `Scenarios/`. Pages in the suggested reading order have Previous / Next links, written by `scripts/update-prev-next.py`.

### Docker & Kubernetes

| Track | Path | Pages |
|-------|------|------:|
| Hub | [`Docker-Kubernetes/docker-kubernetes.html`](Docker-Kubernetes/docker-kubernetes.html) | 1 |
| Learn | [`Docker-Kubernetes/learn/`](Docker-Kubernetes/learn/) | 18 |
| Interview | [`Docker-Kubernetes/interview/`](Docker-Kubernetes/interview/) | 9 |
| Cheat sheets | [`Docker-Kubernetes/cheatsheets/`](Docker-Kubernetes/cheatsheets/) | 3 |

Docker, Kubernetes (architecture, workloads, scheduling, autoscaling, networking, storage, security, observability, GPUs, debugging broken pods, operators and custom resources), and DevOps/MLOps (`DevOps/`, including infrastructure as code). The learn pages have a suggested reading order with Previous / Next links.

### Graph Machine Learning

| Track | Path | Pages |
|-------|------|------:|
| Hub | [`Graph ML/graph-ml.html`](Graph%20ML/graph-ml.html) | 1 |
| Learn | [`Graph ML/learn/`](Graph%20ML/learn/) | 13 |
| Interview | [`Graph ML/interview/`](Graph%20ML/interview/) | 10 |
| Formulas | [`Graph ML/formulas/`](Graph%20ML/formulas/) | 1 |
| Papers hub | [`Graph ML/research/`](Graph%20ML/research/) | 1 |

Page counts exclude each track's own hub page (for example `learn/docker-kubernetes-learn.html`).

## Project structure

```
Engineering-Knowledge-Base/
├── index.html
├── .github/workflows/site-checks.yml   # CI: fails a PR if the search index or sitemap is stale, or a link is broken
├── 404.html               # Custom not-found page (root-relative links; served by the host for missing URLs)
├── styles.css
├── assets/
│   ├── logo.svg
│   ├── site.js              # Path normalization for local browsing, code copy buttons, wide-math fix, section links, back-to-top, reading time, progress bar, skip link, TOC highlight
│   ├── search.js            # Fuzzy site search
│   ├── search-index.js      # Generated index (commit with content changes)
│   └── search-index.json
├── sitemap.xml             # Generated with the search index (https://engineering.msaqlain.com)
├── robots.txt              # Points crawlers at sitemap.xml
├── scripts/
│   ├── build-search-index.py   # Search index, sitemap.xml, and robots.txt builder (Python 3, no dependencies)
│   ├── build-search-index.ps1  # Wrapper that calls the Python builder
│   ├── check-links.py          # Internal link and #anchor checker; also fails if a learn page is missing from its learn hub
│   ├── check-pages.py          # Page basics: one title and h1, meta description, viewport, unique ids, no em dashes, balanced tags
│   └── update-prev-next.py     # Previous / Next links along a track's reading order
└── AI Engineer/
    ├── ai-engineering.html
    ├── index.html           # Redirects to subject hub
    ├── learn/
    ├── interview/
    └── research/
```

## Tech stack

| Layer | Choice |
|-------|--------|
| Markup | HTML5 |
| Styling | CSS (`styles.css`) |
| Search | Vanilla JS (`assets/search.js`, no bundler) |
| Hosting | Static file server |

## Search index

After adding or renaming pages:

```bash
python3 scripts/build-search-index.py
```

(`powershell -File scripts/build-search-index.ps1` still works and calls the same script.) Commit the updated `assets/search-index.js`, `assets/search-index.json`, `sitemap.xml`, and `robots.txt` with your changes.

## Previous / Next links

When you add a page to a track's suggested reading order, add it to the list in `scripts/update-prev-next.py` too, then run:

```bash
python3 scripts/update-prev-next.py
```

The script rewrites the block between `<!-- prev-next:start -->` and `<!-- prev-next:end -->` on every page in the order, so running it again is safe.

## Checking links and pages

```bash
python3 scripts/check-links.py            # whole site; exits 1 if any internal link or #anchor is broken,
                                          # or if a learn page is not linked from its track's learn hub
python3 scripts/check-links.py AI\ Engineer   # one folder
```

```bash
python3 scripts/check-pages.py            # every page: title, description, viewport, one <h1>, unique ids,
                                          # no em dashes, and balanced tags (a raw "<" in math breaks a page)
```

All of these checks, plus `update-prev-next.py --check` and a stale search index / sitemap check, run automatically on every pull request (`.github/workflows/site-checks.yml`).

## Contributing

1. Fork the repository.
2. Create a branch (for example `add-eval-interview-questions`).
3. Match existing page structure: breadcrumbs, relative paths, footer links.
4. Regenerate the search index if pages changed.
5. Open a pull request against `main`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for path conventions and file naming.

## Deployment

Deploy the repository root to GitHub Pages, Cloudflare Pages, Netlify, or similar. No build step is required.

Production site: [https://engineering.msaqlain.com](https://engineering.msaqlain.com)

## License

No `LICENSE` file is in the repository yet. Contact the maintainer on GitHub for reuse questions.

## Acknowledgments

Maintained by [@saqlain2204](https://github.com/saqlain2204). External sources cited on learn pages belong to their respective authors.

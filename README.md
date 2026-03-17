# STRYKR Knowledge Base

Offensive security knowledge base built from HackTheBox writeups and HackerOne disclosed reports.

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.x-000000?logo=flask)
![SQLite](https://img.shields.io/badge/SQLite-FTS5-003B57?logo=sqlite)
![License](https://img.shields.io/badge/License-MIT-green)

## Run

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

Open [http://localhost:5000](http://localhost:5000)

## What's Inside

A searchable dashboard with a Flask + SQLite3 backend, powered by FTS5 full-text search.

**Landing page** at `/` — animated intro with live stats and data previews.

**Dashboard** at `/dashboard` — five tabs:

- **Overview** — stat cards and Chart.js visualizations (foothold vectors, privesc types, OS/difficulty, tools, H1 weaknesses, bounty distribution)
- **HTB Boxes** — searchable table with OS/difficulty filters. Click any box for full detail: attack chain, commands, scripts, ports, CVEs, Metasploit modules
- **HackerOne** — filterable reports by program and weakness. Click for full vulnerability details
- **Scripts** — browse exploit scripts by category with source code viewer
- **Archetypes** — attack pattern cards showing recurring OS + foothold + escalation combinations

**Global search** in the header searches across boxes, reports, and scripts simultaneously.

## Demo Data

This repo ships with a demo database containing:

| | Count |
|---|---|
| HTB Machines | 19 |
| HackerOne Reports | 100 |
| Exploit Scripts | 50 |
| Attack Archetypes | 29 |

Includes classic boxes like Lame, Blue, Jerry, Active, Valentine, and Shocker.

To use your own dataset, replace `strykr_knowledge.db` with your own database following the same schema.


## Structure

```
strykr-kb/
  app.py                  # Flask backend
  requirements.txt
  strykr_knowledge.db     # SQLite3 database
  templates/
    landing.html          # Landing page
    index.html            # Dashboard
  static/
    css/style.css
    js/app.js
```

## License

MIT

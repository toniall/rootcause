#!/usr/bin/env python3
"""STRYKR Knowledge Base - Flask Backend"""

import sqlite3
import json
import os
import logging
from functools import wraps
from flask import Flask, request, jsonify, render_template, g

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 3600

DB_PATH = os.environ.get("STRYKR_DB", os.path.join(os.path.dirname(os.path.abspath(__file__)), "strykr_knowledge.db"))

# Production logging
if not app.debug:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


@app.after_request
def security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# ── DB helpers ──────────────────────────────────────────────

def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA journal_mode=WAL")
        g.db.execute("PRAGMA cache_size=-8000")
    return g.db


@app.teardown_appcontext
def close_db(exc):
    db = g.pop("db", None)
    if db:
        db.close()


def row_to_dict(row):
    return dict(row) if row else None


def rows_to_list(rows):
    return [dict(r) for r in rows]


def parse_json_fields(d, fields):
    """Parse JSON string fields into native Python objects."""
    for f in fields:
        if f in d and isinstance(d[f], str):
            try:
                d[f] = json.loads(d[f])
            except (json.JSONDecodeError, TypeError):
                pass
    return d


BOX_JSON_FIELDS = [
    "skills_required", "skills_learned", "ports", "port_numbers",
    "target_ips", "cves", "msf_modules", "tools_used",
    "tools_by_section", "foothold_types", "privesc_types", "flag_locations",
]

SCRIPT_JSON_FIELDS = ["purposes", "libs_used"]
SCRIPT_FILE_JSON_FIELDS = ["purposes", "libs"]
ARCHETYPE_JSON_FIELDS = ["common_ports", "common_privesc", "typical_phases"]


# ── Frontend ────────────────────────────────────────────────

@app.route("/")
def landing():
    return render_template("landing.html")


@app.route("/dashboard")
def dashboard():
    return render_template("index.html")


# ── Run ─────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"[STRYKR-KB] Database: {DB_PATH}")
    print(f"[STRYKR-KB] Starting dev server on http://0.0.0.0:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
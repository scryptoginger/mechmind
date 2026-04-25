"""Scraper CLI entrypoint.

Usage:
  python -m scraper.cli scrape-all       # full pipeline
  python -m scraper.cli verify-cache     # list cached HTML files
  python -m scraper.cli summary          # print catalog summary from DB
  python -m scraper.cli --help
"""
from __future__ import annotations

import argparse
import logging
import sqlite3
import sys
from pathlib import Path

from . import pipeline
from .loader import DEFAULT_DB
from .sources.base import CACHE_DIR, LOGS_DIR

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger(__name__)


def cmd_scrape_all(args: argparse.Namespace) -> int:
    log.info("starting full scrape pipeline")
    result = pipeline.run()
    log.info("scrape complete: %s", result)
    return 0


def cmd_verify_cache(args: argparse.Namespace) -> int:
    if not CACHE_DIR.exists():
        log.info("no cache dir at %s", CACHE_DIR)
        return 0
    n = 0
    for path in CACHE_DIR.rglob("*.html"):
        n += 1
        print(path.relative_to(CACHE_DIR))
    log.info("%d cached files at %s", n, CACHE_DIR)
    return 0


def cmd_summary(args: argparse.Namespace) -> int:
    db = Path(args.db) if args.db else DEFAULT_DB
    if not db.exists():
        print(f"DB does not exist yet: {db}")
        print("Run the Expo app once to apply migrations and create it.")
        return 1
    with sqlite3.connect(db) as c:
        for table in (
            "vehicles",
            "maintenance_types",
            "parts",
            "torque_specs",
            "tools_required",
            "procedures",
            "media_links",
            "maintenance_logs",
            "odometer_readings",
        ):
            try:
                row = c.execute(f"SELECT COUNT(*) FROM {table}").fetchone()
                print(f"  {table:25s} {row[0]:6d}")
            except sqlite3.OperationalError:
                print(f"  {table:25s}    n/a (no table)")
    return 0


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="scraper", description="MechMind data acquisition")
    p.add_argument("--db", help="Path to mechmind.db (default ./mechmind.db)")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub_all = sub.add_parser("scrape-all", help="Run full scrape pipeline")
    sub_all.set_defaults(func=cmd_scrape_all)

    sub_v = sub.add_parser("verify-cache", help="List cached HTML files")
    sub_v.set_defaults(func=cmd_verify_cache)

    sub_s = sub.add_parser("summary", help="Print row counts from the DB")
    sub_s.set_defaults(func=cmd_summary)

    args = p.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())

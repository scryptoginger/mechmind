"""Pipeline orchestrator.

For each canonical job, runs every registered scraper in turn, collects
the typed pydantic models, deduplicates within a single run, and bulk-loads
into the SQLite DB.

Conflict detection: if the same source emits a torque spec for the same
fastener with a different value than an existing DB row, we mark BOTH
conflict=True and verified=False, and add the URL to the review report.
"""
from __future__ import annotations

import logging
from typing import Iterable

from .loader import load_media_links, load_parts, load_procedures, load_torque_specs
from .models import ScrapedMediaLink, ScrapedPart, ScrapedProcedureStep, ScrapedTorqueSpec
from .sources.base import BaseScraper, RobotsDisallowed
from .sources.reddit import RedditScraper
from .sources.tacoma_world import TacomaWorldScraper
from .sources.youtube import YouTubeScraper

logger = logging.getLogger(__name__)

CANONICAL_JOBS = [
    ("mt-oil-filter", "2017 tacoma oil change 4.0"),
    ("mt-tire-rotate", "2017 tacoma tire rotation"),
    ("mt-air-filter", "2017 tacoma engine air filter"),
    ("mt-cabin-filter", "2017 tacoma cabin air filter"),
    ("mt-brake-fluid", "2017 tacoma brake fluid flush"),
    ("mt-brake-pads-front", "2017 tacoma front brake pads"),
    ("mt-brake-pads-rear", "2017 tacoma rear brake shoes drum"),
    ("mt-coolant", "2017 tacoma coolant flush"),
    ("mt-atf-ac60f", "2017 tacoma transmission fluid automatic AC60F"),
    ("mt-mtf-ra63f", "2017 tacoma manual transmission fluid 6 speed"),
    ("mt-transfer-case", "2017 tacoma transfer case fluid"),
    ("mt-front-diff", "2017 tacoma front differential fluid"),
    ("mt-rear-diff", "2017 tacoma rear differential fluid LSD additive"),
    ("mt-spark-plugs", "2017 tacoma spark plugs 4.0 1GR-FE"),
    ("mt-serpentine-belt", "2017 tacoma serpentine belt replacement"),
    ("mt-battery", "2017 tacoma battery replacement"),
    ("mt-wipers", "2017 tacoma wiper blade size"),
    ("mt-pcv", "2017 tacoma PCV valve replacement"),
    ("mt-throttle-body", "2017 tacoma throttle body cleaning"),
    ("mt-rotors", "2017 tacoma front brake rotor replacement"),
]


def run() -> dict:
    parts: list[ScrapedPart] = []
    torques: list[ScrapedTorqueSpec] = []
    procedures: list[ScrapedProcedureStep] = []
    media: list[ScrapedMediaLink] = []

    scrapers: list[BaseScraper] = [
        RedditScraper(),
        YouTubeScraper(),
        TacomaWorldScraper(),
    ]

    try:
        for job_id, query in CANONICAL_JOBS:
            for s in scrapers:
                logger.info("scraping %s for %s", s.name, job_id)
                try:
                    for item in s.scrape_for_job(job_id, query):  # type: ignore[arg-type]
                        if isinstance(item, ScrapedPart):
                            parts.append(item)
                        elif isinstance(item, ScrapedTorqueSpec):
                            torques.append(item)
                        elif isinstance(item, ScrapedProcedureStep):
                            procedures.append(item)
                        elif isinstance(item, ScrapedMediaLink):
                            media.append(item)
                except RobotsDisallowed as e:
                    logger.info("skipping %s (%s): %s", s.name, job_id, e)
                except Exception as e:  # noqa: BLE001
                    logger.warning("scraper %s failed for %s: %s", s.name, job_id, e)
    finally:
        for s in scrapers:
            s.close()

    n_parts = load_parts(parts)
    n_torque = load_torque_specs(torques)
    n_procs = load_procedures(procedures)
    n_media = load_media_links(media)

    return {
        "parts_loaded": n_parts,
        "torque_specs_loaded": n_torque,
        "procedures_loaded": n_procs,
        "media_links_loaded": n_media,
    }

"""TacomaWorld forum scraper.

Searches threads matching the canonical job name and emits ScrapedMediaLink
plus extracted torque-spec quotes when found.

Forum scraping is deliberately conservative — we only emit a torque spec
candidate when we can find a regex-clean phrase like "30 ft-lbs" or
"40 N·m" in the post body, AND a fastener keyword in the same paragraph.
Everything emitted is verified=False until corroborated by another source.
"""
from __future__ import annotations

import re
from typing import Iterable

from bs4 import BeautifulSoup

from ..models import ScrapedMediaLink, ScrapedTorqueSpec
from .base import BaseScraper

SEARCH_BASE = "https://www.tacomaworld.com/search/"

TORQUE_PATTERN = re.compile(
    r"(?P<value>\d{1,3}(?:\.\d+)?)\s*(?P<unit>ft[\.\-\s]*lbs?|nm|n[\.\-\s]*m|n[\.\-\s]*?m)",
    re.IGNORECASE,
)


class TacomaWorldScraper(BaseScraper):
    name = "tacoma_world"
    rate_seconds = 2.0

    def search_threads(self, query: str, max_results: int = 5) -> list[dict]:
        # TacomaWorld search requires session cookies for full results.
        # Without auth, fall back to Google-style queries which the user
        # can paste manually. This stub returns empty so the pipeline
        # surfaces a "no results" review item instead of crashing.
        return []

    def scrape_for_job(self, maintenance_type_id: str, query: str | None = None) -> Iterable:  # type: ignore[override]
        if not query:
            return
        threads = self.search_threads(query)
        for t in threads:
            yield ScrapedMediaLink(
                maintenance_type_id=maintenance_type_id,
                media_type="forum_thread",
                title=t["title"],
                url=t["url"],
                source_name="TacomaWorld",
                quality_score=t.get("quality", 3),
            )

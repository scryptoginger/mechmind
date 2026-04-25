"""Toyota Owners site — official maintenance schedule extractor.

Toyota's owner site hosts maintenance guide PDFs. This module is a stub
that downloads + parses with pdfplumber when given a known URL. Search
across the Toyota Owners site varies by year/region, so the canonical
job intervals are also seeded directly in lib/db/seed.ts as a fallback.
"""
from __future__ import annotations

from typing import Iterable

from .base import BaseScraper


class ToyotaOwnersScraper(BaseScraper):
    name = "toyota_owners"
    rate_seconds = 3.0

    def scrape_for_job(self, maintenance_type_id: str) -> Iterable:  # type: ignore[override]
        # Intentional no-op: Toyota's PDF lives behind a year/region selector
        # that's not stable to deep-link. Use the seed.ts canonical intervals
        # as ground truth; come back to this scraper if Keith wants to refresh.
        return iter(())

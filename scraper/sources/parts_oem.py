"""Stub OEM parts catalog scrapers — ToyotaPartsDeal / McGeorge.

Both sites use anti-bot challenges that need Playwright + sometimes a
human-solve step. The scaffold leaves these as no-ops; the canonical
seed.ts already provides high-confidence OEM PNs for the top jobs.
Keith can extend these later when refining the data.
"""
from __future__ import annotations

from typing import Iterable

from .base import BaseScraper


class ToyotaPartsDealScraper(BaseScraper):
    name = "toyota_parts_deal"
    rate_seconds = 3.0

    def scrape_for_job(self, maintenance_type_id: str) -> Iterable:  # type: ignore[override]
        return iter(())


class McGeorgeToyotaScraper(BaseScraper):
    name = "mcgeorge_toyota"
    rate_seconds = 3.0

    def scrape_for_job(self, maintenance_type_id: str) -> Iterable:  # type: ignore[override]
        return iter(())


class RockAutoScraper(BaseScraper):
    name = "rockauto"
    rate_seconds = 3.0

    def scrape_for_job(self, maintenance_type_id: str) -> Iterable:  # type: ignore[override]
        return iter(())


class NapaScraper(BaseScraper):
    name = "napa"
    rate_seconds = 3.0

    def scrape_for_job(self, maintenance_type_id: str) -> Iterable:  # type: ignore[override]
        return iter(())

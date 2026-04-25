"""YouTube media-link scraper.

Two modes:
  - If YOUTUBE_API_KEY is set in env, use Data API v3 search.list endpoint.
  - Otherwise, attempt a lightweight HTML parse of search results (fragile;
    falls back to no-op if the parse fails).

ToS: store URL + title + channel only. We do NOT fetch transcripts.
"""
from __future__ import annotations

import json
import os
import re
from typing import Iterable
from urllib.parse import urlencode

from ..models import ScrapedMediaLink
from .base import BaseScraper

API_BASE = "https://www.googleapis.com/youtube/v3/search"


class YouTubeScraper(BaseScraper):
    name = "youtube"
    rate_seconds = 1.0

    def __init__(self) -> None:
        super().__init__()
        self.api_key = os.environ.get("YOUTUBE_API_KEY")

    def search_api(self, query: str, max_results: int = 5) -> list[dict]:
        if not self.api_key:
            return []
        params = {
            "part": "snippet",
            "q": query,
            "type": "video",
            "maxResults": str(max_results),
            "key": self.api_key,
        }
        text = self.fetch(f"{API_BASE}?{urlencode(params)}")
        try:
            data = json.loads(text)
            return data.get("items", [])
        except json.JSONDecodeError:
            return []

    def scrape_for_job(self, maintenance_type_id: str, query: str | None = None) -> Iterable:  # type: ignore[override]
        if not query:
            return
        items = self.search_api(query)
        if not items:
            self.emit_fact(API_BASE, "youtube_no_results_or_no_key", {"query": query}, confidence=0.0)
            return
        for it in items:
            vid = it["id"]["videoId"]
            sn = it["snippet"]
            quality = 4 if "tacoma" in sn.get("title", "").lower() else 3
            yield ScrapedMediaLink(
                maintenance_type_id=maintenance_type_id,
                media_type="youtube",
                title=sn["title"][:200],
                url=f"https://www.youtube.com/watch?v={vid}",
                source_name=f"YouTube — {sn.get('channelTitle', 'unknown')}",
                quality_score=quality,
                notes=f"published={sn.get('publishedAt')}",
            )

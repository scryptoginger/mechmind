"""Reddit JSON API search — no auth required for read.

Used to surface high-signal threads from r/Tacoma and r/MechanicAdvice
for any given maintenance job. Rate-limited per Reddit ToS to ~60 rpm.
"""
from __future__ import annotations

import json
from typing import Iterable

from ..models import ScrapedMediaLink
from .base import BaseScraper

SEARCH_TMPL = "https://www.reddit.com/r/{sub}/search.json?q={q}&restrict_sr=1&sort=top&t=year&limit=10"


class RedditScraper(BaseScraper):
    name = "reddit"
    rate_seconds = 1.0  # Reddit ToS allows up to 60 rpm

    def search(self, sub: str, query: str) -> list[dict]:
        url = SEARCH_TMPL.format(sub=sub, q=query.replace(" ", "+"))
        text = self.fetch(url)
        try:
            data = json.loads(text)
            return [c["data"] for c in data["data"]["children"]]
        except (KeyError, json.JSONDecodeError) as e:
            self.emit_fact(url, "reddit_parse_error", {"error": str(e)}, confidence=0.0)
            return []

    def scrape_for_job(self, maintenance_type_id: str, query: str | None = None) -> Iterable:  # type: ignore[override]
        if not query:
            return
        for sub in ("Tacoma", "MechanicAdvice"):
            for post in self.search(sub, query):
                if post.get("score", 0) < 5:
                    continue
                quality = 5 if post.get("score", 0) > 100 else 4 if post.get("score", 0) > 30 else 3
                yield ScrapedMediaLink(
                    maintenance_type_id=maintenance_type_id,
                    media_type="forum_thread",
                    title=post["title"][:200],
                    url=f"https://www.reddit.com{post['permalink']}",
                    source_name=f"r/{sub}",
                    notes=f"score={post.get('score')}, comments={post.get('num_comments')}",
                    quality_score=quality,
                )

"""Base scraper class.

Provides:
  - Configurable per-source rate limit (default 1 req / 2 s).
  - Disk caching (24h TTL by default).
  - Tenacity retries with exponential backoff on 429/503/connection errors.
  - User-Agent stamped on every request.
  - robots.txt check before any new domain.
  - JSONL logging of every fact emitted.

Subclasses implement scrape_for_job(maintenance_type_id) which yields
typed pydantic models from scraper.models.
"""
from __future__ import annotations

import hashlib
import json
import time
import logging
import urllib.robotparser
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, Optional
from urllib.parse import urlparse

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from ..models import ScrapeFact

USER_AGENT = "MechMind-PersonalScraper/0.1 (+keith personal use)"
DEFAULT_RATE_SECONDS = 2.0
CACHE_TTL_SECONDS = 24 * 60 * 60

ROOT = Path(__file__).resolve().parents[1]
CACHE_DIR = ROOT / "cache"
LOGS_DIR = ROOT / "logs"
CACHE_DIR.mkdir(parents=True, exist_ok=True)
LOGS_DIR.mkdir(parents=True, exist_ok=True)

logger = logging.getLogger(__name__)

_robots_cache: dict[str, urllib.robotparser.RobotFileParser] = {}


class RobotsDisallowed(Exception):
    """robots.txt forbids this URL for our user agent."""

    def __init__(self, url: str) -> None:
        super().__init__(f"robots.txt disallows {url}")
        self.url = url


def _robots_for(url: str) -> urllib.robotparser.RobotFileParser:
    parsed = urlparse(url)
    base = f"{parsed.scheme}://{parsed.netloc}"
    if base in _robots_cache:
        return _robots_cache[base]
    rp = urllib.robotparser.RobotFileParser()
    rp.set_url(f"{base}/robots.txt")
    try:
        rp.read()
    except Exception as e:
        logger.warning("robots.txt fetch failed for %s: %s — defaulting to permissive", base, e)
    _robots_cache[base] = rp
    return rp


def is_allowed_by_robots(url: str) -> bool:
    rp = _robots_for(url)
    try:
        return rp.can_fetch(USER_AGENT, url)
    except Exception:
        return True


class RateLimiter:
    def __init__(self, seconds: float):
        self.seconds = seconds
        self._last = 0.0

    def wait(self) -> None:
        elapsed = time.monotonic() - self._last
        if elapsed < self.seconds:
            time.sleep(self.seconds - elapsed)
        self._last = time.monotonic()


class JsonlFactLogger:
    def __init__(self, source_name: str):
        ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        self.path = LOGS_DIR / f"scrape-{source_name}-{ts}.jsonl"

    def log(self, fact: ScrapeFact) -> None:
        with self.path.open("a", encoding="utf-8") as f:
            f.write(fact.model_dump_json() + "\n")


class BaseScraper:
    name: str = "base"
    rate_seconds: float = DEFAULT_RATE_SECONDS
    cache_ttl_seconds: int = CACHE_TTL_SECONDS

    def __init__(self, *, rate_seconds: Optional[float] = None) -> None:
        self.rate_limiter = RateLimiter(rate_seconds or self.rate_seconds)
        self.fact_logger = JsonlFactLogger(self.name)
        self._client = httpx.Client(
            headers={"User-Agent": USER_AGENT},
            timeout=30.0,
            follow_redirects=True,
        )

    # ── public API ────────────────────────────────────────────────────────
    def scrape_for_job(self, maintenance_type_id: str) -> Iterable:  # noqa: ANN201
        """Yield pydantic models scraped for a single canonical job."""
        raise NotImplementedError

    # ── helpers ───────────────────────────────────────────────────────────
    def fetch(self, url: str, *, allow_cache: bool = True) -> str:
        # robots.txt is a hard, non-retryable gate — check before entering
        # the retry wrapper so we don't waste backoff cycles on a permanent
        # disallow. The pipeline catches RobotsDisallowed and skips the URL.
        if not is_allowed_by_robots(url):
            raise RobotsDisallowed(url)

        cache_path = self._cache_path_for(url)
        if allow_cache and cache_path.exists():
            age = time.time() - cache_path.stat().st_mtime
            if age < self.cache_ttl_seconds:
                return cache_path.read_text(encoding="utf-8")

        return self._fetch_with_retry(url, cache_path)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=2, min=2, max=20),
        retry=retry_if_exception_type((httpx.HTTPError,)),
        reraise=True,
    )
    def _fetch_with_retry(self, url: str, cache_path: Path) -> str:
        self.rate_limiter.wait()
        logger.info("[%s] GET %s", self.name, url)
        res = self._client.get(url)
        res.raise_for_status()
        text = res.text
        cache_path.write_text(text, encoding="utf-8")
        return text

    def _cache_path_for(self, url: str) -> Path:
        h = hashlib.sha256(url.encode("utf-8")).hexdigest()[:24]
        d = CACHE_DIR / self.name
        d.mkdir(parents=True, exist_ok=True)
        return d / f"{h}.html"

    def emit_fact(
        self,
        source_url: str,
        fact_type: str,
        value: dict,
        confidence: float = 0.5,
    ) -> None:
        self.fact_logger.log(
            ScrapeFact(
                source=self.name,
                source_url=source_url,
                fact_type=fact_type,
                value=value,
                confidence=confidence,
            )
        )

    def close(self) -> None:
        try:
            self._client.close()
        except Exception:
            pass

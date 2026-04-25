"""Loader — writes scraped pydantic models into the SQLite DB.

The Expo app uses lib/db (TS) for runtime; this loader reaches the same
file directly via the `sqlite3` stdlib module so we can populate before
the app is even started.

DB path: by default reads $MECHMIND_DB or falls back to a local
mechmind.db at the repo root for development.
"""
from __future__ import annotations

import json
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

from .models import ScrapedMediaLink, ScrapedPart, ScrapedProcedureStep, ScrapedTorqueSpec

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = REPO_ROOT / "mechmind.db"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _conn(db_path: Path | None = None) -> sqlite3.Connection:
    p = db_path or Path(os.environ.get("MECHMIND_DB", DEFAULT_DB))
    p.parent.mkdir(parents=True, exist_ok=True)
    return sqlite3.connect(p)


def load_parts(items: Iterable[ScrapedPart], db_path: Path | None = None) -> int:
    n = 0
    with _conn(db_path) as c:
        for it in items:
            c.execute(
                """INSERT INTO parts (id, maintenance_type_id, part_role, manufacturer, is_oem,
                   part_number, description, spec, source_url, source_name, verified, conflict, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    str(uuid.uuid4()),
                    it.maintenance_type_id,
                    it.part_role,
                    it.manufacturer,
                    1 if it.is_oem else 0,
                    it.part_number,
                    it.description,
                    it.spec,
                    it.source_url,
                    it.source_name,
                    1 if it.verified else 0,
                    1 if it.conflict else 0,
                    _now(),
                ),
            )
            n += 1
        c.commit()
    return n


def load_torque_specs(items: Iterable[ScrapedTorqueSpec], db_path: Path | None = None) -> int:
    n = 0
    with _conn(db_path) as c:
        for it in items:
            c.execute(
                """INSERT INTO torque_specs (id, maintenance_type_id, fastener_name, value_ft_lbs,
                   value_nm, socket_size, notes, source_url, source_name, verified, conflict, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    str(uuid.uuid4()),
                    it.maintenance_type_id,
                    it.fastener_name,
                    it.value_ft_lbs,
                    it.value_nm,
                    it.socket_size,
                    it.notes,
                    it.source_url,
                    it.source_name,
                    1 if it.verified else 0,
                    1 if it.conflict else 0,
                    _now(),
                ),
            )
            n += 1
        c.commit()
    return n


def load_media_links(items: Iterable[ScrapedMediaLink], db_path: Path | None = None) -> int:
    n = 0
    with _conn(db_path) as c:
        for it in items:
            c.execute(
                """INSERT INTO media_links (id, maintenance_type_id, media_type, title, url,
                   source_name, notes, quality_score)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    str(uuid.uuid4()),
                    it.maintenance_type_id,
                    it.media_type,
                    it.title,
                    it.url,
                    it.source_name,
                    it.notes,
                    it.quality_score,
                ),
            )
            n += 1
        c.commit()
    return n


def load_procedures(items: Iterable[ScrapedProcedureStep], db_path: Path | None = None) -> int:
    n = 0
    with _conn(db_path) as c:
        for it in items:
            c.execute(
                """INSERT INTO procedures (id, maintenance_type_id, step_number, title, detail,
                   warning, source_url, source_name)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    str(uuid.uuid4()),
                    it.maintenance_type_id,
                    it.step_number,
                    it.title,
                    it.detail,
                    it.warning,
                    it.source_url,
                    it.source_name,
                ),
            )
            n += 1
        c.commit()
    return n

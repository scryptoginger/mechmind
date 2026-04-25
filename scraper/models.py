"""Pydantic models that mirror the SQLite schema in lib/db/schema.ts.

The loader (loader.py) bridges these into INSERT statements. Keeping the
field names parallel to the camelCase TS interfaces makes it easy to
diff drift between the two layers.
"""
from __future__ import annotations

from typing import Optional, Literal
from pydantic import BaseModel, Field, HttpUrl


class ScrapedPart(BaseModel):
    maintenance_type_id: str
    part_role: str
    manufacturer: Optional[str] = None
    is_oem: bool
    part_number: Optional[str] = None
    description: Optional[str] = None
    spec: Optional[str] = None
    source_url: Optional[str] = None
    source_name: Optional[str] = None
    verified: bool = False
    conflict: bool = False


class ScrapedTorqueSpec(BaseModel):
    maintenance_type_id: str
    fastener_name: str
    value_ft_lbs: Optional[float] = None
    value_nm: Optional[float] = None
    socket_size: Optional[str] = None
    notes: Optional[str] = None
    source_url: Optional[str] = None
    source_name: Optional[str] = None
    verified: bool = False
    conflict: bool = False


class ScrapedProcedureStep(BaseModel):
    maintenance_type_id: str
    step_number: int
    title: str
    detail: str
    warning: Optional[str] = None
    source_url: Optional[str] = None
    source_name: Optional[str] = None


class ScrapedMediaLink(BaseModel):
    maintenance_type_id: str
    media_type: Literal["youtube", "forum_thread", "article"]
    title: str
    url: str
    source_name: Optional[str] = None
    notes: Optional[str] = None
    quality_score: Optional[int] = Field(default=None, ge=1, le=5)


class ScrapeFact(BaseModel):
    """Generic structured fact emitted to logs/scrape-*.jsonl."""
    source: str
    source_url: str
    fact_type: str
    value: dict
    confidence: float = Field(ge=0.0, le=1.0)

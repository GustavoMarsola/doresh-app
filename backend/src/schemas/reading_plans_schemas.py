from uuid import UUID
from datetime import date, datetime
from typing import Literal, Optional, List
from pydantic import BaseModel, ConfigDict, Field


class PostReadingPlanSchema(BaseModel):
    """
    Start a plan from the catalogue. Rhythm fields left out use the plan's defaults;
    `book` is required by plans where the user picks the book.
    """
    model_config = ConfigDict(extra="ignore")

    plan_slug:  str                       = Field(..., min_length=1, max_length=60)
    book:       Optional[str]             = Field(None, min_length=1, max_length=40)
    books:      Optional[List[str]]       = Field(None, min_length=1, max_length=66)  # custom plans
    title:      Optional[str]             = Field(None, max_length=80)                # custom plans
    start_date: Optional[date]            = None
    total_days: Optional[int]             = Field(None, ge=7, le=1464)
    weekdays:   Optional[List[int]]       = Field(None, min_length=1, max_length=7)


class PatchReadingPlanSchema(BaseModel):
    """Change the rhythm. Progress (verses read) is kept; the days are re-split."""
    model_config = ConfigDict(extra="ignore")

    start_date: Optional[date]      = None
    total_days: Optional[int]       = Field(None, ge=7, le=1464)
    weekdays:   Optional[List[int]] = Field(None, min_length=1, max_length=7)


class PostRealignSchema(BaseModel):
    """`today` comes from the client, in the user's own time zone."""
    today: date


class ReadingPlanCatalogItem(BaseModel):
    slug:             str
    title:            str
    description:      str
    needs_book:       bool
    needs_books:      bool
    default_days:     Optional[int]
    default_weekdays: List[int]


class ReadingPlanCatalogResponse(BaseModel):
    plans: List[ReadingPlanCatalogItem]


class PassageOut(BaseModel):
    book:        str
    chapter:     int
    verse_start: int
    verse_end:   int
    whole_chapter: bool


class ReadingPlanDayOut(BaseModel):
    index:    int
    date:     date
    status:   Literal["read", "partial", "unread"]
    passages: List[PassageOut]


class ReadingPlanSummary(BaseModel):
    id:           UUID
    plan_slug:    str
    title:        str
    book:         Optional[str]
    books:        Optional[List[str]]
    start_date:   date
    end_date:     date
    total_days:   int
    weekdays:     List[int]
    reading_days: int
    days_read:    int
    next_day:     Optional[ReadingPlanDayOut]  # first day not fully read; None when finished
    completed:    bool
    created_at:   datetime
    updated_at:   datetime


class ReadingPlanPreview(BaseModel):
    """The days a plan would have, from POST /reading-plans/preview (nothing is saved)."""
    title:        str
    books:        Optional[List[str]]
    start_date:   date
    end_date:     date
    total_days:   int
    weekdays:     List[int]
    reading_days: int
    days:         List[ReadingPlanDayOut]


class ReadingPlansResponse(BaseModel):
    plans: List[ReadingPlanSummary]


class ReadingPlanDetail(ReadingPlanSummary):
    days: List[ReadingPlanDayOut]


class ReadingPlanResponse(BaseModel):
    plan: ReadingPlanDetail

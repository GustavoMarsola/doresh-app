"""
Reading plans: a plan's *content* (ordered tracks of Bible text) is kept apart from its *rhythm*
(start date, calendar span, reading weekdays). The rhythm decides how many reading days there
are; each track is then split into that many days, balanced by verse count.

Progress is stored as the verses read, not as day numbers, so changing the rhythm re-splits the
plan without losing anything that was already read.
"""
import csv
import json
from bisect import bisect_left
from dataclasses import dataclass
from datetime import date, timedelta
from functools import lru_cache
from pathlib import Path

from src.common.bible.helpers import bible_book_slug, get_verse_counts

_DIR       = Path(__file__).resolve().parent
_BIBLE_DIR = _DIR.parent / "bible"

ALL_WEEKDAYS = (1, 2, 3, 4, 5, 6, 7)  # ISO: 1 = Monday … 7 = Sunday
MIN_TOTAL_DAYS = 7
MAX_TOTAL_DAYS = 4 * 366


class PlanError(ValueError):
    """A plan or rhythm that can't be built. `code` is the API error code."""

    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


@dataclass(frozen=True)
class Passage:
    book:        str  # display name ("1 Coríntios")
    slug:        str  # Bible file key ("1_corintios")
    chapter:     int
    verse_start: int
    verse_end:   int


@dataclass(frozen=True)
class PlanDay:
    index:    int  # 1-based
    date:     date
    passages: tuple[Passage, ...]


@dataclass(frozen=True)
class PlanDefinition:
    slug:             str
    title:            str
    description:      str
    tracks:           tuple[tuple[str, str], ...] | None  # (from book, to book); None = the user picks a book
    default_days:     int | None
    default_weekdays: tuple[int, ...]

    @property
    def needs_book(self) -> bool:
        return self.tracks is None


# ── Bible books and the catalogue ──

@lru_cache(maxsize=1)
def canonical_books() -> tuple[str, ...]:
    """The 66 books in canonical order, by display name."""
    with open(_BIBLE_DIR / "bible_books.csv", encoding="utf-8") as f:
        return tuple(row["book_name"] for row in csv.DictReader(f))


def find_book(name_or_slug: str) -> str | None:
    """Display name of a book given its name or slug ("joao" → "João")."""
    slug = bible_book_slug(name_or_slug)
    return next((name for name in canonical_books() if bible_book_slug(name) == slug), None)


@lru_cache(maxsize=1)
def plan_catalog() -> dict[str, PlanDefinition]:
    with open(_DIR / "catalog.json", encoding="utf-8") as f:
        raw = json.load(f)
    return {
        item["slug"]: PlanDefinition(
            slug=item["slug"],
            title=item["title"],
            description=item["description"],
            tracks=None if item["tracks"] == "book" else tuple((t["from"], t["to"]) for t in item["tracks"]),
            default_days=item["default_days"],
            default_weekdays=tuple(item["default_weekdays"]),
        )
        for item in raw
    }


def get_plan(slug: str) -> PlanDefinition:
    plan = plan_catalog().get(slug)
    if plan is None:
        raise PlanError("reading_plan.unknown_plan")
    return plan


def plan_tracks(plan: PlanDefinition, book: str | None) -> tuple[tuple[str, str], ...]:
    if plan.tracks is not None:
        return plan.tracks
    name = find_book(book) if book else None
    if name is None:
        raise PlanError("reading_plan.invalid_book")
    return ((name, name),)


def default_total_days(plan: PlanDefinition, book: str | None) -> int:
    if plan.default_days:
        return plan.default_days
    # "Um livro": about one chapter a day, at least a week
    name = find_book(book) if book else None
    if name is None:
        raise PlanError("reading_plan.invalid_book")
    return max(MIN_TOTAL_DAYS, len(get_verse_counts(bible_book_slug(name))))


@dataclass(frozen=True)
class _Chapter:
    book:   str
    slug:   str
    number: int
    verses: int


def _track_chapters(first: str, last: str) -> list[_Chapter]:
    books = canonical_books()
    start, end = books.index(first), books.index(last)
    chapters: list[_Chapter] = []
    for name in books[start:end + 1]:
        slug = bible_book_slug(name)
        for number, verses in enumerate(get_verse_counts(slug), start=1):
            chapters.append(_Chapter(name, slug, number, verses))
    return chapters


# ── Splitting a track into days ──

def _split_by_chapters(chapters: list[_Chapter], days: int) -> list[list[Passage]]:
    """Whole chapters per day; day boundaries placed where the running verse total is closest to even."""
    cumulative = [0]
    for chapter in chapters:
        cumulative.append(cumulative[-1] + chapter.verses)
    total, bounds = cumulative[-1], [0]
    for k in range(1, days):
        target = total * k / days
        i = bisect_left(cumulative, target)
        if i > 0 and (i == len(cumulative) or target - cumulative[i - 1] <= cumulative[i] - target):
            i -= 1
        # every day gets at least one chapter
        i = max(i, bounds[-1] + 1)
        i = min(i, len(chapters) - (days - k))
        bounds.append(i)
    bounds.append(len(chapters))
    return [
        [Passage(c.book, c.slug, c.number, 1, c.verses) for c in chapters[a:b]]
        for a, b in zip(bounds, bounds[1:])
    ]


def _split_by_verses(chapters: list[_Chapter], days: int) -> list[list[Passage]]:
    """Fewer chapters than days: split inside chapters, about the same number of verses per day."""
    verses = [(c, v) for c in chapters for v in range(1, c.verses + 1)]
    total  = len(verses)
    bounds = [round(total * k / days) for k in range(days + 1)]
    result = []
    for a, b in zip(bounds, bounds[1:]):
        passages: list[Passage] = []
        for chapter, verse in verses[a:b]:
            last = passages[-1] if passages else None
            if last and last.slug == chapter.slug and last.chapter == chapter.number:
                passages[-1] = Passage(last.book, last.slug, last.chapter, last.verse_start, verse)
            else:
                passages.append(Passage(chapter.book, chapter.slug, chapter.number, verse, verse))
        result.append(passages)
    return result


def split_track(first: str, last: str, days: int) -> list[list[Passage]]:
    chapters = _track_chapters(first, last)
    if days > sum(c.verses for c in chapters):
        raise PlanError("reading_plan.too_many_days")
    if len(chapters) >= days:
        return _split_by_chapters(chapters, days)
    return _split_by_verses(chapters, days)


# ── Rhythm ──

def reading_dates(start: date, total_days: int, weekdays: tuple[int, ...]) -> list[date]:
    """Reading days inside [start, start + total_days)."""
    allowed = set(weekdays)
    return [d for d in (start + timedelta(days=i) for i in range(total_days)) if d.isoweekday() in allowed]


def span_for(start: date, reading_days: int, weekdays: tuple[int, ...]) -> int:
    """Smallest calendar span from `start` holding `reading_days` reading days."""
    allowed, span, found = set(weekdays), 0, 0
    while found < reading_days:
        if (start + timedelta(days=span)).isoweekday() in allowed:
            found += 1
        span += 1
    return span


def validate_rhythm(total_days: int, weekdays: tuple[int, ...]) -> None:
    if not MIN_TOTAL_DAYS <= total_days <= MAX_TOTAL_DAYS:
        raise PlanError("reading_plan.invalid_duration")
    if not weekdays or any(d not in ALL_WEEKDAYS for d in weekdays):
        raise PlanError("reading_plan.invalid_weekdays")


def build_schedule(
    plan: PlanDefinition,
    book: str | None,
    start: date,
    total_days: int,
    weekdays: tuple[int, ...],
) -> list[PlanDay]:
    validate_rhythm(total_days, weekdays)
    dates = reading_dates(start, total_days, weekdays)
    if not dates:
        raise PlanError("reading_plan.invalid_weekdays")
    tracks = [split_track(first, last, len(dates)) for first, last in plan_tracks(plan, book)]
    return [
        PlanDay(index=i + 1, date=day, passages=tuple(p for track in tracks for p in track[i]))
        for i, day in enumerate(dates)
    ]


def realigned_start(days: list[PlanDay], next_index: int, today: date, weekdays: tuple[int, ...]) -> date:
    """Start date that puts day `next_index` on the first reading day from `today` on."""
    allowed = set(weekdays)
    anchor  = today
    while anchor.isoweekday() not in allowed:
        anchor += timedelta(days=1)
    # walk back over the reading days that come before `next_index`
    start, remaining = anchor, next_index - 1
    while remaining:
        start -= timedelta(days=1)
        if start.isoweekday() in allowed:
            remaining -= 1
    return start


# ── Progress (verses read, per chapter) ──

ReadRanges = dict[str, list[list[int]]]  # {"joao:3": [[1, 21]]}


def _key(passage: Passage) -> str:
    return f"{passage.slug}:{passage.chapter}"


def _to_ranges(verses: set[int]) -> list[list[int]]:
    ranges: list[list[int]] = []
    for verse in sorted(verses):
        if ranges and ranges[-1][1] == verse - 1:
            ranges[-1][1] = verse
        else:
            ranges.append([verse, verse])
    return ranges


def _verses(ranges: list[list[int]]) -> set[int]:
    return {v for start, end in ranges for v in range(start, end + 1)}


def mark_read(read: ReadRanges, passages: tuple[Passage, ...]) -> ReadRanges:
    updated = {key: [list(r) for r in ranges] for key, ranges in read.items()}
    for p in passages:
        verses = _verses(updated.get(_key(p), [])) | set(range(p.verse_start, p.verse_end + 1))
        updated[_key(p)] = _to_ranges(verses)
    return updated


def mark_unread(read: ReadRanges, passages: tuple[Passage, ...]) -> ReadRanges:
    updated = {key: [list(r) for r in ranges] for key, ranges in read.items()}
    for p in passages:
        verses = _verses(updated.get(_key(p), [])) - set(range(p.verse_start, p.verse_end + 1))
        if verses:
            updated[_key(p)] = _to_ranges(verses)
        else:
            updated.pop(_key(p), None)
    return updated


def day_status(read: ReadRanges, day: PlanDay) -> str:
    """'read' when every verse of the day was read, 'partial' when some were, else 'unread'."""
    wanted = covered = 0
    for p in day.passages:
        verses   = set(range(p.verse_start, p.verse_end + 1))
        wanted  += len(verses)
        covered += len(verses & _verses(read.get(_key(p), [])))
    if covered == 0:
        return "unread"
    return "read" if covered == wanted else "partial"

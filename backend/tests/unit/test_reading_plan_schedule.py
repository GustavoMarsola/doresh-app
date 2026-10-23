"""
The reading plan engine: splitting tracks into balanced days, the rhythm (dates) and progress
kept as verses read, so changing the rhythm never loses what was read.
"""
from datetime import date

import pytest

from src.common.reading_plans import (
    ALL_WEEKDAYS,
    PlanError,
    build_schedule,
    day_status,
    get_plan,
    mark_read,
    mark_unread,
    plan_catalog,
    realigned_start,
    span_for,
    split_track,
)

MONDAY   = date(2026, 10, 26)
WEEKDAYS = (1, 2, 3, 4, 5)


def verses_in(passages) -> int:
    return sum(p.verse_end - p.verse_start + 1 for p in passages)


def schedule(slug="biblia-em-1-ano", total_days=365, weekdays=ALL_WEEKDAYS, start=MONDAY, book=None):
    return build_schedule(get_plan(slug), book, start, total_days, weekdays)


class TestSplitTrack:
    def test_covers_the_whole_track_once_in_order(self):
        days     = split_track("Mateus", "João", 30)
        chapters = [(p.book, p.chapter) for day in days for p in day]
        assert (len(days), chapters[0], chapters[-1], len(chapters), len(set(chapters))) == (
            30, ("Mateus", 1), ("João", 21), 89, 89,
        )

    def test_days_are_balanced_by_verse_count(self):
        # Whole chapters vary a lot (Lucas 1 has 80 verses), so "balanced" means no day triples another
        sizes = [verses_in(day) for day in split_track("Mateus", "João", 30)]
        assert max(sizes) < 3 * min(sizes)

    def test_more_days_than_chapters_splits_inside_chapters(self):
        days = split_track("Provérbios", "Provérbios", 150)
        assert (len(days), all(day for day in days), sum(verses_in(d) for d in days)) == (150, True, 915)

    def test_more_days_than_verses_is_rejected(self):
        with pytest.raises(PlanError) as error:
            split_track("Obadias", "Obadias", 30)
        assert error.value.code == "reading_plan.too_many_days"


class TestRhythm:
    def test_catalogue_defaults_build(self):
        sizes = {
            slug: len(schedule(slug, plan.default_days or 16, plan.default_weekdays, book="Romanos"))
            for slug, plan in plan_catalog().items()
        }
        assert sizes == {
            "biblia-em-1-ano": 365, "novo-testamento-260-dias": 260, "evangelhos": 90,
            "salmos-e-proverbios": 150, "um-livro": 16,
        }

    def test_weekdays_only_skips_weekends(self):
        days = schedule(weekdays=WEEKDAYS)
        assert {d.date.isoweekday() for d in days} == set(WEEKDAYS)

    def test_bible_in_a_year_reads_both_testaments_every_day(self):
        books = {p.book for p in schedule()[0].passages}
        assert books == {"Gênesis", "Mateus"}

    def test_book_plan_requires_a_known_book(self):
        with pytest.raises(PlanError) as error:
            schedule("um-livro", 30, book="Livro que não existe")
        assert error.value.code == "reading_plan.invalid_book"

    def test_span_for_fits_exactly_the_reading_days(self):
        span = span_for(MONDAY, 10, WEEKDAYS)
        assert (span, len(schedule(total_days=span, weekdays=WEEKDAYS))) == (12, 10)


class TestProgress:
    def test_marked_day_is_read_and_unmarked_day_is_unread(self):
        day  = schedule()[0]
        read = mark_read({}, day.passages)
        assert (day_status(read, day), day_status(mark_unread(read, day.passages), day)) == ("read", "unread")

    def test_longer_rhythm_keeps_what_was_read(self):
        one_year = schedule()
        read     = mark_read(mark_read({}, one_year[0].passages), one_year[1].passages)
        statuses = [day_status(read, d) for d in schedule(total_days=730)[:5]]
        assert statuses == ["read", "read", "read", "read", "unread"]

    def test_shorter_rhythm_shows_a_partly_read_day(self):
        two_years = schedule(total_days=730)
        read      = mark_read({}, two_years[0].passages)
        assert day_status(read, schedule()[0]) == "partial"


class TestRealign:
    def test_next_day_lands_on_today_keeping_the_number_of_days(self):
        days      = schedule("evangelhos", 90)
        today     = date(2026, 11, 20)
        start     = realigned_start(days, 5, today, ALL_WEEKDAYS)
        realigned = schedule("evangelhos", span_for(start, 90, ALL_WEEKDAYS), start=start)
        assert (realigned[4].date, len(realigned)) == (today, 90)

    def test_on_a_rest_day_the_next_day_lands_on_the_next_reading_day(self):
        saturday = date(2026, 11, 21)
        start    = realigned_start([], 3, saturday, WEEKDAYS)
        days     = schedule(total_days=span_for(start, 365, WEEKDAYS), weekdays=WEEKDAYS, start=start)
        assert days[2].date == date(2026, 11, 23)

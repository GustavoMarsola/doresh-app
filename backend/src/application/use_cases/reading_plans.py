from datetime import datetime, timezone
from uuid import UUID
from fastapi import HTTPException, status
from src.common.bible.helpers import get_verse_counts
from src.common.reading_plans import (
    PlanDay,
    PlanError,
    build_schedule,
    day_status,
    default_total_days,
    find_book,
    get_plan,
    mark_read,
    mark_unread,
    plan_catalog,
    realigned_start,
    span_for,
    MAX_TOTAL_DAYS,
)
from src.infrastructure.database.models.reading_plans_models import UserReadingPlanModel
from src.infrastructure.repositories.app_repository import AppRepository
from src.infrastructure.repositories.redis_repository import RedisRepository
from src.schemas.reading_plans_schemas import (
    PassageOut,
    PatchReadingPlanSchema,
    PostReadingPlanSchema,
    PostRealignSchema,
    ReadingPlanCatalogItem,
    ReadingPlanCatalogResponse,
    ReadingPlanDayOut,
    ReadingPlanDetail,
    ReadingPlanResponse,
    ReadingPlansResponse,
    ReadingPlanSummary,
)
from src.common.utilities import set_local_time


def _user_id(payload_token: dict) -> UUID:
    return UUID(payload_token["sub"])


def _utc(value: datetime) -> datetime:
    # O banco grava timestamp sem fuso, em UTC: explicita o fuso para o cliente converter certo
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def _not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="reading_plan.not_found")


def _invalid(error: PlanError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=error.code)


def _weekdays(value: list[int] | str) -> tuple[int, ...]:
    return tuple(sorted({int(d) for d in value}))


def _schedule(plan: UserReadingPlanModel) -> list[PlanDay]:
    return build_schedule(
        get_plan(plan.plan_slug), plan.book, plan.start_date, plan.total_days, _weekdays(plan.weekdays)
    )


def _day_out(day: PlanDay, read: dict) -> ReadingPlanDayOut:
    return ReadingPlanDayOut(
        index=day.index,
        date=day.date,
        status=day_status(read, day),
        passages=[
            PassageOut(
                book=p.book,
                chapter=p.chapter,
                verse_start=p.verse_start,
                verse_end=p.verse_end,
                whole_chapter=p.verse_start == 1 and p.verse_end == get_verse_counts(p.slug)[p.chapter - 1],
            )
            for p in day.passages
        ],
    )


def _summary_fields(plan: UserReadingPlanModel, days: list[ReadingPlanDayOut]) -> dict:
    next_day = next((d for d in days if d.status != "read"), None)
    return {
        "id":           plan.id,
        "plan_slug":    plan.plan_slug,
        "title":        f"Leitura de {plan.book}" if plan.book else get_plan(plan.plan_slug).title,
        "book":         plan.book,
        "start_date":   plan.start_date,
        "end_date":     days[-1].date,
        "total_days":   plan.total_days,
        "weekdays":     list(_weekdays(plan.weekdays)),
        "reading_days": len(days),
        "days_read":    sum(d.status == "read" for d in days),
        "next_day":     next_day,
        "completed":    next_day is None,
        "created_at":   _utc(plan.created_at),
        "updated_at":   _utc(plan.updated_at),
    }


def _days_out(plan: UserReadingPlanModel) -> list[ReadingPlanDayOut]:
    read = plan.read_ranges or {}
    return [_day_out(day, read) for day in _schedule(plan)]


class ReadingPlansUseCase:
    def __init__(self, repository: AppRepository, redis_repository: RedisRepository) -> None:
        self.repository       = repository
        self.redis_repository = redis_repository

    def get_catalog(self) -> ReadingPlanCatalogResponse:
        return ReadingPlanCatalogResponse(plans=[
            ReadingPlanCatalogItem(
                slug=p.slug,
                title=p.title,
                description=p.description,
                needs_book=p.needs_book,
                default_days=p.default_days,
                default_weekdays=list(p.default_weekdays),
            )
            for p in plan_catalog().values()
        ])

    async def list_plans(self, payload_token: dict) -> ReadingPlansResponse:
        plans = await self.repository.reading_plans.list_by_user(_user_id(payload_token))
        return ReadingPlansResponse(
            plans=[ReadingPlanSummary(**_summary_fields(plan, _days_out(plan))) for plan in plans]
        )

    async def get_plan(self, payload_token: dict, plan_id: UUID) -> ReadingPlanResponse:
        plan = await self.repository.reading_plans.get(_user_id(payload_token), plan_id)
        if not plan:
            raise _not_found()
        return self._detail(plan)

    async def start_plan(self, payload_token: dict, data: PostReadingPlanSchema) -> ReadingPlanResponse:
        try:
            definition = get_plan(data.plan_slug)
            book       = None
            if definition.needs_book:
                book = find_book(data.book) if data.book else None
                if book is None:
                    raise PlanError("reading_plan.invalid_book")
            fields = {
                "plan_slug":  definition.slug,
                "book":       book,
                "start_date": data.start_date or set_local_time().date(),
                "total_days": data.total_days or default_total_days(definition, book),
                "weekdays":   "".join(map(str, _weekdays(data.weekdays or definition.default_weekdays))),
            }
            build_schedule(definition, book, fields["start_date"], fields["total_days"], _weekdays(fields["weekdays"]))
        except PlanError as error:
            raise _invalid(error)
        plan = await self.repository.reading_plans.create(_user_id(payload_token), fields)
        return self._detail(plan)

    async def update_rhythm(self, payload_token: dict, plan_id: UUID, data: PatchReadingPlanSchema) -> ReadingPlanResponse:
        plan = await self.repository.reading_plans.get(_user_id(payload_token), plan_id, for_update=True)
        if not plan:
            await self.repository.reading_plans.rollback()
            raise _not_found()
        changes: dict = {}
        if data.start_date is not None:
            changes["start_date"] = data.start_date
        if data.total_days is not None:
            changes["total_days"] = data.total_days
        if data.weekdays is not None:
            changes["weekdays"] = "".join(map(str, _weekdays(data.weekdays)))
        try:
            build_schedule(
                get_plan(plan.plan_slug),
                plan.book,
                changes.get("start_date", plan.start_date),
                changes.get("total_days", plan.total_days),
                _weekdays(changes.get("weekdays", plan.weekdays)),
            )
        except PlanError as error:
            await self.repository.reading_plans.rollback()
            raise _invalid(error)
        plan = await self.repository.reading_plans.save(plan, changes)
        return self._detail(plan)

    async def set_day_read(self, payload_token: dict, plan_id: UUID, day_index: int, read: bool) -> ReadingPlanResponse:
        plan = await self.repository.reading_plans.get(_user_id(payload_token), plan_id, for_update=True)
        if not plan:
            await self.repository.reading_plans.rollback()
            raise _not_found()
        days = _schedule(plan)
        if not 1 <= day_index <= len(days):
            await self.repository.reading_plans.rollback()
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="reading_plan.day_not_found")
        update  = mark_read if read else mark_unread
        ranges  = update(plan.read_ranges or {}, days[day_index - 1].passages)
        plan    = await self.repository.reading_plans.save(plan, {"read_ranges": ranges})
        return self._detail(plan)

    async def realign(self, payload_token: dict, plan_id: UUID, data: PostRealignSchema) -> ReadingPlanResponse:
        """Move the dates so the next day to read falls on `today`; the number of reading days stays the same."""
        plan = await self.repository.reading_plans.get(_user_id(payload_token), plan_id, for_update=True)
        if not plan:
            await self.repository.reading_plans.rollback()
            raise _not_found()
        days     = _days_out(plan)
        next_day = next((d for d in days if d.status != "read"), None)
        if next_day is None:
            await self.repository.reading_plans.rollback()
            return self._detail(plan)
        weekdays   = _weekdays(plan.weekdays)
        start      = realigned_start(_schedule(plan), next_day.index, data.today, weekdays)
        total_days = span_for(start, len(days), weekdays)
        if total_days > MAX_TOTAL_DAYS:
            await self.repository.reading_plans.rollback()
            raise _invalid(PlanError("reading_plan.invalid_duration"))
        plan = await self.repository.reading_plans.save(plan, {"start_date": start, "total_days": total_days})
        return self._detail(plan)

    async def delete_plan(self, payload_token: dict, plan_id: UUID) -> None:
        if not await self.repository.reading_plans.delete(_user_id(payload_token), plan_id):
            raise _not_found()

    @staticmethod
    def _detail(plan: UserReadingPlanModel) -> ReadingPlanResponse:
        days = _days_out(plan)
        return ReadingPlanResponse(plan=ReadingPlanDetail(**_summary_fields(plan, days), days=days))

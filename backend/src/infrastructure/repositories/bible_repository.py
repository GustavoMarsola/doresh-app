from uuid import UUID
from fastapi import Depends
from sqlalchemy import select, delete, func
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from src.infrastructure.repositories import get_session_repo
from src.infrastructure.database.models.bible_models import BibleCommentsModel, BibleHighlightsModel
from src.infrastructure.database.models.reading_group_mural_models import ReadingGroupShareModel


class BibleRepository:
    def __init__(self, db_session: AsyncSession = Depends(get_session_repo)) -> None:
        self.db_session = db_session

    async def get_chapter_highlights(self, user_id: UUID, book: str, chapter: int) -> list[BibleHighlightsModel]:
        stmt = (
            select(BibleHighlightsModel)
            .where(
                BibleHighlightsModel.user_id == user_id,
                BibleHighlightsModel.book == book,
                BibleHighlightsModel.chapter == chapter,
            )
            .order_by(BibleHighlightsModel.verse)
        )
        result = await self.db_session.execute(stmt)
        return list(result.scalars().all())

    async def upsert_highlights(self, user_id: UUID, book: str, chapter: int, verses: list[int], color: str) -> None:
        rows = [
            {"user_id": user_id, "book": book, "chapter": chapter, "verse": verse, "color": color}
            for verse in sorted(set(verses))
        ]
        stmt = insert(BibleHighlightsModel).values(rows)
        stmt = stmt.on_conflict_do_update(
            constraint="uq_bible_highlights_user_verse",
            set_={"color": stmt.excluded.color, "updated_at": func.now()},
        )
        await self.db_session.execute(stmt)
        await self.db_session.commit()

    async def delete_highlights(self, user_id: UUID, book: str, chapter: int, verses: list[int]) -> None:
        stmt = delete(BibleHighlightsModel).where(
            BibleHighlightsModel.user_id == user_id,
            BibleHighlightsModel.book == book,
            BibleHighlightsModel.chapter == chapter,
            BibleHighlightsModel.verse.in_(verses),
        )
        await self.db_session.execute(stmt)
        await self.db_session.commit()

    async def get_chapter_comments(self, user_id: UUID, book: str, chapter: int) -> list[BibleCommentsModel]:
        stmt = (
            select(BibleCommentsModel)
            .where(
                BibleCommentsModel.user_id == user_id,
                BibleCommentsModel.book == book,
                BibleCommentsModel.chapter == chapter,
            )
            .order_by(BibleCommentsModel.verse_start, BibleCommentsModel.created_at)
        )
        result = await self.db_session.execute(stmt)
        return list(result.scalars().all())

    async def register_bible_comment(self, data: dict) -> BibleCommentsModel:
        comment = BibleCommentsModel(**data)
        self.db_session.add(comment)
        await self.db_session.commit()
        await self.db_session.refresh(comment)
        return comment

    async def get_comment(self, user_id: UUID, comment_id: UUID) -> BibleCommentsModel | None:
        stmt = select(BibleCommentsModel).where(
            BibleCommentsModel.id == comment_id, BibleCommentsModel.user_id == user_id
        )
        result = await self.db_session.execute(stmt)
        return result.scalar_one_or_none()

    async def delete_comment(self, user_id: UUID, comment_id: UUID) -> bool:
        # A deleted comment also leaves every group mural it was shared on
        await self.db_session.execute(delete(ReadingGroupShareModel).where(
            ReadingGroupShareModel.comment_id == comment_id, ReadingGroupShareModel.user_id == user_id
        ))
        stmt = delete(BibleCommentsModel).where(
            BibleCommentsModel.id == comment_id,
            BibleCommentsModel.user_id == user_id,
        )
        result = await self.db_session.execute(stmt)
        await self.db_session.commit()
        return result.rowcount > 0

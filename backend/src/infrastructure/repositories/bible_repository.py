from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.infrastructure.repositories import get_session_repo
from src.infrastructure.database.models.bible_models import BibleCommentsModel, BibleHighlightsModel


class BibleRepository:
    def __init__(self, db_session: AsyncSession = Depends(get_session_repo)) -> None:
        self.db_session = db_session

    async def register_bible_highlight(self, data: dict) -> BibleHighlightsModel:
        highlight = BibleHighlightsModel(**data)
        self.db_session.add(highlight)
        await self.db_session.commit()
        await self.db_session.refresh(highlight)
        return highlight

    async def register_bible_comment(self, data: dict) -> BibleCommentsModel:
        comment = BibleCommentsModel(**data)
        self.db_session.add(comment)
        await self.db_session.commit()
        await self.db_session.refresh(comment)
        return comment

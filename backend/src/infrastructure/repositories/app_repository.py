from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.infrastructure.repositories import get_session_repo
from src.infrastructure.repositories.users_repository import UsersRepository
from src.infrastructure.repositories.studies_repository import StudiesRepository
from src.infrastructure.repositories.bible_repository import BibleRepository
from src.infrastructure.repositories.subscriptions_repository import SubscriptionsRepository


class AppRepository:
    def __init__(self, db_session: AsyncSession = Depends(get_session_repo)) -> None:
        self.users         = UsersRepository(db_session)
        self.studies       = StudiesRepository(db_session)
        self.bible         = BibleRepository(db_session)
        self.subscriptions = SubscriptionsRepository(db_session)

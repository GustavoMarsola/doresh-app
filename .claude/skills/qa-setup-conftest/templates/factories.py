"""Reference backend/tests/factories.py for Doresh: the only place seed data is built.

Defaults are fake but valid. Never real people, e-mails, CPFs or real study content.
Lines marked ADAPT depend on real model/auth signatures.
"""
import uuid
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from src.common.authentication import generate_tokens, hash_password          # ADAPT
from src.infrastructure.database.models import (                              # ADAPT
    SessionsModel, StudyModel, StudyReferenceModel, StudySectionModel, UsersModel,
)

FAKE_PASSWORD = "Senha-de-teste-123"


@dataclass(frozen=True, slots=True)
class TestUser:
    __test__ = False
    user_id: uuid.UUID
    email: str
    session_id: uuid.UUID
    token: str


def _suffix() -> str:
    return uuid.uuid4().hex[:8]


def fake_cpf() -> str:
    """11 digits with valid check digits, unique per call, obviously fake (starts with 999)."""
    base = [9, 9, 9] + [int(d) for d in f"{uuid.uuid4().int % 10**6:06d}"]
    for weight_start in (10, 11):
        total = sum(d * w for d, w in zip(base, range(weight_start, 1, -1)))
        check = (total * 10) % 11
        base.append(0 if check == 10 else check)
    return "".join(map(str, base))


async def create_user(session: AsyncSession, **overrides) -> TestUser:
    data = {
        "email": f"usuario-{_suffix()}@example.com",
        "password": hash_password(FAKE_PASSWORD),
        "document_number": fake_cpf(),
        "document_type": "CPF",
        "username": f"Usuário Teste {_suffix()}",
        "active": True,
        "verified": True,
    }
    data.update(overrides)
    user = UsersModel(**data)
    session.add(user)
    await session.flush()
    user_session = SessionsModel(user_id=user.id)
    session.add(user_session)
    await session.commit()
    tokens = generate_tokens(user.id, user_session.id)                          # ADAPT
    return TestUser(user.id, user.email, user_session.id, tokens.access_token)


async def create_study(session: AsyncSession, user: TestUser, **overrides) -> StudyModel:
    data = {
        "title": f"Estudo de teste {_suffix()}",
        "introduction": "Introdução de teste.",
        "conclusion": "Conclusão de teste.",
        "ai_generated": False,
    }
    data.update(overrides)
    study = StudyModel(**data, user_id=user.user_id)
    session.add(study)
    await session.flush()
    session.add(StudySectionModel(study_id=study.id, title="Seção 1", text="Texto de teste.", order_index=0))
    session.add(StudyReferenceModel(study_id=study.id, book="joao", chapter=3, verse_start=16, verse_end=16))
    await session.commit()
    await session.refresh(study)
    return study

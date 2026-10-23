"""
Account deletion: DELETE /user/account, confirmed with the current password, permanently
erases the user and everything they own — and nothing that belongs to anyone else.
"""
from sqlalchemy import func, select

from src.infrastructure.database.models.bible_models import BibleCommentsModel, BibleHighlightsModel
from src.infrastructure.database.models.reading_plans_models import UserReadingPlanModel
from src.infrastructure.database.models.studies_models import StudyModel
from src.infrastructure.database.models.users_models import SessionsModel, UsersModel
from src.infrastructure.database.settings import AsyncSessionLocal

ACCOUNT_URL      = "/api/v1/user/account"
AUTHENTICATE_URL = "/api/v1/user/authenticate"
PROFILE_URL      = "/api/v1/user/profile"
STUDY_URL        = "/api/v1/study"
HIGHLIGHTS_URL   = "/api/v1/bible/highlights"
COMMENTS_URL     = "/api/v1/bible/comments"

OWNED_MODELS = (StudyModel, BibleHighlightsModel, BibleCommentsModel, UserReadingPlanModel, SessionsModel)


async def add_content(client) -> None:
    """One study (with a section and a reference), one highlight, one comment and one reading plan."""
    study = await client.post(STUDY_URL, json={
        "title":      "Estudo de teste",
        "sections":   [{"title": "Ponto", "text": "Texto do ponto"}],
        "references": [{"book": "João", "chapter": 3, "verse_start": 16, "verse_end": 16}],
    })
    highlight = await client.put(HIGHLIGHTS_URL, json={"book": "João", "chapter": 3, "verses": [16], "color": "yellow"})
    comment   = await client.post(COMMENTS_URL, json={
        "book": "João", "chapter": 3, "verse_start": 16, "verse_end": 17, "comment": "Comentário de teste",
    })
    plan      = await client.post("/api/v1/reading-plans", json={"plan_slug": "evangelhos"})
    responses = (study, highlight, comment, plan)
    assert [r.status_code for r in responses] == [201, 200, 201, 201], [r.text for r in responses]


async def owned_rows(user_id) -> dict[str, int]:
    async with AsyncSessionLocal() as session:
        counts = {
            model.__tablename__: await session.scalar(select(func.count()).where(model.user_id == user_id))
            for model in OWNED_MODELS
        }
        counts["users"] = await session.scalar(select(func.count()).where(UsersModel.id == user_id))
        return counts


def delete_account(client, password: str):
    return client.request("DELETE", ACCOUNT_URL, json={"password": password})


class TestDeleteAccount:
    async def test_erases_the_user_and_all_their_data(self, client_as, user_a):
        client = await client_as(user_a)
        await add_content(client)
        response = await delete_account(client, user_a.password)
        assert (response.status_code, await owned_rows(user_a.user_id)) == (
            200,
            {"studies": 0, "bible_highlights": 0, "bible_comments": 0, "user_reading_plans": 0, "sessions": 0, "users": 0},
        )

    async def test_other_users_data_is_kept(self, client_as, user_a, user_b):
        client_a = await client_as(user_a)
        client_b = await client_as(user_b)
        await add_content(client_a)
        await add_content(client_b)
        await delete_account(client_a, user_a.password)
        assert await owned_rows(user_b.user_id) == {
            "studies": 1, "bible_highlights": 1, "bible_comments": 1, "user_reading_plans": 1, "sessions": 1, "users": 1,
        }

    async def test_token_and_login_stop_working(self, client_as, api_key_client, user_a):
        client = await client_as(user_a)
        await delete_account(client, user_a.password)
        profile = await client.get(PROFILE_URL)
        login   = await api_key_client.post(AUTHENTICATE_URL, json={"email": user_a.email, "password": user_a.password})
        assert (profile.status_code, login.status_code) == (401, 401)

    async def test_wrong_password_is_rejected_with_403_and_keeps_the_account(self, client_as, user_a):
        client   = await client_as(user_a)
        response = await delete_account(client, "senha-errada")
        assert (response.status_code, response.json()["detail"], (await owned_rows(user_a.user_id))["users"]) == (
            403, "account.invalid_password", 1,
        )

    async def test_requires_login(self, api_key_client, user_a):
        response = await delete_account(api_key_client, user_a.password)
        assert response.status_code == 401

    async def test_email_can_register_again_after_deletion(self, client_as, api_key_client, user_a):
        client = await client_as(user_a)
        await delete_account(client, user_a.password)
        response = await api_key_client.post("/api/v1/user/register", json={
            "email": user_a.email, "password": "senha-nova-123", "username": "De volta",
            "document_number": f"doc-novo-{user_a.user_id.hex[:8]}", "document_type": "CPF",
        })
        assert response.status_code == 201, response.text

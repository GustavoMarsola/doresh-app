"""
Login / session lifecycle: access + refresh tokens, rotation, reuse detection, logout
revocation and the Bearer checks of `session_token_required`.
"""
from sqlalchemy import update

from src.common.authentication import generate_email_confirmation_token
from src.common.utilities import set_local_time
from src.infrastructure.database.models.users_models import SessionsModel
from src.infrastructure.database.settings import AsyncSessionLocal

AUTHENTICATE_URL = "/api/v1/user/authenticate"
REFRESH_URL      = "/api/v1/user/refresh"
PROFILE_URL      = "/api/v1/user/profile"
LOGOUT_URL       = "/api/v1/user/logout"

LOGIN_FIELDS = {"token", "expires_at", "refresh_token", "refresh_expires_at"}
UNKNOWN_REFRESH_TOKEN = "refresh-token-que-nao-existe"


def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def login(client, user) -> dict:
    response = await client.post(AUTHENTICATE_URL, json={"email": user.email, "password": user.password})
    assert response.status_code == 200, response.text
    return response.json()


async def refresh(client, refresh_token: str):
    return await client.post(REFRESH_URL, json={"refresh_token": refresh_token})


def outcome(response) -> tuple[int, str | None]:
    return response.status_code, response.json().get("detail")


class TestAuthenticate:
    async def test_returns_token_pair_usable_on_protected_route(self, api_key_client, user_a):
        body    = await login(api_key_client, user_a)
        profile = await api_key_client.get(PROFILE_URL, headers=bearer(body["token"]))
        assert (LOGIN_FIELDS <= body.keys(), profile.status_code) == (True, 200)


class TestRefresh:
    async def test_new_access_token_reaches_protected_route(self, api_key_client, user_a):
        body      = await login(api_key_client, user_a)
        refreshed = (await refresh(api_key_client, body["refresh_token"])).json()
        profile   = await api_key_client.get(PROFILE_URL, headers=bearer(refreshed["token"]))
        assert profile.status_code == 200

    async def test_rotated_refresh_token_is_rejected(self, api_key_client, user_a):
        body = await login(api_key_client, user_a)
        await refresh(api_key_client, body["refresh_token"])
        again = await refresh(api_key_client, body["refresh_token"])
        assert outcome(again) == (401, "auth.invalid_refresh_token")

    async def test_reuse_of_previous_refresh_token_revokes_the_session(self, api_key_client, user_a):
        body    = await login(api_key_client, user_a)
        current = (await refresh(api_key_client, body["refresh_token"])).json()
        await refresh(api_key_client, body["refresh_token"])

        profile       = await api_key_client.get(PROFILE_URL, headers=bearer(current["token"]))
        refresh_again = await refresh(api_key_client, current["refresh_token"])
        assert (outcome(profile), outcome(refresh_again)) == (
            (401, "auth.session_revoked"),
            (401, "auth.invalid_refresh_token"),
        )

    async def test_unknown_refresh_token_is_rejected(self, api_key_client):
        response = await refresh(api_key_client, UNKNOWN_REFRESH_TOKEN)
        assert outcome(response) == (401, "auth.invalid_refresh_token")

    async def test_expired_refresh_token_is_rejected(self, api_key_client, user_a):
        body = await login(api_key_client, user_a)
        async with AsyncSessionLocal() as session:
            await session.execute(
                update(SessionsModel)
                .where(SessionsModel.user_id == user_a.user_id)
                .values(refresh_expires_at=set_local_time().replace(year=2000))
            )
            await session.commit()
        response = await refresh(api_key_client, body["refresh_token"])
        assert outcome(response) == (401, "auth.invalid_refresh_token")


class TestLogout:
    async def test_revokes_bearer_immediately_and_refresh_token(self, api_key_client, user_a):
        body    = await login(api_key_client, user_a)
        headers = bearer(body["token"])
        warm    = await api_key_client.get(PROFILE_URL, headers=headers)
        assert warm.status_code == 200, "precondition: session cached as active"
        logout  = await api_key_client.post(LOGOUT_URL, headers=headers)
        assert logout.status_code == 200, logout.text

        profile       = await api_key_client.get(PROFILE_URL, headers=headers)
        refresh_after = await refresh(api_key_client, body["refresh_token"])
        assert (outcome(profile), outcome(refresh_after)) == (
            (401, "auth.session_revoked"),
            (401, "auth.invalid_refresh_token"),
        )


class TestBearer:
    async def test_email_verification_token_is_not_an_access_token(self, anonymous_client, user_a):
        email_token = generate_email_confirmation_token(user_a.user_id).access_token
        response    = await anonymous_client.get(PROFILE_URL, headers=bearer(email_token))
        assert outcome(response) == (401, "auth.invalid_token")

    async def test_missing_authorization_header(self, anonymous_client):
        response = await anonymous_client.get(PROFILE_URL)
        assert outcome(response) == (401, "auth.missing_token")

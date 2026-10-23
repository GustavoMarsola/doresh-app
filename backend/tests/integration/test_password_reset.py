"""
Password reset: POST /user/password/forgot e-mails a single-use link, POST /user/password/reset
sets the new password and logs the user out everywhere.
"""
import re

import pytest

from src.application.use_cases import users as users_use_case

FORGOT_URL       = "/api/v1/user/password/forgot"
RESET_URL        = "/api/v1/user/password/reset"
AUTHENTICATE_URL = "/api/v1/user/authenticate"
PROFILE_URL      = "/api/v1/user/profile"

NEW_PASSWORD = "nova-senha-segura"


@pytest.fixture
def sent_emails(monkeypatch) -> list[dict]:
    """Capture the e-mails instead of sending them."""
    emails: list[dict] = []
    monkeypatch.setattr(
        users_use_case,
        "_send_email_in_background",
        lambda to_email, subject, html_content: emails.append({"to": to_email, "html": html_content}),
    )
    return emails


def reset_token(email: dict) -> str:
    return re.search(r"/redefinir-senha\?token=([\w-]+)", email["html"]).group(1)


async def request_reset(client, email: str) -> None:
    response = await client.post(FORGOT_URL, json={"email": email})
    assert response.status_code == 200, response.text


async def login_status(client, email: str, password: str) -> int:
    response = await client.post(AUTHENTICATE_URL, json={"email": email, "password": password})
    return response.status_code


class TestForgotPassword:
    async def test_sends_reset_link_to_registered_email(self, api_key_client, user_a, sent_emails):
        await request_reset(api_key_client, user_a.email)
        assert [e["to"] for e in sent_emails] == [user_a.email] and reset_token(sent_emails[0])

    async def test_unknown_email_gets_same_answer_and_no_email(self, api_key_client, sent_emails):
        response = await api_key_client.post(FORGOT_URL, json={"email": "ninguem@example.com"})
        assert (response.status_code, sent_emails) == (200, [])

    async def test_requires_api_key(self, anonymous_client, user_a, sent_emails):
        response = await anonymous_client.post(FORGOT_URL, json={"email": user_a.email})
        assert (response.status_code, sent_emails) == (401, [])


class TestResetPassword:
    async def test_new_password_works_and_old_one_stops_working(self, api_key_client, user_a, sent_emails):
        await request_reset(api_key_client, user_a.email)
        response = await api_key_client.post(
            RESET_URL, json={"token": reset_token(sent_emails[0]), "password": NEW_PASSWORD}
        )
        assert (
            response.status_code,
            await login_status(api_key_client, user_a.email, NEW_PASSWORD),
            await login_status(api_key_client, user_a.email, user_a.password),
        ) == (200, 200, 401)

    async def test_token_is_single_use(self, api_key_client, user_a, sent_emails):
        await request_reset(api_key_client, user_a.email)
        token = reset_token(sent_emails[0])
        await api_key_client.post(RESET_URL, json={"token": token, "password": NEW_PASSWORD})
        again = await api_key_client.post(RESET_URL, json={"token": token, "password": "outra-senha-123"})
        assert (again.status_code, again.json()["detail"]) == (400, "auth.invalid_reset_token")

    async def test_new_request_invalidates_previous_link(self, api_key_client, user_a, sent_emails):
        await request_reset(api_key_client, user_a.email)
        await request_reset(api_key_client, user_a.email)
        old = await api_key_client.post(RESET_URL, json={"token": reset_token(sent_emails[0]), "password": NEW_PASSWORD})
        new = await api_key_client.post(RESET_URL, json={"token": reset_token(sent_emails[1]), "password": NEW_PASSWORD})
        assert (old.status_code, new.status_code) == (400, 200)

    async def test_unknown_token_is_rejected(self, api_key_client):
        response = await api_key_client.post(RESET_URL, json={"token": "token-inexistente", "password": NEW_PASSWORD})
        assert (response.status_code, response.json()["detail"]) == (400, "auth.invalid_reset_token")

    async def test_short_password_is_rejected_and_token_kept(self, api_key_client, user_a, sent_emails):
        await request_reset(api_key_client, user_a.email)
        token = reset_token(sent_emails[0])
        short = await api_key_client.post(RESET_URL, json={"token": token, "password": "curta"})
        valid = await api_key_client.post(RESET_URL, json={"token": token, "password": NEW_PASSWORD})
        assert (short.status_code, valid.status_code) == (422, 200)

    async def test_reset_logs_out_existing_sessions(self, api_key_client, client_as, user_a, sent_emails):
        logged_in = await client_as(user_a)
        await request_reset(api_key_client, user_a.email)
        await api_key_client.post(RESET_URL, json={"token": reset_token(sent_emails[0]), "password": NEW_PASSWORD})
        profile = await logged_in.get(PROFILE_URL)
        assert (profile.status_code, profile.json()["detail"]) == (401, "auth.session_revoked")

    async def test_token_of_one_user_does_not_change_another_users_password(
        self, api_key_client, user_a, user_b, sent_emails
    ):
        await request_reset(api_key_client, user_a.email)
        await api_key_client.post(RESET_URL, json={"token": reset_token(sent_emails[0]), "password": NEW_PASSWORD})
        assert await login_status(api_key_client, user_b.email, user_b.password) == 200

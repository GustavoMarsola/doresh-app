import json
import asyncio
import logging
from uuid import UUID
from datetime import datetime, timedelta
from fastapi import HTTPException, Response, status
from src.infrastructure.repositories.app_repository import AppRepository
from src.infrastructure.repositories.redis_repository import RedisRepository
from src.infrastructure.repositories.users_repository import RefreshOutcome
from src.schemas.users_schemas import (
    PostRegisterUserSchema,
    PostAuthenticateUserSchema,
    RefreshTokenRequest,
    RefreshTokenResponse,
)
from src.common.authentication import (
    hash_password,
    verify_password,
    generate_tokens,
    generate_refresh_token,
    hash_refresh_token,
    REFRESH_TOKEN_EXPIRE_DAYS,
)
from src.common.utilities import serialize, get_future_date, generate_verification_code, set_local_time
from src.application.use_cases.sessions import SessionsUseCase
from src.common.email_templates import template_email_confirmation
from src.application.use_cases.email import EmailService

_logger = logging.getLogger(__name__)

REFRESH_TOKEN_EXPIRES_IN = REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
SESSION_SECRET_FIELDS    = ("refresh_token_hash", "previous_refresh_token_hash")


def _new_refresh_token() -> tuple[str, str, datetime]:
    refresh_token = generate_refresh_token()
    expires_at    = set_local_time() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    return refresh_token, hash_refresh_token(refresh_token), expires_at


class UsersUseCase:
    def __init__(self, repository: AppRepository, redis_repository: RedisRepository) -> None:
        self.repository       = repository
        self.redis_repository = redis_repository

    async def register_user(self, data: PostRegisterUserSchema) -> Response:
        user_data             = data.model_dump()
        user_data["password"] = hash_password(user_data["password"])

        new_user = await self.repository.users.create_user(user_data)

        email_data = {
            "user_id":           new_user.id,
            "verification_code": generate_verification_code(),
            "expires_at":        get_future_date(days_to_add=30),
        }
        email_verification = await self.repository.users.create_email_verification(email_data)

        email_body = template_email_confirmation(
            username=new_user.username,
            verification_code=email_verification.verification_code,
        )
        try:
            loop = asyncio.get_event_loop()
            email_svc = EmailService()
            await loop.run_in_executor(
                None,
                lambda: email_svc.send_email(
                    to_email=new_user.email,
                    subject="Confirmação de Email - Doresh",
                    html_content=email_body,
                ),
            )
        except Exception as exc:
            _logger.error("Failed to send verification email to %s: %s", new_user.email, exc)

        response_data = {
            "message": "User registered successfully",
            "user":    serialize(new_user),
        }
        return Response(
            status_code=status.HTTP_201_CREATED,
            content=json.dumps(response_data),
        )

    async def verify_email(self, verification_id: UUID) -> Response:
        user, verification = await self.repository.users.update_user_email_verification(verification_id)
        if not user or not verification:
            return Response(
                status_code=status.HTTP_404_NOT_FOUND,
                content=json.dumps({"message": "Verification not found or link expired"}),
            )
        response_data = serialize({
            "message":      "Email verified successfully",
            "user":         user,
            "verification": verification,
        })
        return Response(status_code=status.HTTP_200_OK, content=json.dumps(response_data))

    async def authenticate_user(self, data: PostAuthenticateUserSchema) -> Response:
        db_user = await self.repository.users.get_user_by_email(data.email)
        if not db_user:
            return Response(
                status_code=status.HTTP_404_NOT_FOUND,
                content=json.dumps({"message": "User not found"}),
            )
        if not verify_password(data.password, db_user.password):
            return Response(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content=json.dumps({"message": "Invalid credentials"}),
            )

        refresh_token, refresh_hash, refresh_expires_at = _new_refresh_token()
        user_session = await self.repository.users.register_user_session(
            db_user.id, refresh_hash, refresh_expires_at
        )
        access_token = generate_tokens(db_user.id, user_session.id)
        response_data = serialize({
            "message":            "User authenticated successfully",
            "token":              access_token.access_token,
            "expires_at":         access_token.expires_on,
            "refresh_token":      refresh_token,
            "refresh_expires_at": REFRESH_TOKEN_EXPIRES_IN,
        })
        return Response(status_code=status.HTTP_200_OK, content=json.dumps(response_data))

    async def refresh_session(self, data: RefreshTokenRequest) -> RefreshTokenResponse:
        new_refresh_token, new_refresh_hash, new_refresh_expires_at = _new_refresh_token()
        outcome, session = await self.repository.users.rotate_refresh_token(
            hash_refresh_token(data.refresh_token),
            new_refresh_hash,
            new_refresh_expires_at,
        )

        if outcome is RefreshOutcome.REUSED:
            _logger.warning("Refresh token reuse detected; session %s revoked", session.id)
            await SessionsUseCase(self.repository, self.redis_repository).mark_revoked(
                session.user_id, session.id
            )

        if outcome is not RefreshOutcome.ROTATED:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="auth.invalid_refresh_token",
            )

        access_token = generate_tokens(session.user_id, session.id)
        return RefreshTokenResponse(
            message="Session refreshed successfully",
            token=access_token.access_token,
            expires_at=access_token.expires_on,
            refresh_token=new_refresh_token,
            refresh_expires_at=REFRESH_TOKEN_EXPIRES_IN,
        )

    async def logout_user(self, payload_token: dict) -> Response:
        user_id    = UUID(payload_token["sub"])
        session_id = UUID(payload_token["session_id"])
        session    = await self.repository.users.logout_session(user_id, session_id)
        if not session:
            return Response(
                status_code=status.HTTP_404_NOT_FOUND,
                content=json.dumps({"message": "Session not found"}),
            )
        await SessionsUseCase(self.repository, self.redis_repository).mark_revoked(user_id, session_id)

        session_data = {
            key: value for key, value in serialize(session).items() if key not in SESSION_SECRET_FIELDS
        }
        response_data = {"message": "User logged out successfully", "session": session_data}
        return Response(status_code=status.HTTP_200_OK, content=json.dumps(response_data))

    async def user_profile(self, payload_token: dict) -> Response:
        user_id = payload_token.get("sub")
        if not user_id:
            return Response(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content=json.dumps({"message": "Unauthorized. Try to login again."}),
            )
        highlights = await self.repository.users.get_user_highlights(user_id)
        comments   = await self.repository.users.get_user_comments(user_id)
        response   = serialize({
            "message":    "User profile retrieved successfully",
            "user_id":    user_id,
            "highlights": highlights,
            "comments":   comments,
        })
        return Response(status_code=status.HTTP_200_OK, content=json.dumps(response))

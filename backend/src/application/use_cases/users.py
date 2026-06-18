import json
import asyncio
import logging
from uuid import UUID
from fastapi import Response, status
from src.infrastructure.repositories.app_repository import AppRepository
from src.infrastructure.repositories.redis_repository import RedisRepository
from src.infrastructure.apis.asaas_api import AsaasAPI
from src.schemas.users_schemas import PostRegisterUserSchema, PostAuthenticateUserSchema
from src.common.authentication import hash_password, verify_password, generate_tokens
from src.common.utilities import serialize, get_future_date, generate_verification_code
from src.common.email_templates import template_email_confirmation
from src.application.use_cases.email import EmailService

_logger = logging.getLogger(__name__)


class UsersUseCase:
    def __init__(
        self,
        repository: AppRepository,
        redis_repository: RedisRepository,
        asaas_api: AsaasAPI = None,
    ) -> None:
        self.repository       = repository
        self.redis_repository = redis_repository
        self.asaas_api        = asaas_api

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

        # Create Asaas customer in parallel with a no-op coroutine if needed
        if self.asaas_api:
            asaas_customer = await self.asaas_api.create_customer(
                name=new_user.username,
                document=new_user.document_number,
            )
            external_id = asaas_customer.get("id")
            if external_id:
                await self.repository.users.update_user_external_id(new_user.id, external_id)

        # Send verification email in a thread (smtplib is synchronous)
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

        user_session = await self.repository.users.register_user_session(db_user.id)
        access_token = generate_tokens(
            db_user.id,
            db_user.external_id,
            user_session.id,
            db_user.subscription_id,
            db_user.address_id,
        )
        response_data = serialize({
            "message":    "User authenticated successfully",
            "token":      access_token.access_token,
            "expires_at": access_token.expires_on,
        })
        return Response(status_code=status.HTTP_200_OK, content=json.dumps(response_data))

    async def logout_user(self, payload_token: dict) -> Response:
        session_id = payload_token.get("session_id")
        session    = await self.repository.users.logout_session(session_id)
        if not session:
            return Response(
                status_code=status.HTTP_404_NOT_FOUND,
                content=json.dumps({"message": "Session not found"}),
            )
        response_data = {"message": "User logged out successfully", "session": serialize(session)}
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

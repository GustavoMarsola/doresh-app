import jwt
import uuid
import hashlib
import secrets
from datetime import timedelta, datetime, timezone
from passlib.context import CryptContext

from src.schemas.users_schemas import AuthenticateTokenSchema
from src.settings import get_settings


SECRET_KEY                  = get_settings().auth_settings.secret_key
ALGORITHM                   = get_settings().auth_settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = get_settings().auth_settings.access_token_expire_minutes
EMAIL_TOKEN_EXPIRE_MINUTES  = get_settings().auth_settings.email_token_expire_minutes
REFRESH_TOKEN_EXPIRE_DAYS   = get_settings().auth_settings.refresh_token_expire_days
ACCESS_TOKEN_TYPE           = "access"
PWD_CONTEXT                 = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return PWD_CONTEXT.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return PWD_CONTEXT.verify(plain_password, hashed_password)


def generate_tokens(
    user_id: uuid.UUID,
    session_id: uuid.UUID = None,
) -> AuthenticateTokenSchema:
    now = datetime.now(timezone.utc)

    access_payload = {
        "sub":        str(user_id),
        "session_id": str(session_id) if session_id else None,
        "exp":        now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "type":       ACCESS_TOKEN_TYPE,
    }
    access_token = jwt.encode(access_payload, SECRET_KEY, algorithm=ALGORITHM)
    expires_on   = ACCESS_TOKEN_EXPIRE_MINUTES * 60
    return AuthenticateTokenSchema(
        user_id=user_id,
        access_token=access_token,
        expires_on=expires_on,
    )


def generate_email_confirmation_token(user_id: uuid.UUID) -> AuthenticateTokenSchema:
    now = datetime.now(timezone.utc)

    access_payload = {
        "sub":  str(user_id),
        "exp":  now + timedelta(minutes=EMAIL_TOKEN_EXPIRE_MINUTES),
        "type": "email_verification",
    }
    access_token = jwt.encode(access_payload, SECRET_KEY, algorithm=ALGORITHM)
    expires_on   = EMAIL_TOKEN_EXPIRE_MINUTES * 60
    return AuthenticateTokenSchema(
        user_id=user_id,
        access_token=access_token,
        expires_on=expires_on,
    )


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def get_user_id_from_token(token: str) -> uuid.UUID | None:
    try:
        payload = decode_token(token)
        return uuid.UUID(payload.get("sub"))
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def generate_refresh_token() -> str:
    """Opaque refresh token handed to the client once; only its hash is stored."""
    return secrets.token_urlsafe(48)


def hash_refresh_token(refresh_token: str) -> str:
    return hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()


def generate_email_token() -> str:
    return secrets.token_urlsafe(32)

import jwt
import uuid
import secrets
from datetime import timedelta, datetime, timezone
from passlib.context import CryptContext

from src.schemas.users_schemas import AuthenticateTokenSchema
from src.settings import get_settings


SECRET_KEY                  = get_settings().auth_settings.secret_key
ALGORITHM                   = get_settings().auth_settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = get_settings().auth_settings.access_token_expire_minutes
EMAIL_TOKEN_EXPIRE_MINUTES  = get_settings().auth_settings.email_token_expire_minutes
PWD_CONTEXT                 = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return PWD_CONTEXT.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return PWD_CONTEXT.verify(plain_password, hashed_password)


def generate_tokens(
    user_id: uuid.UUID,
    ext_id: str,
    session_id: uuid.UUID = None,
    subscription_id: uuid.UUID = None,
    address_id: uuid.UUID = None,
) -> AuthenticateTokenSchema:
    now = datetime.now(timezone.utc)

    access_payload = {
        "sub":             str(user_id),
        "external_id":     ext_id,
        "session_id":      str(session_id)      if session_id      else None,
        "subscription_id": str(subscription_id) if subscription_id else None,
        "address_id":      str(address_id)      if address_id      else None,
        "exp":             now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "type":            "access",
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


def generate_email_token() -> str:
    return secrets.token_urlsafe(32)

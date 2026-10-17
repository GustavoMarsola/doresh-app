from uuid     import UUID
from typing   import Optional
from pydantic import BaseModel, ConfigDict, Field


class PostRegisterUserSchema(BaseModel):
    """
    Schema for registering a new user.
    """
    email: str
    password: str
    username: str
    document_number: str
    document_type: str


class PostAuthenticateUserSchema(BaseModel):
    """
    Schema for authenticating a user.
    """
    email: str
    password: str


class AuthenticateTokenSchema(BaseModel):
    """
    Schema for user authentication response.
    """
    user_id: UUID
    access_token: str
    expires_on: int



class RefreshTokenRequest(BaseModel):
    """
    Body of POST /user/refresh.
    """
    model_config = ConfigDict(extra="ignore")

    refresh_token: str = Field(..., min_length=1, max_length=512)


class RefreshTokenResponse(BaseModel):
    """
    New token pair issued by POST /user/refresh. Both expirations are lifetimes in seconds,
    matching `expires_at` of /user/authenticate.
    """
    message:            str
    token:              str
    expires_at:         int
    refresh_token:      str
    refresh_expires_at: int

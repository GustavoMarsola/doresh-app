from uuid     import UUID
from typing   import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class PostRegisterUserSchema(BaseModel):
    """
    Schema for registering a new user.
    """
    email: EmailStr
    password: str = Field(min_length=8)
    username: str = Field(min_length=1)
    document_number: str = Field(min_length=1)
    document_type: str


class PostAuthenticateUserSchema(BaseModel):
    """
    Schema for authenticating a user.
    """
    email: EmailStr
    password: str


class PostForgotPasswordSchema(BaseModel):
    """
    Body of POST /user/password/forgot.
    """
    email: EmailStr


class PostResetPasswordSchema(BaseModel):
    """
    Body of POST /user/password/reset: the token from the e-mailed link and the new password.
    """
    token:    str = Field(..., min_length=1, max_length=512)
    password: str = Field(..., min_length=8)


class DeleteAccountSchema(BaseModel):
    """
    Body of DELETE /user/account: the current password confirms the erasure.
    """
    password: str = Field(..., min_length=1)


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

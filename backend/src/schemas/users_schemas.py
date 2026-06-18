from uuid     import UUID
from typing   import Optional
from pydantic import BaseModel


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


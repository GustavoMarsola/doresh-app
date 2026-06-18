from enum import Enum
from typing import ClassVar, Optional, List
from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings


class Environment(str, Enum):
    DEVELOPMENT = "development"
    STAGING     = "staging"
    PRODUCTION  = "production"


class AppSettings(BaseSettings):
    app_name:    str  = Field("doresh_backend",  validation_alias="APP_NAME")
    app_version: str  = Field("1.0.0",           validation_alias="APP_VERSION")
    app_host:    str  = Field("0.0.0.0",          validation_alias="APP_HOST")
    app_port:    int  = Field(8000,              validation_alias="APP_PORT")
    x_api_key:   str  = Field(...,               validation_alias="X_API_KEY")
    environment: str  = Field("development",     validation_alias="ENVIRONMENT")
    allowed_origins: List[str] = Field(["*"],    validation_alias="ALLOWED_ORIGINS")
    # FastAPI settings
    debug:                    bool = Field(True, validation_alias="DEBUG")
    workers:                   int = Field(1,    validation_alias="FASTAPI_WORKERS")
    http_max_connections:      int = Field(2000, validation_alias="FASTAPI_HTTP_MAX_CONNECTIONS")
    timeout_graceful_shutdown: int = Field(100,  validation_alias="FASTAPI_TIMEOUT_GRACEFUL_SHUTDOWN")


class AuthSettings(BaseSettings):
    secret_key:                  str = Field(...,  validation_alias="JWT_SECRET_KEY")
    algorithm:                   str = Field(...,  validation_alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(120,  validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    email_token_expire_minutes:  int = Field(240,  validation_alias="EMAIL_TOKEN_EXPIRE_MINUTES")


class DatabaseSettings(BaseSettings):
    database_pool_size:             int  = Field(10,   validation_alias="DATABASE_POOL_SIZE")
    database_pool_timeout_seconds:  int  = Field(2,    validation_alias="DATABASE_POOL_TIMEOUT_SECONDS")
    database_max_overflow:          int  = Field(10,   validation_alias="DATABASE_MAX_OVERFLOW")
    database_pool_recycle_seconds:  int  = Field(3600, validation_alias="DATABASE_POOL_RECYCLE_SECONDS")
    database_echo_sql_option:       bool = Field(True, validation_alias="DATABASE_ECHO_SQL")

    database_host:         str = Field(..., validation_alias="DATABASE_HOST")
    database_port:         int = Field(..., validation_alias="DATABASE_PORT")
    database_name:         str = Field(..., validation_alias="DATABASE_NAME")
    database_user:         str = Field(..., validation_alias="DATABASE_USER")
    database_password:     str = Field(..., validation_alias="DATABASE_PWD")
    database_driver:       str = Field(..., validation_alias="DATABASE_DRIVER")
    database_async_driver: str = Field(..., validation_alias="DATABASE_ASYNC_DRIVER")

    @property
    def _get_database_uri(self) -> str:
        return (
            f"postgresql+{self.database_driver}://{self.database_user}:{self.database_password}"
            f"@{self.database_host}:{self.database_port}/{self.database_name}"
        )

    @property
    def _get_async_database_uri(self) -> str:
        return (
            f"postgresql+{self.database_async_driver}://{self.database_user}:{self.database_password}"
            f"@{self.database_host}:{self.database_port}/{self.database_name}"
        )


class LogSettings(BaseSettings):
    log_level: str = Field(
        "ERROR",
        validation_alias="LOG_LEVEL",
        description="Minimum logging level: CRITICAL, ERROR, WARNING, INFO, DEBUG, NOTSET",
    )
    log_format: str = Field(
        "%(asctime)s %(levelname)s %(process)d [%(name)s] [%(filename)s:%(lineno)d] - %(message)s",
        validation_alias="LOG_FORMAT",
    )
    log_format_access: str = Field(
        '%(asctime)s %(levelname)s %(process)d  %(client_addr)s - "%(request_line)s" %(status_code)s',
        validation_alias="LOG_FORMAT_ACCESS",
    )
    date_format: str = Field("%Y-%m-%d %H:%M:%S", validation_alias="DATE_FORMAT")
    log_level_opentelemetry: str = Field("ERROR", validation_alias="LOG_LEVEL_OPENTELEMETRY")
    log_level_sqlalchemy:    str = Field("ERROR", validation_alias="LOG_LEVEL_SQLALCHEMY")


class RedisSettings(BaseSettings):
    redis_host:                  str           = Field("localhost", validation_alias="REDIS_HOST")
    redis_socket_timeout:        float         = Field(0.1,         validation_alias="REDIS_SOCKET_TIMEOUT")
    redis_user:                  Optional[str] = Field(None,        validation_alias="REDIS_USERNAME")
    redis_password:              Optional[str] = Field(None,        validation_alias="REDIS_PASSWORD")
    redis_port:                  int           = Field(6379,        validation_alias="REDIS_PORT")
    redis_max_conns:             int           = Field(10,          validation_alias="REDIS_MAX_CONNECTIONS")
    redis_health_check_interval: int           = Field(3,           validation_alias="REDIS_HEALTH_CHECK_INTERVAL")
    redis_cache_expiration:      int           = Field(600,         validation_alias="REDIS_CACHE_EXPIRATION")


class EmailSettings(BaseSettings):
    email_host:     str = Field(..., validation_alias="EMAIL_HOST")
    email_port:     int = Field(..., validation_alias="EMAIL_PORT")
    email_user:     str = Field(..., validation_alias="EMAIL_USER")
    email_password: str = Field(..., validation_alias="EMAIL_PASSWORD")


class OpenAISettings(BaseSettings):
    openai_api_key:       str  = Field(...,  validation_alias="OPENAI_API_KEY")
    openai_api_gpt_model: str  = Field(...,  validation_alias="OPENAI_API_GPT_MODEL")
    open_ai_assistant_id: str  = Field(...,  validation_alias="OPENAI_ASSISTANT_ID")
    is_test_mode:         bool = Field(True, validation_alias="IS_TEST_MODE")


class GeneralSettings(BaseSettings):
    app_settings:      ClassVar = AppSettings()
    auth_settings:     ClassVar = AuthSettings()
    database_settings: ClassVar = DatabaseSettings()
    log_settings:      ClassVar = LogSettings()
    redis_settings:    ClassVar = RedisSettings()
    email_settings:    ClassVar = EmailSettings()
    openai_settings:   ClassVar = OpenAISettings()


@lru_cache
def get_settings() -> GeneralSettings:
    return GeneralSettings()

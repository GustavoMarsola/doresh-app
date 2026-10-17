from uuid import UUID
from typing import Annotated
from fastapi import APIRouter, Request, Response, status, Depends, Query
from src.infrastructure.repositories.app_repository import AppRepository
from src.infrastructure.repositories.redis_repository import RedisRepository
from src.schemas.bible_schemas import (
    GetBibleBookSchema,
    BiblePassageSchema,
    BibleVersesSchema,
    PutBibleHighlightsSchema,
    PostBibleCommentSchema,
)
from src.application.use_cases.bible import BibleUseCase
from src.common.decorators import session_token_required


router = APIRouter(prefix="/bible")


@router.get(path="/book", status_code=status.HTTP_200_OK)
async def get_bible_book(
    request: Request,
    params: GetBibleBookSchema = Depends(),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> Response:
    return await BibleUseCase(app_repository, redis_repository).get_bible_content(params)


@router.get(path="/highlights", status_code=status.HTTP_200_OK)
async def get_bible_highlights(
    request: Request,
    params: Annotated[BiblePassageSchema, Query()],
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> Response:
    return await BibleUseCase(app_repository, redis_repository).get_highlights(payload_token, params)


@router.put(path="/highlights", status_code=status.HTTP_200_OK)
async def put_bible_highlights(
    request: Request,
    data: PutBibleHighlightsSchema,
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> Response:
    return await BibleUseCase(app_repository, redis_repository).put_highlights(payload_token, data)


@router.delete(path="/highlights", status_code=status.HTTP_200_OK)
async def delete_bible_highlights(
    request: Request,
    params: Annotated[BibleVersesSchema, Query()],
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> Response:
    return await BibleUseCase(app_repository, redis_repository).delete_highlights(payload_token, params)


@router.get(path="/comments", status_code=status.HTTP_200_OK)
async def get_bible_comments(
    request: Request,
    params: Annotated[BiblePassageSchema, Query()],
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> Response:
    return await BibleUseCase(app_repository, redis_repository).get_comments(payload_token, params)


@router.post(path="/comments", status_code=status.HTTP_201_CREATED)
async def post_bible_comment(
    request: Request,
    data: PostBibleCommentSchema,
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> Response:
    return await BibleUseCase(app_repository, redis_repository).create_bible_comment(payload_token, data)


@router.delete(path="/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bible_comment(
    request: Request,
    comment_id: UUID,
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> Response:
    return await BibleUseCase(app_repository, redis_repository).delete_comment(payload_token, comment_id)

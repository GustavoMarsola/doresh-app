from fastapi import APIRouter, Request, Response, status, Depends
from src.infrastructure.repositories.app_repository import AppRepository
from src.infrastructure.repositories.redis_repository import RedisRepository
from src.schemas.bible_schemas import GetBibleBookSchema, PostBibleHighlightSchema, PostBibleCommentSchema
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


@router.post(path="/highlight", status_code=status.HTTP_201_CREATED)
async def post_bible_highlight(
    request: Request,
    data: PostBibleHighlightSchema,
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> Response:
    return await BibleUseCase(app_repository, redis_repository).create_bible_highlight(payload_token, data)


@router.post(path="/comment", status_code=status.HTTP_201_CREATED)
async def post_bible_comment(
    request: Request,
    data: PostBibleCommentSchema,
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> Response:
    return await BibleUseCase(app_repository, redis_repository).create_bible_comment(payload_token, data)

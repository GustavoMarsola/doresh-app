from uuid import UUID
from fastapi import APIRouter, Depends, Path, Request, Response, status
from src.infrastructure.repositories.app_repository import AppRepository
from src.infrastructure.repositories.redis_repository import RedisRepository
from src.schemas.reading_plans_schemas import (
    PatchReadingPlanSchema,
    PostReadingPlanSchema,
    PostRealignSchema,
    ReadingPlanCatalogResponse,
    ReadingPlanPreview,
    ReadingPlanResponse,
    ReadingPlansResponse,
)
from src.application.use_cases.reading_plans import ReadingPlansUseCase
from src.common.decorators import session_token_required


router = APIRouter(prefix="/reading-plans")

NOT_FOUND = {status.HTTP_404_NOT_FOUND: {"description": "reading_plan.not_found / reading_plan.day_not_found"}}
INVALID   = {status.HTTP_422_UNPROCESSABLE_ENTITY: {
    "description": "reading_plan.unknown_plan · invalid_book · invalid_books · invalid_duration · invalid_weekdays · too_many_days",
}}


@router.get(path="/catalog", status_code=status.HTTP_200_OK, response_model=ReadingPlanCatalogResponse)
async def get_reading_plan_catalog(
    request: Request,
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> ReadingPlanCatalogResponse:
    return ReadingPlansUseCase(app_repository, redis_repository).get_catalog()


@router.get(path="", status_code=status.HTTP_200_OK, response_model=ReadingPlansResponse)
async def get_reading_plans(
    request: Request,
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> ReadingPlansResponse:
    return await ReadingPlansUseCase(app_repository, redis_repository).list_plans(payload_token)


@router.post(path="", status_code=status.HTTP_201_CREATED, response_model=ReadingPlanResponse, responses=INVALID)
async def post_reading_plan(
    request: Request,
    data: PostReadingPlanSchema,
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> ReadingPlanResponse:
    return await ReadingPlansUseCase(app_repository, redis_repository).start_plan(payload_token, data)


@router.post(path="/preview", status_code=status.HTTP_200_OK, response_model=ReadingPlanPreview, responses=INVALID)
async def post_reading_plan_preview(
    request: Request,
    data: PostReadingPlanSchema,
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> ReadingPlanPreview:
    return ReadingPlansUseCase(app_repository, redis_repository).preview_plan(data)


@router.get(path="/{plan_id}", status_code=status.HTTP_200_OK, response_model=ReadingPlanResponse, responses=NOT_FOUND)
async def get_reading_plan(
    request: Request,
    plan_id: UUID,
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> ReadingPlanResponse:
    return await ReadingPlansUseCase(app_repository, redis_repository).get_plan(payload_token, plan_id)


@router.patch(
    path="/{plan_id}",
    status_code=status.HTTP_200_OK,
    response_model=ReadingPlanResponse,
    responses={**NOT_FOUND, **INVALID},
)
async def patch_reading_plan(
    request: Request,
    plan_id: UUID,
    data: PatchReadingPlanSchema,
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> ReadingPlanResponse:
    return await ReadingPlansUseCase(app_repository, redis_repository).update_rhythm(payload_token, plan_id, data)


@router.put(
    path="/{plan_id}/days/{day_index}/read",
    status_code=status.HTTP_200_OK,
    response_model=ReadingPlanResponse,
    responses=NOT_FOUND,
)
async def put_reading_plan_day_read(
    request: Request,
    plan_id: UUID,
    day_index: int = Path(..., ge=1),
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> ReadingPlanResponse:
    return await ReadingPlansUseCase(app_repository, redis_repository).set_day_read(payload_token, plan_id, day_index, True)


@router.delete(
    path="/{plan_id}/days/{day_index}/read",
    status_code=status.HTTP_200_OK,
    response_model=ReadingPlanResponse,
    responses=NOT_FOUND,
)
async def delete_reading_plan_day_read(
    request: Request,
    plan_id: UUID,
    day_index: int = Path(..., ge=1),
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> ReadingPlanResponse:
    return await ReadingPlansUseCase(app_repository, redis_repository).set_day_read(payload_token, plan_id, day_index, False)


@router.post(
    path="/{plan_id}/realign",
    status_code=status.HTTP_200_OK,
    response_model=ReadingPlanResponse,
    responses={**NOT_FOUND, **INVALID},
)
async def post_reading_plan_realign(
    request: Request,
    plan_id: UUID,
    data: PostRealignSchema,
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> ReadingPlanResponse:
    return await ReadingPlansUseCase(app_repository, redis_repository).realign(payload_token, plan_id, data)


@router.delete(path="/{plan_id}", status_code=status.HTTP_204_NO_CONTENT, responses=NOT_FOUND)
async def delete_reading_plan(
    request: Request,
    plan_id: UUID,
    payload_token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
) -> Response:
    await ReadingPlansUseCase(app_repository, redis_repository).delete_plan(payload_token, plan_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

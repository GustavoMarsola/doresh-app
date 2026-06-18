from fastapi import APIRouter, Request, Response, status, Depends
from src.infrastructure.apis import AsaasAPI, asaas_facade
from src.infrastructure.repositories.app_repository import AppRepository
from src.infrastructure.repositories.redis_repository import RedisRepository
from src.application.use_cases.subscriptions import SubscriptionsUseCase
from src.schemas.subscriptions_schemas import AsaasEventSchema, CreateSubscriptionSchema, CancelSubscriptionSchema
from src.common.decorators import api_key_required, session_token_required


router = APIRouter(prefix="/subscription")


@router.post(path="/", status_code=status.HTTP_201_CREATED)
async def post_subscription(
    request: Request,
    data: CreateSubscriptionSchema,
    token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
    asaas_api: AsaasAPI = Depends(asaas_facade),
) -> Response:
    return await SubscriptionsUseCase(app_repository, redis_repository, asaas_api).create_subscription(token, data)


@router.get(path="/", status_code=status.HTTP_200_OK)
async def get_subscription(
    request: Request,
    token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
    asaas_api: AsaasAPI = Depends(asaas_facade),
) -> Response:
    return await SubscriptionsUseCase(app_repository, redis_repository, asaas_api).get_user_subscription(token)


@router.post(path="/customer", status_code=status.HTTP_201_CREATED)
async def post_customer(
    request: Request,
    token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
    asaas_api: AsaasAPI = Depends(asaas_facade),
) -> Response:
    return await SubscriptionsUseCase(app_repository, redis_repository, asaas_api).create_customer(token)


@router.delete(path="/cancel", status_code=status.HTTP_200_OK)
async def delete_subscription(
    request: Request,
    data: CancelSubscriptionSchema,
    token: dict = Depends(session_token_required),
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
    asaas_api: AsaasAPI = Depends(asaas_facade),
) -> Response:
    return await SubscriptionsUseCase(app_repository, redis_repository, asaas_api).cancel_subscription(
        token, data.canceling_reason
    )


@router.post(path="/event", status_code=status.HTTP_201_CREATED)
@api_key_required
async def post_asaas_event(
    request: Request,
    data: AsaasEventSchema,
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
    asaas_api: AsaasAPI = Depends(asaas_facade),
) -> Response:
    return await SubscriptionsUseCase(app_repository, redis_repository, asaas_api).record_asaas_event(data)


@router.get(path="/plans", status_code=status.HTTP_200_OK)
async def get_plans(
    request: Request,
    app_repository: AppRepository = Depends(),
    redis_repository: RedisRepository = Depends(),
    asaas_api: AsaasAPI = Depends(asaas_facade),
) -> Response:
    return await SubscriptionsUseCase(app_repository, redis_repository, asaas_api).get_plans()

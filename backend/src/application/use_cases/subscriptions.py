import json
import asyncio
import logging
from fastapi import Response, status
from src.infrastructure.apis.asaas_api import AsaasAPI
from src.infrastructure.repositories.app_repository import AppRepository
from src.infrastructure.repositories.redis_repository import RedisRepository
from src.schemas.subscriptions_schemas import AsaasEventSchema, CreateSubscriptionSchema
from src.common.utilities import get_future_date, set_local_time, serialize

_logger = logging.getLogger(__name__)

_CYCLE_DAYS = {
    "MONTHLY":   30,
    "QUARTERLY": 90,
    "SEMIANNUAL": 180,
    "YEARLY":    365,
}


class SubscriptionsUseCase:
    def __init__(
        self,
        repository: AppRepository,
        redis_repository: RedisRepository,
        asaas_api: AsaasAPI,
    ) -> None:
        self.repository       = repository
        self.redis_repository = redis_repository
        self.asaas_api        = asaas_api

    async def create_subscription(self, token: dict, data: CreateSubscriptionSchema) -> Response:
        user_id     = token.get("sub")
        user_ext_id = token.get("external_id")

        plan_data = await self.repository.subscriptions.get_plan_by_id(data.plan_id)
        if not plan_data:
            return Response(
                status_code=status.HTTP_404_NOT_FOUND,
                content=json.dumps({"message": "Plan not found"}),
            )

        due_date           = get_future_date(days_to_add=7, convert_to_string=True)
        asaas_subscription = await self.asaas_api.create_subscription(
            customer_id=user_ext_id,
            value=float(plan_data.net_value),
            description=plan_data.description,
            payment_method=data.payment_method,
            cycle=plan_data.cycle,
            next_due_date=due_date,
        )
        _logger.info("Asaas subscription created: %s", asaas_subscription.get("id"))

        days_to_expire = _CYCLE_DAYS.get(plan_data.cycle, 30)
        expires_on     = get_future_date(days_to_add=days_to_expire)

        sub_data = data.model_dump()
        sub_data.update({
            "payment_due_date": get_future_date(days_to_add=7),
            "external_id":      asaas_subscription.get("id"),
            "status":           asaas_subscription.get("status"),
            "active":           True,
            "expires_on":       expires_on,
        })

        subscription = await self.repository.subscriptions.save_subscription(sub_data)
        await self.repository.users.update_user_subscription(user_id, subscription.id)

        response = serialize({
            "message":         "Subscription created successfully",
            "subscription_id": str(subscription.id),
        })
        return Response(status_code=status.HTTP_201_CREATED, content=json.dumps(response))

    async def get_user_subscription(self, token: dict) -> Response:
        user_id           = token.get("sub")
        user_subscription = await self.repository.subscriptions.get_subscription_by_user_id(user_id)
        if not user_subscription:
            return Response(
                status_code=status.HTTP_404_NOT_FOUND,
                content=json.dumps({"message": "No active subscription found"}),
            )
        response = serialize({
            "message":      "User subscription retrieved successfully",
            "subscription": user_subscription,
        })
        return Response(status_code=status.HTTP_200_OK, content=json.dumps(response))

    async def create_customer(self, token: dict) -> Response:
        user_id = token.get("sub")
        user    = await self.repository.users.get_user_by_id(user_id)
        if not user:
            return Response(
                status_code=status.HTTP_404_NOT_FOUND,
                content=json.dumps({"message": "User not found"}),
            )
        asaas_customer = await self.asaas_api.create_customer(
            name=user.username,
            email=user.email,
            document=user.document_number,
        )
        ext_id = asaas_customer.get("id")
        if not ext_id:
            return Response(
                status_code=status.HTTP_400_BAD_REQUEST,
                content=json.dumps({
                    "message":         "Failed to create customer in Asaas",
                    "asaas_response":  asaas_customer,
                }),
            )
        await self.repository.users.update_user_external_id(user_id, ext_id)
        response = serialize({
            "message":                  "Customer created successfully",
            "external_id":              ext_id,
            "payment_gateway_response": asaas_customer,
        })
        return Response(status_code=status.HTTP_201_CREATED, content=json.dumps(response))

    async def cancel_subscription(self, token: dict, canceling_reason: str) -> Response:
        subscription_id = token.get("subscription_id")
        subscription    = await self.repository.subscriptions.get_subscription_by_id(subscription_id)
        if not subscription:
            return Response(
                status_code=status.HTTP_404_NOT_FOUND,
                content=json.dumps({"message": "Subscription not found"}),
            )

        asaas_response, updated_subscription = await asyncio.gather(
            self.asaas_api.cancel_asaas_subscription(subscription.external_id),
            self.repository.subscriptions.deactive_subscription(subscription.id, canceling_reason),
        )
        status_code, asaas_data = asaas_response

        event_data = {
            "subscription_external_id": subscription.external_id,
            "event_description":        "Subscription canceled",
            "event_datetime":           set_local_time(),
            "event_raw_data":           asaas_data,
        }
        await self.repository.subscriptions.save_subscription_event(event_data)

        response = serialize({
            "message":         "Subscription canceled successfully",
            "subscription_id": str(subscription.id),
            "asaas": {
                "status": status_code,
                "data":   asaas_data,
            },
        })
        return Response(status_code=status.HTTP_200_OK, content=json.dumps(response))

    async def record_asaas_event(self, data: AsaasEventSchema) -> Response:
        if data.payment:
            sub_id = data.payment.subscription
        elif data.subscription:
            sub_id = data.subscription.id
        else:
            sub_id = None

        # Use the original schema fields (not a re-bound local dict)
        raw_data = data.payment.model_dump() if data.payment else (
            data.subscription.model_dump() if data.subscription else {}
        )

        event_data = {
            "subscription_external_id": sub_id,
            "event_description":        data.event,
            "event_datetime":           data.dateCreated,
            "event_external_id":        data.id,
            "event_raw_data":           raw_data,
        }
        event    = await self.repository.subscriptions.save_subscription_event(event_data)
        response = serialize({
            "message":    "Event recorded successfully",
            "event_id":   str(event.id),
            "event_data": event,
        })
        return Response(status_code=status.HTTP_201_CREATED, content=json.dumps(response))

    async def get_plans(self) -> Response:
        plans    = await self.repository.subscriptions.get_all_plans()
        response = serialize({"plans": plans})
        return Response(status_code=status.HTTP_200_OK, content=json.dumps(response))

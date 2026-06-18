from uuid import UUID
from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class CreateSubscriptionSchema(BaseModel):
    plan_id: UUID
    payment_method: str = "CREDIT_CARD"
    payment_gateway_id: UUID


class PaymentSchema(BaseModel):
    subscription: str

class SubscriptionSchema(BaseModel):
    id: str


class AsaasEventSchema(BaseModel):
    id: str
    event: str
    dateCreated: datetime
    payment: Optional[PaymentSchema] = None
    subscription: Optional[SubscriptionSchema] = None


class CancelSubscriptionSchema(BaseModel):
    canceling_reason: str
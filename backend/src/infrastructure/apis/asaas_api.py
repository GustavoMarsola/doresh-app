import logging
from httpx import AsyncClient

_logger = logging.getLogger(__name__)


class AsaasAPI:
    def __init__(self, base_url: str, api_key: str) -> None:
        self.base_url = base_url
        self._headers = {
            "content-type": "application/json",
            "access_token": api_key,
        }

    async def create_customer(self, name: str, document: str, email: str = None) -> dict:
        payload = {"name": str(name), "cpfCnpj": str(document)}
        if email:
            payload["email"] = email
        async with AsyncClient() as client:
            response = await client.post(
                url=f"{self.base_url}/customers",
                json=payload,
                headers=self._headers,
            )
            return response.json()

    async def create_subscription(
        self,
        customer_id: str,
        value: float,
        description: str,
        payment_method: str,
        cycle: str,
        next_due_date: str,
    ) -> dict:
        async with AsyncClient() as client:
            response = await client.post(
                url=f"{self.base_url}/subscriptions",
                json={
                    "customer": customer_id,
                    "billingType": payment_method,
                    "value": float(value),
                    "cycle": cycle,
                    "nextDueDate": next_due_date,
                    "description": description,
                },
                headers=self._headers,
            )
            return response.json()

    async def cancel_asaas_subscription(self, subscription_id: str) -> tuple[int, dict]:
        async with AsyncClient() as client:
            response = await client.delete(
                url=f"{self.base_url}/subscriptions/{subscription_id}",
                headers=self._headers,
            )
            return response.status_code, response.json()

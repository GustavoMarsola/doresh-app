from src.infrastructure.apis.asaas_api import AsaasAPI
from src.settings import get_settings


def asaas_facade() -> AsaasAPI:
    return AsaasAPI(
        base_url=get_settings().asaas_settings.asaas_host,
        api_key=get_settings().asaas_settings.asaas_access_token,
    )

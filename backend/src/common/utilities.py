import base64
import secrets
import string
import pytz
import json
import unicodedata
from uuid     import UUID
from math     import isnan
from decimal  import Decimal
from datetime import datetime, timedelta
from sqlalchemy.engine import RowMapping


def set_local_time() -> datetime:
    return datetime.now(pytz.timezone('America/Sao_Paulo')).replace(tzinfo=None)


def get_future_date(days_to_add: int, convert_to_string: bool = False) -> str:
    # Define o horário local de São Paulo
    local_time = set_local_time()
    
    # Adiciona os dias desejados
    future_date = local_time + timedelta(days=days_to_add)
    
    if convert_to_string:
        return future_date.strftime("%Y-%m-%d")
    
    return future_date


def safeget(dct, *keys):
    for key in keys:
        try:
            dct = dct[key]
        except (KeyError, TypeError):
            return None
    return dct


def read_json_file(path: str) -> dict:
    try:
        with open(path, 'r', encoding='utf-8-sig') as file:
            return json.load(file)
    except Exception as ex:
        print(f'Error reading JSON file: {ex}')
        return {}


def write_json_file(path: str, data: dict) -> None:
    with open(path, 'w') as file:
        json.dump(data, file, indent=4, ensure_ascii=False)


def serialize(obj):
    if isinstance(obj, list):
        return [serialize(item) for item in obj]

    if isinstance(obj, dict) or isinstance(obj, RowMapping):
        return {
            key: serialize(value)
            for key, value in obj.items()
        }

    if isinstance(obj, datetime):
        return obj.isoformat()

    if isinstance(obj, UUID):
        return str(obj)

    if isinstance(obj, Decimal):
        return float(obj)

    if isinstance(obj, float) and isnan(obj):
        return None

    if hasattr(obj, "__dict__"):
        return {
            key: serialize(value)
            for key, value in obj.__dict__.items()
            if not key.startswith("_")
        }

    return obj


def convert_file_to_base64(filepath: str):
    with open(filepath, "rb") as arquivo_pdf:
        base64_bytes = base64.b64encode(arquivo_pdf.read())
        base64_string = base64_bytes.decode("utf-8", errors="ignore")
    return base64_string


def generate_random_token(length: int = 64) -> str:
    """Generate a random token of specified length."""

    characters = string.ascii_letters + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))


# Função para normalizar nomes (remover acentos, espaços etc.)
def normalize_string(_string):
    # Remove acentos
    _string = unicodedata.normalize('NFKD', _string).encode('ASCII', 'ignore').decode('utf-8')
    # Substitui espaços por underline e coloca em minúsculas
    return _string.lower().replace(' ', '_')


def generate_verification_code(length: int = 6) -> str:
    """Generate a alphanumeric verification code of specified length."""
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))

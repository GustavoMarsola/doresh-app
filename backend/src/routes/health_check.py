from fastapi import APIRouter

router = APIRouter()

@router.api_route('/health_check', status_code=200, methods=['GET', 'POST', 'HEAD'], summary='API is active?')
async def live() -> dict:
    return {
        'message': 'hello world!',
        'status': 'alive'
    }

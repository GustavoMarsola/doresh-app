from fastapi import APIRouter

from src.routes.api.v1.bible_routes   import router as bible_router
from src.routes.api.v1.reading_plans_routes import router as reading_plans_router
from src.routes.api.v1.reading_groups_routes import router as reading_groups_router
from src.routes.api.v1.studies_routes import router as studies_router
from src.routes.api.v1.users_routes   import router as users_router


api_v1 = APIRouter(prefix="/api/v1")
api_v1.include_router(bible_router,   tags=["Bible"])
api_v1.include_router(reading_plans_router, tags=["Reading plans"])
api_v1.include_router(reading_groups_router, tags=["Reading groups"])
api_v1.include_router(studies_router, tags=["Studies"])
api_v1.include_router(users_router,   tags=["Users"])

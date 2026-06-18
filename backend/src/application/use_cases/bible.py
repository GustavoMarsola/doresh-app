import json
from uuid import UUID
from fastapi import Response, status
from src.infrastructure.repositories.app_repository import AppRepository
from src.infrastructure.repositories.redis_repository import RedisRepository
from src.schemas.bible_schemas import GetBibleBookSchema, PostBibleHighlightSchema, PostBibleCommentSchema
from src.common.bible.helpers import get_bible_book_content
from src.common.utilities import serialize


class BibleUseCase:
    def __init__(self, repository: AppRepository, redis_repository: RedisRepository) -> None:
        self.repository       = repository
        self.redis_repository = redis_repository

    async def get_bible_content(self, params: GetBibleBookSchema) -> Response:
        book = get_bible_book_content(params.name, params.version)
        if not book:
            return Response(
                content=json.dumps({"message": "Bible book not found"}),
                status_code=status.HTTP_404_NOT_FOUND,
            )
        response = serialize({
            "message":              "Bible book found",
            "book":                 params.name,
            "version":              params.version,
            "quantity_of_chapters": len(book),
            "chapters":             book,
        })
        return Response(content=json.dumps(response), status_code=status.HTTP_200_OK)

    async def create_bible_highlight(self, bearer_token: dict, data: PostBibleHighlightSchema) -> Response:
        highlight_data = data.model_dump()
        highlight_data["user_id"] = UUID(bearer_token["sub"])
        highlight = await self.repository.bible.register_bible_highlight(highlight_data)
        response  = serialize({"message": "Highlight created successfully", "highlight": highlight})
        return Response(content=json.dumps(response), status_code=status.HTTP_201_CREATED)

    async def create_bible_comment(self, token_payload: dict, data: PostBibleCommentSchema) -> Response:
        comment_data = data.model_dump()
        comment_data["user_id"] = UUID(token_payload["sub"])
        comment  = await self.repository.bible.register_bible_comment(comment_data)
        response = serialize({"message": "Comment created successfully", "comment": comment})
        return Response(content=json.dumps(response), status_code=status.HTTP_201_CREATED)

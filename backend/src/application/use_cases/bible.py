import json
from uuid import UUID
from fastapi import Response, status
from src.infrastructure.repositories.app_repository import AppRepository
from src.infrastructure.repositories.redis_repository import RedisRepository
from src.schemas.bible_schemas import (
    GetBibleBookSchema,
    BiblePassageSchema,
    BibleVersesSchema,
    PutBibleHighlightsSchema,
    PostBibleCommentSchema,
)
from src.common.bible.helpers import get_bible_book_content, bible_book_slug, is_valid_bible_reference
from src.common.utilities import serialize
from src.exceptions import NotFoundException, UnprocessableEntityException


def _user_id(token_payload: dict) -> UUID:
    return UUID(token_payload["sub"])


def _book_slug(book: str, chapter: int, verses: list[int] = ()) -> str:
    """Slug of a reference that exists in the Bible, or 422 `bible.invalid_reference`."""
    slug = bible_book_slug(book)
    if not is_valid_bible_reference(slug, chapter, list(verses)):
        raise UnprocessableEntityException("bible.invalid_reference")
    return slug


def _highlight_out(highlight) -> dict:
    return {
        "id":      highlight.id,
        "book":    highlight.book,
        "chapter": highlight.chapter,
        "verse":   highlight.verse,
        "color":   highlight.color,
    }


def _comment_out(comment) -> dict:
    return {
        "id":          comment.id,
        "book":        comment.book,
        "chapter":     comment.chapter,
        "verse_start": comment.verse_start,
        "verse_end":   comment.verse_end,
        "comment":     comment.comment,
        "created_at":  comment.created_at,
    }


class BibleUseCase:
    def __init__(self, repository: AppRepository, redis_repository: RedisRepository) -> None:
        self.repository       = repository
        self.redis_repository = redis_repository

    async def get_bible_content(self, params: GetBibleBookSchema) -> Response:
        book = get_bible_book_content(params.name, params.version)
        if not book:
            raise NotFoundException("Bible book not found")
        response = serialize({
            "message":              "Bible book found",
            "book":                 params.name,
            "version":              params.version,
            "quantity_of_chapters": len(book),
            "chapters":             book,
        })
        return Response(content=json.dumps(response), status_code=status.HTTP_200_OK)

    async def get_highlights(self, token_payload: dict, params: BiblePassageSchema) -> Response:
        book       = _book_slug(params.book, params.chapter)
        highlights = await self.repository.bible.get_chapter_highlights(_user_id(token_payload), book, params.chapter)
        response   = serialize({"highlights": [_highlight_out(h) for h in highlights]})
        return Response(content=json.dumps(response), status_code=status.HTTP_200_OK)

    async def put_highlights(self, token_payload: dict, data: PutBibleHighlightsSchema) -> Response:
        user_id = _user_id(token_payload)
        book    = _book_slug(data.book, data.chapter, data.verses)
        await self.repository.bible.upsert_highlights(user_id, book, data.chapter, data.verses, data.color)
        highlights = await self.repository.bible.get_chapter_highlights(user_id, book, data.chapter)
        response   = serialize({"message": "Highlights saved", "highlights": [_highlight_out(h) for h in highlights]})
        return Response(content=json.dumps(response), status_code=status.HTTP_200_OK)

    async def delete_highlights(self, token_payload: dict, data: BibleVersesSchema) -> Response:
        user_id = _user_id(token_payload)
        book    = _book_slug(data.book, data.chapter, data.verses)
        await self.repository.bible.delete_highlights(user_id, book, data.chapter, data.verses)
        highlights = await self.repository.bible.get_chapter_highlights(user_id, book, data.chapter)
        response   = serialize({"message": "Highlights removed", "highlights": [_highlight_out(h) for h in highlights]})
        return Response(content=json.dumps(response), status_code=status.HTTP_200_OK)

    async def get_comments(self, token_payload: dict, params: BiblePassageSchema) -> Response:
        book     = _book_slug(params.book, params.chapter)
        comments = await self.repository.bible.get_chapter_comments(_user_id(token_payload), book, params.chapter)
        response = serialize({"comments": [_comment_out(c) for c in comments]})
        return Response(content=json.dumps(response), status_code=status.HTTP_200_OK)

    async def create_bible_comment(self, token_payload: dict, data: PostBibleCommentSchema) -> Response:
        comment_data = data.model_dump()
        comment_data["book"]    = _book_slug(data.book, data.chapter, [data.verse_start, data.verse_end])
        comment_data["user_id"] = _user_id(token_payload)
        comment  = await self.repository.bible.register_bible_comment(comment_data)
        response = serialize({"message": "Comment created successfully", "comment": _comment_out(comment)})
        return Response(content=json.dumps(response), status_code=status.HTTP_201_CREATED)

    async def delete_comment(self, token_payload: dict, comment_id: UUID) -> Response:
        deleted = await self.repository.bible.delete_comment(_user_id(token_payload), comment_id)
        if not deleted:
            raise NotFoundException("Comment not found")
        return Response(status_code=status.HTTP_204_NO_CONTENT)

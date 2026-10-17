from uuid     import UUID
from typing   import Optional, List, Dict, Literal
from pydantic import BaseModel, Field, model_validator


class GetBibleBookSchema(BaseModel):
	"""
	Schema for getting a Bible book.
	"""
	name: str
	version: str = 'nvi'  # Default version is 'nvi'
	chapters: Optional[List[int]] = None
	verses: Optional[Dict[int, List[int]]] = None


HighlightColor = Literal["yellow", "blue", "red"]


class BiblePassageSchema(BaseModel):
	"""
	A chapter of a Bible book. `book` is the display name ("1 Coríntios") or its slug.
	"""
	book: str = Field(min_length=1, max_length=40)
	chapter: int = Field(ge=1)


class BibleVersesSchema(BiblePassageSchema):
	"""
	Some verses of one chapter.
	"""
	verses: List[int] = Field(min_length=1, max_length=200)


class PutBibleHighlightsSchema(BibleVersesSchema):
	"""
	Schema for highlighting verses (replaces the colour of verses already highlighted).
	"""
	color: HighlightColor


class PostBibleCommentSchema(BiblePassageSchema):
	"""
	Schema for commenting on a verse range of one chapter.
	"""
	verse_start: int = Field(ge=1)
	verse_end: int = Field(ge=1)
	comment: str = Field(min_length=1, max_length=5000)

	@model_validator(mode="after")
	def _check_range(self):
		if self.verse_end < self.verse_start:
			raise ValueError("verse_end must be greater than or equal to verse_start")
		return self

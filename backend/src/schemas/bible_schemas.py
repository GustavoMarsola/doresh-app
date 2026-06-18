from uuid     import UUID
from typing   import Optional, List, Dict
from pydantic import BaseModel


class GetBibleBookSchema(BaseModel):
	"""
	Schema for getting a Bible book.
	"""
	name: str
	version: str = 'nvi'  # Default version is 'nvi'
	chapters: Optional[List[int]] = None
	verses: Optional[Dict[int, List[int]]] = None


class PostBibleHighlightSchema(BaseModel):
	"""
	Schema for posting a Bible highlight.
	"""
	# verses: str
	text: str
	color: str


class PostBibleCommentSchema(BaseModel):
	"""
	Schema for posting a Bible comment.
	"""
	biblical_text: str
	comment: str
from uuid import UUID
from typing import Literal, Optional, List
from pydantic import BaseModel, Field


class GetStudiesSchema(BaseModel):
    page:     int = Field(1, ge=1)
    per_page: int = Field(12, ge=1, le=50)
    sort_by:  Literal["created_at", "updated_at", "title"] = "updated_at"
    order:    Literal["asc", "desc"] = "desc"
    # Busca por título ou introdução (sem diferenciar maiúsculas)
    q:        Optional[str] = Field(None, max_length=200)


class StudyReferenceSchema(BaseModel):
    book:        str
    chapter:     int = Field(..., ge=1)
    verse_start: Optional[int] = Field(None, ge=1)
    verse_end:   Optional[int] = Field(None, ge=1)


class StudySectionSchema(BaseModel):
    title:       Optional[str] = None
    text:        str
    order_index: Optional[int] = None


class PostCreateStudySchema(BaseModel):
    title:        str = Field(..., min_length=1, max_length=300)
    introduction: str = ""
    conclusion:   str = ""
    ai_generated: bool = False
    references:   List[StudyReferenceSchema]  = []
    sections:     List[StudySectionSchema]    = []


class PatchStudySchema(BaseModel):
    study_id:     UUID
    title:        Optional[str] = Field(None, min_length=1, max_length=300)
    introduction: Optional[str] = None
    conclusion:   Optional[str] = None
    # None = não mexe; lista (inclusive vazia) = substitui todas, na ordem enviada
    sections:     Optional[List[StudySectionSchema]]   = None
    references:   Optional[List[StudyReferenceSchema]] = None

from uuid import UUID
from typing import Optional, List
from pydantic import BaseModel


class GetStudiesSchema(BaseModel):
    page:     int = 1
    per_page: int = 10
    sort_by:  str = "created_at"
    order:    str = "desc"


class StudyReferenceSchema(BaseModel):
    book:        str
    chapter:     int
    verse_start: Optional[int] = None
    verse_end:   Optional[int] = None


class StudySectionSchema(BaseModel):
    title:       Optional[str] = None
    text:        str
    order_index: Optional[int] = None


class PostCreateStudySchema(BaseModel):
    title:        str
    introduction: str
    conclusion:   str
    ai_generated: bool = False
    references:   List[StudyReferenceSchema]  = []
    sections:     List[StudySectionSchema]    = []


class StudySectionPatchSchema(BaseModel):
    id:          UUID
    title:       Optional[str] = None
    text:        Optional[str] = None
    order_index: Optional[int] = None


class PatchStudySchema(BaseModel):
    study_id:     UUID
    title:        Optional[str]                       = None
    introduction: Optional[str]                       = None
    conclusion:   Optional[str]                       = None
    sections:     List[StudySectionPatchSchema]        = []
    # None = não mexe nas referências; [] = remove todas
    references:   Optional[List[StudyReferenceSchema]] = None

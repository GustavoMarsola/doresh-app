from uuid import UUID
from datetime import date, datetime
from typing import Literal, Optional, List
from pydantic import BaseModel, ConfigDict, Field
from src.schemas.reading_plans_schemas import PassageOut, ReadingPlanDayOut


class PostReadingGroupSchema(BaseModel):
    """
    Create a group from one of the caller's reading plans (its content and rhythm are copied).
    `consent` is the leader's explicit agreement to take part in a Bible reading group.
    """
    model_config = ConfigDict(extra="ignore")

    name:            str            = Field(..., min_length=1, max_length=80)
    plan_id:         UUID
    start_date:      Optional[date] = None
    meeting_weekday: Optional[int]  = Field(None, ge=1, le=7)
    consent:         bool           = False
    show_name:       bool           = True


class PatchReadingGroupSchema(BaseModel):
    """Leader only. Rhythm changes keep every member's progress (verses read)."""
    model_config = ConfigDict(extra="ignore")

    name:            Optional[str]       = Field(None, min_length=1, max_length=80)
    start_date:      Optional[date]      = None
    total_days:      Optional[int]       = Field(None, ge=7, le=1464)
    weekdays:        Optional[List[int]] = Field(None, min_length=1, max_length=7)
    meeting_weekday: Optional[int]       = Field(None, ge=1, le=7)  # null (sent explicitly) clears it


class PostInviteSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")

    days: int = Field(30, ge=1, le=90)  # validity of the link


class PostJoinSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")

    consent:   bool = False
    show_name: bool = False


class PatchMembershipSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")

    show_name: bool


class PutNoteSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")

    text:     str            = Field(..., min_length=1, max_length=4000)
    study_id: Optional[UUID] = None  # one of the leader's own studies


# ── Output ──

class GroupMemberOut(BaseModel):
    id:        UUID                        # membership id (what the leader uses to remove someone)
    name:      Optional[str]               # only when the member chose to be named
    role:      Literal["leader", "member"]
    days_read: int
    is_me:     bool


class GroupNoteOut(BaseModel):
    text:        str
    study_id:    Optional[UUID]
    study_title: Optional[str]  # None when the study was removed by its owner
    updated_at:  datetime


class GroupDayOut(ReadingPlanDayOut):
    """A day of the group's plan: my own status plus how many members have read it."""
    readers:    int
    is_meeting: bool
    note:       Optional[GroupNoteOut]


class GroupInviteOut(BaseModel):
    token:      str
    expires_at: datetime


class GroupSummary(BaseModel):
    id:            UUID
    name:          str
    title:         str   # the plan's title
    role:          Literal["leader", "member"]
    members_count: int
    start_date:    date
    end_date:      date
    reading_days:  int
    days_read:     int
    next_day:      Optional[ReadingPlanDayOut]
    completed:     bool
    created_at:    datetime
    updated_at:    datetime


class GroupDetail(GroupSummary):
    plan_slug:       str
    book:            Optional[str]
    books:           Optional[List[str]]
    total_days:      int
    weekdays:        List[int]
    meeting_weekday: Optional[int]
    show_name:       bool                     # my own choice
    invite:          Optional[GroupInviteOut]  # leader only; None when there's no active link
    members:         List[GroupMemberOut]
    days:            List[GroupDayOut]


class GroupResponse(BaseModel):
    group: GroupDetail


class GroupsResponse(BaseModel):
    groups: List[GroupSummary]


class InvitePreview(BaseModel):
    """What someone sees before accepting an invite link."""
    group_id:       UUID
    name:           str
    title:          str
    leader_name:    str
    members_count:  int
    start_date:     date
    end_date:       date
    reading_days:   int
    already_member: bool
    next_passages:  List[PassageOut]  # the first day's reading, as a taste of the plan


class GroupStudyResponse(BaseModel):
    study: dict


# ── Mural da passagem (anotações partilhadas) ──

class PostShareSchema(BaseModel):
    """
    Share one of my annotations with the group: a comment (`comment_id`) or a highlight
    (`book`, `chapter`, `verse_start`..`verse_end`, all of which I highlighted).
    """
    model_config = ConfigDict(extra="ignore")

    kind:        Literal["comment", "highlight"]
    comment_id:  Optional[UUID] = None
    book:        Optional[str]  = Field(None, min_length=1, max_length=40)
    chapter:     Optional[int]  = Field(None, ge=1)
    verse_start: Optional[int]  = Field(None, ge=1)
    verse_end:   Optional[int]  = Field(None, ge=1)


class PostReplySchema(BaseModel):
    model_config = ConfigDict(extra="ignore")

    text: str = Field(..., min_length=1, max_length=2000)


class ShareAuthorOut(BaseModel):
    name:  Optional[str]  # only when the member chose to be named
    role:  Literal["leader", "member"]
    is_me: bool


class ShareReplyOut(BaseModel):
    id:         UUID
    author:     ShareAuthorOut
    text:       str
    created_at: datetime


class ShareOut(BaseModel):
    id:             UUID
    kind:           Literal["comment", "highlight"]
    author:         ShareAuthorOut
    book:           str  # book slug, as in bible_comments
    chapter:        int
    verse_start:    int
    verse_end:      int
    text:           Optional[str]
    color:          Optional[str]
    hidden:         bool  # leader only sees hidden shares (members never receive them)
    reports:        int   # leader only; 0 for members
    reported_by_me: bool
    replies:        List[ShareReplyOut]
    created_at:     datetime


class ShareResponse(BaseModel):
    share: ShareOut


class MuralResponse(BaseModel):
    shares: List[ShareOut]


class MyShareOut(BaseModel):
    """Where one of my annotations is shared (for the reader and the day page)."""
    id:          UUID
    group_id:    UUID
    group_name:  str
    kind:        Literal["comment", "highlight"]
    comment_id:  Optional[UUID]
    book:        str
    chapter:     int
    verse_start: int
    verse_end:   int


class MySharesResponse(BaseModel):
    shares: List[MyShareOut]

from uuid import UUID
from fastapi import APIRouter, Depends, Path, Request, Response, status
from src.infrastructure.repositories.app_repository import AppRepository
from src.infrastructure.repositories.redis_repository import RedisRepository
from src.schemas.reading_groups_schemas import (
    GroupResponse,
    GroupStudyResponse,
    GroupsResponse,
    InvitePreview,
    MuralResponse,
    MySharesResponse,
    PatchMembershipSchema,
    PatchReadingGroupSchema,
    PostInviteSchema,
    PostJoinSchema,
    PostReadingGroupSchema,
    PostReplySchema,
    PostShareSchema,
    PutNoteSchema,
    ShareResponse,
)
from src.application.use_cases.reading_groups import ReadingGroupsUseCase
from src.application.use_cases.reading_group_mural import ReadingGroupMuralUseCase
from src.common.decorators import session_token_required


router = APIRouter(prefix="/reading-groups")

NOT_FOUND   = {status.HTTP_404_NOT_FOUND: {"description": "reading_group.not_found / reading_group.day_not_found"}}
LEADER_ONLY = {status.HTTP_403_FORBIDDEN: {"description": "reading_group.leader_only"}}
INVITE      = {
    status.HTTP_404_NOT_FOUND: {"description": "reading_group.invite_invalid"},
    status.HTTP_410_GONE:      {"description": "reading_group.invite_expired"},
}


def use_case(app_repository: AppRepository = Depends(), redis_repository: RedisRepository = Depends()) -> ReadingGroupsUseCase:
    return ReadingGroupsUseCase(app_repository, redis_repository)


def mural_use_case(app_repository: AppRepository = Depends(), redis_repository: RedisRepository = Depends()) -> ReadingGroupMuralUseCase:
    return ReadingGroupMuralUseCase(app_repository, redis_repository)


@router.get(path="", status_code=status.HTTP_200_OK, response_model=GroupsResponse)
async def get_reading_groups(
    request: Request,
    payload_token: dict = Depends(session_token_required),
    groups: ReadingGroupsUseCase = Depends(use_case),
) -> GroupsResponse:
    return await groups.list_groups(payload_token)


@router.post(
    path="",
    status_code=status.HTTP_201_CREATED,
    response_model=GroupResponse,
    responses={status.HTTP_422_UNPROCESSABLE_ENTITY: {"description": "reading_group.consent_required · plan_not_found"}},
)
async def post_reading_group(
    request: Request,
    data: PostReadingGroupSchema,
    payload_token: dict = Depends(session_token_required),
    groups: ReadingGroupsUseCase = Depends(use_case),
) -> GroupResponse:
    return await groups.create_group(payload_token, data)


# Fixed paths come before "/{group_id}" so "invites" / "my-shares" are never read as an id.

@router.get(path="/my-shares", status_code=status.HTTP_200_OK, response_model=MySharesResponse)
async def get_my_shares(
    request: Request,
    payload_token: dict = Depends(session_token_required),
    mural: ReadingGroupMuralUseCase = Depends(mural_use_case),
) -> MySharesResponse:
    """Where my annotations are shared, across all my groups (for the reader and the day page)."""
    return await mural.my_shares(payload_token)


@router.get(path="/invites/{token}", status_code=status.HTTP_200_OK, response_model=InvitePreview, responses=INVITE)
async def get_invite(
    request: Request,
    token: str,
    payload_token: dict = Depends(session_token_required),
    groups: ReadingGroupsUseCase = Depends(use_case),
) -> InvitePreview:
    return await groups.preview_invite(payload_token, token)


@router.post(
    path="/invites/{token}/join",
    status_code=status.HTTP_200_OK,
    response_model=GroupResponse,
    responses={**INVITE, status.HTTP_422_UNPROCESSABLE_ENTITY: {"description": "reading_group.consent_required"}},
)
async def post_join(
    request: Request,
    token: str,
    data: PostJoinSchema,
    payload_token: dict = Depends(session_token_required),
    groups: ReadingGroupsUseCase = Depends(use_case),
) -> GroupResponse:
    return await groups.join(payload_token, token, data)


@router.get(path="/{group_id}", status_code=status.HTTP_200_OK, response_model=GroupResponse, responses=NOT_FOUND)
async def get_reading_group(
    request: Request,
    group_id: UUID,
    payload_token: dict = Depends(session_token_required),
    groups: ReadingGroupsUseCase = Depends(use_case),
) -> GroupResponse:
    return await groups.get_group(payload_token, group_id)


@router.patch(path="/{group_id}", status_code=status.HTTP_200_OK, response_model=GroupResponse, responses={**NOT_FOUND, **LEADER_ONLY})
async def patch_reading_group(
    request: Request,
    group_id: UUID,
    data: PatchReadingGroupSchema,
    payload_token: dict = Depends(session_token_required),
    groups: ReadingGroupsUseCase = Depends(use_case),
) -> GroupResponse:
    return await groups.update_group(payload_token, group_id, data)


@router.delete(path="/{group_id}", status_code=status.HTTP_204_NO_CONTENT, responses={**NOT_FOUND, **LEADER_ONLY})
async def delete_reading_group(
    request: Request,
    group_id: UUID,
    payload_token: dict = Depends(session_token_required),
    groups: ReadingGroupsUseCase = Depends(use_case),
) -> Response:
    await groups.delete_group(payload_token, group_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(path="/{group_id}/invite", status_code=status.HTTP_200_OK, response_model=GroupResponse, responses={**NOT_FOUND, **LEADER_ONLY})
async def post_invite(
    request: Request,
    group_id: UUID,
    data: PostInviteSchema = PostInviteSchema(),
    payload_token: dict = Depends(session_token_required),
    groups: ReadingGroupsUseCase = Depends(use_case),
) -> GroupResponse:
    return await groups.create_invite(payload_token, group_id, data)


@router.delete(path="/{group_id}/invite", status_code=status.HTTP_200_OK, response_model=GroupResponse, responses={**NOT_FOUND, **LEADER_ONLY})
async def delete_invite(
    request: Request,
    group_id: UUID,
    payload_token: dict = Depends(session_token_required),
    groups: ReadingGroupsUseCase = Depends(use_case),
) -> GroupResponse:
    return await groups.revoke_invite(payload_token, group_id)


@router.patch(path="/{group_id}/members/me", status_code=status.HTTP_200_OK, response_model=GroupResponse, responses=NOT_FOUND)
async def patch_my_membership(
    request: Request,
    group_id: UUID,
    data: PatchMembershipSchema,
    payload_token: dict = Depends(session_token_required),
    groups: ReadingGroupsUseCase = Depends(use_case),
) -> GroupResponse:
    return await groups.update_membership(payload_token, group_id, data)


@router.delete(
    path="/{group_id}/members/me",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={**NOT_FOUND, status.HTTP_422_UNPROCESSABLE_ENTITY: {"description": "reading_group.leader_cannot_leave"}},
)
async def leave_reading_group(
    request: Request,
    group_id: UUID,
    payload_token: dict = Depends(session_token_required),
    groups: ReadingGroupsUseCase = Depends(use_case),
) -> Response:
    await groups.leave(payload_token, group_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete(
    path="/{group_id}/members/{member_id}",
    status_code=status.HTTP_200_OK,
    response_model=GroupResponse,
    responses={**NOT_FOUND, **LEADER_ONLY, status.HTTP_422_UNPROCESSABLE_ENTITY: {"description": "reading_group.cannot_remove_leader"}},
)
async def remove_member(
    request: Request,
    group_id: UUID,
    member_id: UUID,
    payload_token: dict = Depends(session_token_required),
    groups: ReadingGroupsUseCase = Depends(use_case),
) -> GroupResponse:
    return await groups.remove_member(payload_token, group_id, member_id)


@router.put(path="/{group_id}/days/{day_index}/read", status_code=status.HTTP_200_OK, response_model=GroupResponse, responses=NOT_FOUND)
async def put_day_read(
    request: Request,
    group_id: UUID,
    day_index: int = Path(..., ge=1),
    payload_token: dict = Depends(session_token_required),
    groups: ReadingGroupsUseCase = Depends(use_case),
) -> GroupResponse:
    return await groups.set_day_read(payload_token, group_id, day_index, True)


@router.delete(path="/{group_id}/days/{day_index}/read", status_code=status.HTTP_200_OK, response_model=GroupResponse, responses=NOT_FOUND)
async def delete_day_read(
    request: Request,
    group_id: UUID,
    day_index: int = Path(..., ge=1),
    payload_token: dict = Depends(session_token_required),
    groups: ReadingGroupsUseCase = Depends(use_case),
) -> GroupResponse:
    return await groups.set_day_read(payload_token, group_id, day_index, False)


@router.put(
    path="/{group_id}/days/{day_index}/note",
    status_code=status.HTTP_200_OK,
    response_model=GroupResponse,
    responses={**NOT_FOUND, **LEADER_ONLY, status.HTTP_422_UNPROCESSABLE_ENTITY: {"description": "reading_group.study_not_found"}},
)
async def put_day_note(
    request: Request,
    group_id: UUID,
    data: PutNoteSchema,
    day_index: int = Path(..., ge=1),
    payload_token: dict = Depends(session_token_required),
    groups: ReadingGroupsUseCase = Depends(use_case),
) -> GroupResponse:
    return await groups.put_note(payload_token, group_id, day_index, data)


@router.delete(path="/{group_id}/days/{day_index}/note", status_code=status.HTTP_200_OK, response_model=GroupResponse, responses={**NOT_FOUND, **LEADER_ONLY})
async def delete_day_note(
    request: Request,
    group_id: UUID,
    day_index: int = Path(..., ge=1),
    payload_token: dict = Depends(session_token_required),
    groups: ReadingGroupsUseCase = Depends(use_case),
) -> GroupResponse:
    return await groups.delete_note(payload_token, group_id, day_index)


@router.get(
    path="/{group_id}/days/{day_index}/study",
    status_code=status.HTTP_200_OK,
    response_model=GroupStudyResponse,
    responses={status.HTTP_404_NOT_FOUND: {"description": "reading_group.not_found / reading_group.study_not_found"}},
)
async def get_day_study(
    request: Request,
    group_id: UUID,
    day_index: int = Path(..., ge=1),
    payload_token: dict = Depends(session_token_required),
    groups: ReadingGroupsUseCase = Depends(use_case),
) -> GroupStudyResponse:
    return await groups.get_day_study(payload_token, group_id, day_index)


# ── Mural da passagem ──

SHARE_NOT_FOUND = {status.HTTP_404_NOT_FOUND: {"description": "reading_group.not_found / share_not_found / reply_not_found"}}


@router.get(path="/{group_id}/days/{day_index}/mural", status_code=status.HTTP_200_OK, response_model=MuralResponse, responses=NOT_FOUND)
async def get_day_mural(
    request: Request,
    group_id: UUID,
    day_index: int = Path(..., ge=1),
    payload_token: dict = Depends(session_token_required),
    mural: ReadingGroupMuralUseCase = Depends(mural_use_case),
) -> MuralResponse:
    return await mural.day_mural(payload_token, group_id, day_index)


@router.post(
    path="/{group_id}/shares",
    status_code=status.HTTP_201_CREATED,
    response_model=ShareResponse,
    responses={**NOT_FOUND, status.HTTP_200_OK: {"description": "Already shared: the existing share"},
               status.HTTP_422_UNPROCESSABLE_ENTITY: {"description": "reading_group.annotation_not_found"}},
)
async def post_share(
    request: Request,
    response: Response,
    group_id: UUID,
    data: PostShareSchema,
    payload_token: dict = Depends(session_token_required),
    mural: ReadingGroupMuralUseCase = Depends(mural_use_case),
) -> ShareResponse:
    result, created = await mural.share(payload_token, group_id, data)
    if not created:
        response.status_code = status.HTTP_200_OK
    return result


@router.delete(path="/{group_id}/shares/{share_id}", status_code=status.HTTP_204_NO_CONTENT, responses=SHARE_NOT_FOUND)
async def delete_share(
    request: Request,
    group_id: UUID,
    share_id: UUID,
    payload_token: dict = Depends(session_token_required),
    mural: ReadingGroupMuralUseCase = Depends(mural_use_case),
) -> Response:
    await mural.unshare(payload_token, group_id, share_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(path="/{group_id}/shares/{share_id}/replies", status_code=status.HTTP_201_CREATED, response_model=ShareResponse, responses=SHARE_NOT_FOUND)
async def post_reply(
    request: Request,
    group_id: UUID,
    share_id: UUID,
    data: PostReplySchema,
    payload_token: dict = Depends(session_token_required),
    mural: ReadingGroupMuralUseCase = Depends(mural_use_case),
) -> ShareResponse:
    return await mural.reply(payload_token, group_id, share_id, data)


@router.delete(path="/{group_id}/shares/{share_id}/replies/{reply_id}", status_code=status.HTTP_200_OK, response_model=ShareResponse, responses={**SHARE_NOT_FOUND, **LEADER_ONLY})
async def delete_reply(
    request: Request,
    group_id: UUID,
    share_id: UUID,
    reply_id: UUID,
    payload_token: dict = Depends(session_token_required),
    mural: ReadingGroupMuralUseCase = Depends(mural_use_case),
) -> ShareResponse:
    return await mural.delete_reply(payload_token, group_id, share_id, reply_id)


@router.put(path="/{group_id}/shares/{share_id}/hidden", status_code=status.HTTP_200_OK, response_model=ShareResponse, responses={**SHARE_NOT_FOUND, **LEADER_ONLY})
async def put_share_hidden(
    request: Request,
    group_id: UUID,
    share_id: UUID,
    payload_token: dict = Depends(session_token_required),
    mural: ReadingGroupMuralUseCase = Depends(mural_use_case),
) -> ShareResponse:
    return await mural.set_hidden(payload_token, group_id, share_id, True)


@router.delete(path="/{group_id}/shares/{share_id}/hidden", status_code=status.HTTP_200_OK, response_model=ShareResponse, responses={**SHARE_NOT_FOUND, **LEADER_ONLY})
async def delete_share_hidden(
    request: Request,
    group_id: UUID,
    share_id: UUID,
    payload_token: dict = Depends(session_token_required),
    mural: ReadingGroupMuralUseCase = Depends(mural_use_case),
) -> ShareResponse:
    return await mural.set_hidden(payload_token, group_id, share_id, False)


@router.post(path="/{group_id}/shares/{share_id}/report", status_code=status.HTTP_200_OK, response_model=ShareResponse, responses=SHARE_NOT_FOUND)
async def post_share_report(
    request: Request,
    group_id: UUID,
    share_id: UUID,
    payload_token: dict = Depends(session_token_required),
    mural: ReadingGroupMuralUseCase = Depends(mural_use_case),
) -> ShareResponse:
    return await mural.report(payload_token, group_id, share_id)

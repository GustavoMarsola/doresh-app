"""
Reading groups through the API: creating a group from a plan, the invite link, joining with
consent, aggregate progress, the leader's note with a study, leaving and being removed.
"""
GROUPS_URL = "/api/v1/reading-groups"
PLANS_URL  = "/api/v1/reading-plans"
STUDY_URL  = "/api/v1/study"


async def plan_of(client) -> str:
    response = await client.post(PLANS_URL, json={"plan_slug": "evangelhos", "start_date": "2026-10-26"})
    assert response.status_code == 201, response.text
    return response.json()["plan"]["id"]


async def create_group(client, **body) -> dict:
    plan_id  = await plan_of(client)
    response = await client.post(GROUPS_URL, json={"name": "Célula de terça", "plan_id": plan_id, "consent": True, **body})
    assert response.status_code == 201, response.text
    return response.json()["group"]


async def invite_token(client, group_id) -> str:
    response = await client.post(f"{GROUPS_URL}/{group_id}/invite", json={"days": 7})
    assert response.status_code == 200, response.text
    return response.json()["group"]["invite"]["token"]


async def join(client, token, **body) -> dict:
    response = await client.post(f"{GROUPS_URL}/invites/{token}/join", json={"consent": True, **body})
    assert response.status_code == 200, response.text
    return response.json()["group"]


async def group_with_member(client_as, user_a, user_b, **join_body):
    """A group led by A with B as a member; returns (a_client, b_client, group_id)."""
    a = await client_as(user_a)
    b = await client_as(user_b)
    group = await create_group(a)
    await join(b, await invite_token(a, group["id"]), **join_body)
    return a, b, group["id"]


async def detail(client, group_id) -> dict:
    response = await client.get(f"{GROUPS_URL}/{group_id}")
    assert response.status_code == 200, response.text
    return response.json()["group"]


class TestCreateGroup:
    async def test_copies_the_plan_and_makes_me_the_leader(self, client_as, user_a):
        group = await create_group(await client_as(user_a), meeting_weekday=2)
        assert (group["title"], group["role"], group["members_count"], group["reading_days"], group["start_date"], group["invite"]) == (
            "Os Evangelhos em 3 meses", "leader", 1, 90, "2026-10-26", None,
        )
        assert group["members"][0]["is_me"] and group["members"][0]["name"] is not None
        assert any(d["is_meeting"] for d in group["days"]) and all(d["readers"] == 0 for d in group["days"])

    async def test_start_date_can_differ_from_the_plan(self, client_as, user_a):
        group = await create_group(await client_as(user_a), start_date="2026-11-02")
        assert group["days"][0]["date"] == "2026-11-02"

    async def test_requires_consent(self, client_as, user_a):
        client   = await client_as(user_a)
        plan_id  = await plan_of(client)
        response = await client.post(GROUPS_URL, json={"name": "Grupo", "plan_id": plan_id, "consent": False})
        assert (response.status_code, response.json()["detail"]) == (422, "reading_group.consent_required")

    async def test_plan_must_be_mine(self, client_as, user_a, user_b):
        plan_id  = await plan_of(await client_as(user_a))
        response = await (await client_as(user_b)).post(GROUPS_URL, json={"name": "Grupo", "plan_id": plan_id, "consent": True})
        assert (response.status_code, response.json()["detail"]) == (422, "reading_group.plan_not_found")

    async def test_requires_login(self, api_key_client):
        assert (await api_key_client.get(GROUPS_URL)).status_code == 401


class TestInviteAndJoin:
    async def test_invite_preview_shows_the_group_without_joining(self, client_as, user_a, user_b):
        a     = await client_as(user_a)
        group = await create_group(a)
        token = await invite_token(a, group["id"])
        b     = await client_as(user_b)
        preview = (await b.get(f"{GROUPS_URL}/invites/{token}")).json()
        mine    = (await b.get(GROUPS_URL)).json()["groups"]
        assert (preview["name"], preview["members_count"], preview["already_member"], preview["leader_name"] != "", mine) == (
            "Célula de terça", 1, False, True, [],
        )

    async def test_joining_needs_consent(self, client_as, user_a, user_b):
        a     = await client_as(user_a)
        group = await create_group(a)
        token = await invite_token(a, group["id"])
        response = await (await client_as(user_b)).post(f"{GROUPS_URL}/invites/{token}/join", json={"consent": False})
        assert (response.status_code, response.json()["detail"]) == (422, "reading_group.consent_required")

    async def test_member_joins_anonymously_by_default(self, client_as, user_a, user_b):
        a, b, group_id = await group_with_member(client_as, user_a, user_b)
        seen_by_leader = await detail(a, group_id)
        names = [m["name"] for m in seen_by_leader["members"]]
        assert (seen_by_leader["members_count"], names[0] is not None, names[1], seen_by_leader["invite"] is not None) == (2, True, None, True)

    async def test_member_can_choose_to_be_named(self, client_as, user_a, user_b):
        a, b, group_id = await group_with_member(client_as, user_a, user_b)
        await b.patch(f"{GROUPS_URL}/{group_id}/members/me", json={"show_name": True})
        names = [m["name"] for m in (await detail(a, group_id))["members"]]
        assert names[1] is not None

    async def test_joining_twice_keeps_one_membership(self, client_as, user_a, user_b):
        a     = await client_as(user_a)
        b     = await client_as(user_b)
        group = await create_group(a)
        token = await invite_token(a, group["id"])
        await join(b, token)
        again = await join(b, token)
        assert again["members_count"] == 2

    async def test_unknown_token_is_not_found(self, client_as, user_b):
        response = await (await client_as(user_b)).get(f"{GROUPS_URL}/invites/nao-existe")
        assert (response.status_code, response.json()["detail"]) == (404, "reading_group.invite_invalid")

    async def test_revoked_link_stops_working(self, client_as, user_a, user_b):
        a     = await client_as(user_a)
        group = await create_group(a)
        token = await invite_token(a, group["id"])
        revoked = (await a.delete(f"{GROUPS_URL}/{group['id']}/invite")).json()["group"]
        response = await (await client_as(user_b)).post(f"{GROUPS_URL}/invites/{token}/join", json={"consent": True})
        assert (revoked["invite"], response.status_code) == (None, 404)

    async def test_member_does_not_see_the_invite_link(self, client_as, user_a, user_b):
        _, b, group_id = await group_with_member(client_as, user_a, user_b)
        assert (await detail(b, group_id))["invite"] is None


class TestProgress:
    async def test_aggregate_shows_how_many_read_without_names(self, client_as, user_a, user_b):
        a, b, group_id = await group_with_member(client_as, user_a, user_b)
        await b.put(f"{GROUPS_URL}/{group_id}/days/1/read")
        seen_by_leader = await detail(a, group_id)
        day1 = seen_by_leader["days"][0]
        assert (day1["readers"], day1["status"], seen_by_leader["days_read"], seen_by_leader["next_day"]["index"]) == (1, "unread", 0, 1)
        assert [m["days_read"] for m in seen_by_leader["members"]] == [0, 1]

    async def test_unmarking_a_day(self, client_as, user_a, user_b):
        a, b, group_id = await group_with_member(client_as, user_a, user_b)
        await b.put(f"{GROUPS_URL}/{group_id}/days/1/read")
        group = (await b.delete(f"{GROUPS_URL}/{group_id}/days/1/read")).json()["group"]
        assert (group["days_read"], group["days"][0]["readers"]) == (0, 0)

    async def test_day_out_of_range_is_not_found(self, client_as, user_a):
        a     = await client_as(user_a)
        group = await create_group(a)
        response = await a.put(f"{GROUPS_URL}/{group['id']}/days/999/read")
        assert (response.status_code, response.json()["detail"]) == (404, "reading_group.day_not_found")

    async def test_rhythm_change_keeps_everyones_progress(self, client_as, user_a, user_b):
        a, b, group_id = await group_with_member(client_as, user_a, user_b)
        await b.put(f"{GROUPS_URL}/{group_id}/days/1/read")
        response = await a.patch(f"{GROUPS_URL}/{group_id}", json={"total_days": 180, "name": "Célula de quinta"})
        group    = response.json()["group"]
        assert (response.status_code, group["name"], group["reading_days"], group["days"][0]["readers"]) == (200, "Célula de quinta", 180, 1)

    async def test_lists_my_groups_with_progress(self, client_as, user_a, user_b):
        _, b, group_id = await group_with_member(client_as, user_a, user_b)
        await b.put(f"{GROUPS_URL}/{group_id}/days/1/read")
        groups = (await b.get(GROUPS_URL)).json()["groups"]
        assert [(g["id"], g["role"], g["days_read"], g["members_count"]) for g in groups] == [(group_id, "member", 1, 2)]


class TestLeaderNote:
    async def test_note_with_a_study_is_visible_to_members(self, client_as, user_a, user_b):
        a, b, group_id = await group_with_member(client_as, user_a, user_b)
        study = (await a.post(STUDY_URL, json={
            "title": "Estudo do dia 1", "sections": [{"title": "Ponto", "text": "Texto"}], "references": [],
        })).json()["study"]
        response = await a.put(f"{GROUPS_URL}/{group_id}/days/1/note", json={"text": "Leiam com atenção o capítulo 1.", "study_id": study["id"]})
        note     = (await detail(b, group_id))["days"][0]["note"]
        opened   = await b.get(f"{GROUPS_URL}/{group_id}/days/1/study")
        assert (response.status_code, note["text"], note["study_title"], opened.status_code, opened.json()["study"]["title"]) == (
            200, "Leiam com atenção o capítulo 1.", "Estudo do dia 1", 200, "Estudo do dia 1",
        )

    async def test_note_can_be_replaced_and_removed(self, client_as, user_a):
        a     = await client_as(user_a)
        group = await create_group(a)
        await a.put(f"{GROUPS_URL}/{group['id']}/days/1/note", json={"text": "Primeira"})
        replaced = (await a.put(f"{GROUPS_URL}/{group['id']}/days/1/note", json={"text": "Segunda"})).json()["group"]
        removed  = (await a.delete(f"{GROUPS_URL}/{group['id']}/days/1/note")).json()["group"]
        assert (replaced["days"][0]["note"]["text"], removed["days"][0]["note"]) == ("Segunda", None)

    async def test_only_the_leader_writes_notes(self, client_as, user_a, user_b):
        _, b, group_id = await group_with_member(client_as, user_a, user_b)
        response = await b.put(f"{GROUPS_URL}/{group_id}/days/1/note", json={"text": "Tentativa"})
        assert (response.status_code, response.json()["detail"]) == (403, "reading_group.leader_only")

    async def test_study_must_belong_to_the_leader(self, client_as, user_a, user_b):
        a, b, group_id = await group_with_member(client_as, user_a, user_b)
        study = (await b.post(STUDY_URL, json={"title": "Do membro", "sections": [], "references": []})).json()["study"]
        response = await a.put(f"{GROUPS_URL}/{group_id}/days/1/note", json={"text": "Nota", "study_id": study["id"]})
        assert (response.status_code, response.json()["detail"]) == (422, "reading_group.study_not_found")

    async def test_day_without_study_is_not_found(self, client_as, user_a):
        a     = await client_as(user_a)
        group = await create_group(a)
        await a.put(f"{GROUPS_URL}/{group['id']}/days/1/note", json={"text": "Só texto"})
        response = await a.get(f"{GROUPS_URL}/{group['id']}/days/1/study")
        assert (response.status_code, response.json()["detail"]) == (404, "reading_group.study_not_found")


class TestLeavingAndRemoving:
    async def test_member_leaves_and_can_come_back_by_the_link(self, client_as, user_a, user_b):
        a     = await client_as(user_a)
        b     = await client_as(user_b)
        group = await create_group(a)
        token = await invite_token(a, group["id"])
        await join(b, token)
        left  = await b.delete(f"{GROUPS_URL}/{group['id']}/members/me")
        gone  = await b.get(f"{GROUPS_URL}/{group['id']}")
        back  = await join(b, token)
        assert (left.status_code, gone.status_code, back["members_count"]) == (204, 404, 2)

    async def test_leader_cannot_leave_their_own_group(self, client_as, user_a):
        a     = await client_as(user_a)
        group = await create_group(a)
        response = await a.delete(f"{GROUPS_URL}/{group['id']}/members/me")
        assert (response.status_code, response.json()["detail"]) == (422, "reading_group.leader_cannot_leave")

    async def test_leader_removes_a_member(self, client_as, user_a, user_b):
        a, b, group_id = await group_with_member(client_as, user_a, user_b)
        member_id = next(m["id"] for m in (await detail(a, group_id))["members"] if not m["is_me"])
        response  = await a.delete(f"{GROUPS_URL}/{group_id}/members/{member_id}")
        gone      = await b.get(f"{GROUPS_URL}/{group_id}")
        assert (response.status_code, response.json()["group"]["members_count"], gone.status_code) == (200, 1, 404)

    async def test_leader_cannot_be_removed(self, client_as, user_a):
        a     = await client_as(user_a)
        group = await create_group(a)
        response = await a.delete(f"{GROUPS_URL}/{group['id']}/members/{group['members'][0]['id']}")
        assert (response.status_code, response.json()["detail"]) == (422, "reading_group.cannot_remove_leader")

    async def test_deleting_the_group_removes_it_for_everyone(self, client_as, user_a, user_b):
        a, b, group_id = await group_with_member(client_as, user_a, user_b)
        await a.put(f"{GROUPS_URL}/{group_id}/days/1/note", json={"text": "Nota"})
        response = await a.delete(f"{GROUPS_URL}/{group_id}")
        assert (response.status_code, (await b.get(f"{GROUPS_URL}/{group_id}")).status_code, (await b.get(GROUPS_URL)).json()["groups"]) == (204, 404, [])

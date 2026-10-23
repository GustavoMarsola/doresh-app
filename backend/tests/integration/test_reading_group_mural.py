"""
Mural da passagem: a member shares a comment or a highlight with the group, it shows up pinned
to the verse inside the day of the group's plan, others reply, the leader hides, anyone reports,
and unsharing (or leaving, or deleting the comment) takes it off the mural.
"""
GROUPS_URL   = "/api/v1/reading-groups"
PLANS_URL    = "/api/v1/reading-plans"
COMMENTS_URL = "/api/v1/bible/comments"
HIGHLIGHTS_URL = "/api/v1/bible/highlights"


async def group_with_member(client_as, user_a, user_b):
    """A group on "evangelhos" (day 1 = Mateus 1–2) led by A, with B as a member; B's name is shown."""
    a = await client_as(user_a)
    b = await client_as(user_b)
    plan  = (await a.post(PLANS_URL, json={"plan_slug": "evangelhos", "start_date": "2026-10-26"})).json()["plan"]
    group = (await a.post(GROUPS_URL, json={"name": "Grupo", "plan_id": plan["id"], "consent": True})).json()["group"]
    token = (await a.post(f"{GROUPS_URL}/{group['id']}/invite", json={})).json()["group"]["invite"]["token"]
    assert (await b.post(f"{GROUPS_URL}/invites/{token}/join", json={"consent": True, "show_name": True})).status_code == 200
    return a, b, group["id"]


async def comment_of(client, verse: int = 1, text: str = "Genealogia que aponta para Cristo") -> dict:
    response = await client.post(COMMENTS_URL, json={
        "book": "Mateus", "chapter": 1, "verse_start": verse, "verse_end": verse, "comment": text,
    })
    assert response.status_code == 201, response.text
    return response.json()["comment"]


async def share_comment(client, group_id, comment_id, expect: int = 201) -> dict:
    response = await client.post(f"{GROUPS_URL}/{group_id}/shares", json={"kind": "comment", "comment_id": comment_id})
    assert response.status_code == expect, response.text
    return response.json()["share"]


async def mural(client, group_id, day: int = 1) -> list[dict]:
    response = await client.get(f"{GROUPS_URL}/{group_id}/days/{day}/mural")
    assert response.status_code == 200, response.text
    return response.json()["shares"]


class TestSharing:
    async def test_shared_comment_appears_on_the_day_pinned_to_the_verse(self, client_as, user_a, user_b):
        a, b, group_id = await group_with_member(client_as, user_a, user_b)
        comment = await comment_of(b)
        share   = await share_comment(b, group_id, comment["id"])
        seen    = await mural(a, group_id)
        assert (share["kind"], share["author"]["is_me"], len(seen)) == ("comment", True, 1)
        assert (seen[0]["book"], seen[0]["chapter"], seen[0]["verse_start"], seen[0]["text"], seen[0]["author"]["name"] is not None) == (
            "mateus", 1, 1, "Genealogia que aponta para Cristo", True,
        )

    async def test_share_outside_the_day_is_not_on_that_day(self, client_as, user_a, user_b):
        a, b, group_id = await group_with_member(client_as, user_a, user_b)
        far = (await b.post(COMMENTS_URL, json={"book": "João", "chapter": 3, "verse_start": 16, "verse_end": 16, "comment": "Amor"})).json()["comment"]
        await share_comment(b, group_id, far["id"])
        assert await mural(a, group_id, day=1) == []

    async def test_sharing_twice_returns_the_same_share(self, client_as, user_a, user_b):
        _, b, group_id = await group_with_member(client_as, user_a, user_b)
        comment = await comment_of(b)
        first   = await share_comment(b, group_id, comment["id"])
        again   = await share_comment(b, group_id, comment["id"], expect=200)
        assert (first["id"] == again["id"], len(await mural(b, group_id))) == (True, 1)

    async def test_highlight_can_be_shared(self, client_as, user_a, user_b):
        a, b, group_id = await group_with_member(client_as, user_a, user_b)
        await b.put(HIGHLIGHTS_URL, json={"book": "Mateus", "chapter": 2, "verses": [1, 2], "color": "blue"})
        response = await b.post(f"{GROUPS_URL}/{group_id}/shares", json={
            "kind": "highlight", "book": "Mateus", "chapter": 2, "verse_start": 1, "verse_end": 2,
        })
        seen = await mural(a, group_id)
        assert (response.status_code, seen[0]["kind"], seen[0]["color"], seen[0]["text"]) == (201, "highlight", "blue", None)

    async def test_only_my_own_annotations_can_be_shared(self, client_as, user_a, user_b):
        a, b, group_id = await group_with_member(client_as, user_a, user_b)
        comment  = await comment_of(a)  # the leader's comment
        response = await b.post(f"{GROUPS_URL}/{group_id}/shares", json={"kind": "comment", "comment_id": comment["id"]})
        not_mine = await b.post(f"{GROUPS_URL}/{group_id}/shares", json={
            "kind": "highlight", "book": "Mateus", "chapter": 1, "verse_start": 5, "verse_end": 5,
        })
        assert (response.status_code, response.json()["detail"], not_mine.status_code) == (422, "reading_group.annotation_not_found", 422)

    async def test_my_shares_lists_where_each_annotation_went(self, client_as, user_a, user_b):
        _, b, group_id = await group_with_member(client_as, user_a, user_b)
        comment = await comment_of(b)
        await share_comment(b, group_id, comment["id"])
        mine = (await b.get(f"{GROUPS_URL}/my-shares")).json()["shares"]
        assert [(s["group_id"], s["group_name"], s["comment_id"]) for s in mine] == [(group_id, "Grupo", comment["id"])]


class TestUnsharing:
    async def test_unshare_removes_from_mural_but_keeps_my_comment(self, client_as, user_a, user_b):
        a, b, group_id = await group_with_member(client_as, user_a, user_b)
        comment = await comment_of(b)
        share   = await share_comment(b, group_id, comment["id"])
        gone    = await b.delete(f"{GROUPS_URL}/{group_id}/shares/{share['id']}")
        mine    = (await b.get(f"{COMMENTS_URL}?book=Mateus&chapter=1")).json()["comments"]
        assert (gone.status_code, await mural(a, group_id), [c["id"] for c in mine]) == (204, [], [comment["id"]])

    async def test_deleting_the_comment_takes_it_off_the_mural(self, client_as, user_a, user_b):
        a, b, group_id = await group_with_member(client_as, user_a, user_b)
        comment = await comment_of(b)
        await share_comment(b, group_id, comment["id"])
        assert (await b.delete(f"{COMMENTS_URL}/{comment['id']}")).status_code == 204
        assert await mural(a, group_id) == []

    async def test_leaving_the_group_removes_my_shares_and_replies(self, client_as, user_a, user_b):
        a, b, group_id = await group_with_member(client_as, user_a, user_b)
        shared_by_a = await share_comment(a, group_id, (await comment_of(a))["id"])
        await share_comment(b, group_id, (await comment_of(b, verse=2))["id"])
        await b.post(f"{GROUPS_URL}/{group_id}/shares/{shared_by_a['id']}/replies", json={"text": "Amém"})
        await b.delete(f"{GROUPS_URL}/{group_id}/members/me")
        seen = await mural(a, group_id)
        assert ([s["id"] for s in seen], seen[0]["replies"]) == ([shared_by_a["id"]], [])

    async def test_only_the_author_unshares(self, client_as, user_a, user_b):
        a, b, group_id = await group_with_member(client_as, user_a, user_b)
        share    = await share_comment(b, group_id, (await comment_of(b))["id"])
        response = await a.delete(f"{GROUPS_URL}/{group_id}/shares/{share['id']}")
        assert (response.status_code, len(await mural(a, group_id))) == (404, 1)


class TestRepliesHidingAndReports:
    async def test_reply_is_seen_by_the_author(self, client_as, user_a, user_b):
        a, b, group_id = await group_with_member(client_as, user_a, user_b)
        share    = await share_comment(b, group_id, (await comment_of(b))["id"])
        response = await a.post(f"{GROUPS_URL}/{group_id}/shares/{share['id']}/replies", json={"text": "Que bom ver isso!"})
        seen     = (await mural(b, group_id))[0]
        assert (response.status_code, [(r["text"], r["author"]["role"], r["author"]["is_me"]) for r in seen["replies"]]) == (
            201, [("Que bom ver isso!", "leader", False)],
        )

    async def test_author_deletes_own_reply_and_leader_deletes_any(self, client_as, user_a, user_b):
        a, b, group_id = await group_with_member(client_as, user_a, user_b)
        share = await share_comment(a, group_id, (await comment_of(a))["id"])
        r1 = (await b.post(f"{GROUPS_URL}/{group_id}/shares/{share['id']}/replies", json={"text": "um"})).json()["share"]["replies"][0]
        r2 = (await b.post(f"{GROUPS_URL}/{group_id}/shares/{share['id']}/replies", json={"text": "dois"})).json()["share"]["replies"][1]
        own    = await b.delete(f"{GROUPS_URL}/{group_id}/shares/{share['id']}/replies/{r1['id']}")
        leader = await a.delete(f"{GROUPS_URL}/{group_id}/shares/{share['id']}/replies/{r2['id']}")
        assert (own.status_code, leader.status_code, leader.json()["share"]["replies"]) == (200, 200, [])

    async def test_member_cannot_delete_someone_elses_reply(self, client_as, user_a, user_b):
        a, b, group_id = await group_with_member(client_as, user_a, user_b)
        share = await share_comment(b, group_id, (await comment_of(b))["id"])
        reply = (await a.post(f"{GROUPS_URL}/{group_id}/shares/{share['id']}/replies", json={"text": "do líder"})).json()["share"]["replies"][0]
        response = await b.delete(f"{GROUPS_URL}/{group_id}/shares/{share['id']}/replies/{reply['id']}")
        assert (response.status_code, response.json()["detail"]) == (403, "reading_group.leader_only")

    async def test_leader_hides_and_members_stop_seeing_it(self, client_as, user_a, user_b):
        a, b, group_id = await group_with_member(client_as, user_a, user_b)
        share  = await share_comment(b, group_id, (await comment_of(b))["id"])
        hidden = await a.put(f"{GROUPS_URL}/{group_id}/shares/{share['id']}/hidden")
        leader_view = await mural(a, group_id)
        member_view = await mural(b, group_id)
        assert (hidden.status_code, hidden.json()["share"]["hidden"], leader_view[0]["hidden"], member_view) == (200, True, True, [])
        shown = await a.delete(f"{GROUPS_URL}/{group_id}/shares/{share['id']}/hidden")
        assert (shown.json()["share"]["hidden"], len(await mural(b, group_id))) == (False, 1)

    async def test_only_the_leader_hides(self, client_as, user_a, user_b):
        a, b, group_id = await group_with_member(client_as, user_a, user_b)
        share    = await share_comment(a, group_id, (await comment_of(a))["id"])
        response = await b.put(f"{GROUPS_URL}/{group_id}/shares/{share['id']}/hidden")
        assert (response.status_code, response.json()["detail"]) == (403, "reading_group.leader_only")

    async def test_report_counts_once_per_member_and_only_the_leader_sees_the_count(self, client_as, user_a, user_b):
        a, b, group_id = await group_with_member(client_as, user_a, user_b)
        share = await share_comment(a, group_id, (await comment_of(a))["id"])
        await b.post(f"{GROUPS_URL}/{group_id}/shares/{share['id']}/report")
        mine   = (await b.post(f"{GROUPS_URL}/{group_id}/shares/{share['id']}/report")).json()["share"]
        leader = (await mural(a, group_id))[0]
        assert (mine["reports"], mine["reported_by_me"], leader["reports"]) == (0, True, 1)


class TestMuralOwnership:
    async def test_outsider_sees_nothing_and_shares_nothing(self, client_as, user_a, user_b, make_user):
        a, b, group_id = await group_with_member(client_as, user_a, user_b)
        share = await share_comment(b, group_id, (await comment_of(b))["id"])
        c = await client_as(await make_user())
        own = await comment_of(c)
        codes = [
            (await c.get(f"{GROUPS_URL}/{group_id}/days/1/mural")).status_code,
            (await c.post(f"{GROUPS_URL}/{group_id}/shares", json={"kind": "comment", "comment_id": own["id"]})).status_code,
            (await c.post(f"{GROUPS_URL}/{group_id}/shares/{share['id']}/replies", json={"text": "x"})).status_code,
            (await c.post(f"{GROUPS_URL}/{group_id}/shares/{share['id']}/report")).status_code,
            (await c.delete(f"{GROUPS_URL}/{group_id}/shares/{share['id']}")).status_code,
        ]
        assert (codes, len(await mural(a, group_id))) == ([404] * 5, 1)

    async def test_unshared_comment_never_appears(self, client_as, user_a, user_b):
        a, b, group_id = await group_with_member(client_as, user_a, user_b)
        await comment_of(b, text="Só para mim")
        await share_comment(b, group_id, (await comment_of(b, verse=2, text="Para o grupo"))["id"])
        assert [s["text"] for s in await mural(a, group_id)] == ["Para o grupo"]

    async def test_shares_stay_inside_their_group(self, client_as, user_a, user_b):
        a, b, group_id = await group_with_member(client_as, user_a, user_b)
        await share_comment(b, group_id, (await comment_of(b))["id"])
        plan  = (await a.post(PLANS_URL, json={"plan_slug": "evangelhos", "start_date": "2026-10-26"})).json()["plan"]
        other = (await a.post(GROUPS_URL, json={"name": "Outro", "plan_id": plan["id"], "consent": True})).json()["group"]
        assert await mural(a, other["id"]) == []

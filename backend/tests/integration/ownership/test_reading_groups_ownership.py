"""
Someone who is not a member can't see or touch a group — not even by direct URL — and a
member can't do what only the leader may.
"""
GROUPS_URL = "/api/v1/reading-groups"
PLANS_URL  = "/api/v1/reading-plans"


async def group_of(client) -> dict:
    plan     = (await client.post(PLANS_URL, json={"plan_slug": "evangelhos", "start_date": "2026-10-26"})).json()["plan"]
    response = await client.post(GROUPS_URL, json={"name": "Grupo de A", "plan_id": plan["id"], "consent": True})
    return response.json()["group"]


async def member_of(leader_client, member_client, group_id) -> None:
    token = (await leader_client.post(f"{GROUPS_URL}/{group_id}/invite", json={"days": 7})).json()["group"]["invite"]["token"]
    assert (await member_client.post(f"{GROUPS_URL}/invites/{token}/join", json={"consent": True})).status_code == 200


class TestReadingGroupsOwnership:
    async def test_outsider_sees_nothing_of_the_group(self, client_as, user_a, user_b):
        a     = await client_as(user_a)
        group = await group_of(a)
        await a.put(f"{GROUPS_URL}/{group['id']}/days/1/note", json={"text": "Nota do líder"})
        b     = await client_as(user_b)
        codes = [
            (await b.get(f"{GROUPS_URL}/{group['id']}")).status_code,
            (await b.get(f"{GROUPS_URL}/{group['id']}/days/1/study")).status_code,
            (await b.put(f"{GROUPS_URL}/{group['id']}/days/1/read")).status_code,
            (await b.patch(f"{GROUPS_URL}/{group['id']}", json={"name": "Meu"})).status_code,
            (await b.post(f"{GROUPS_URL}/{group['id']}/invite", json={})).status_code,
            (await b.put(f"{GROUPS_URL}/{group['id']}/days/1/note", json={"text": "x"})).status_code,
            (await b.delete(f"{GROUPS_URL}/{group['id']}/members/{group['members'][0]['id']}")).status_code,
            (await b.delete(f"{GROUPS_URL}/{group['id']}")).status_code,
        ]
        assert (codes, (await b.get(GROUPS_URL)).json()["groups"]) == ([404] * 8, [])
        assert (await a.get(f"{GROUPS_URL}/{group['id']}")).json()["group"]["name"] == "Grupo de A"

    async def test_member_cannot_act_as_leader(self, client_as, user_a, user_b):
        a     = await client_as(user_a)
        group = await group_of(a)
        b     = await client_as(user_b)
        await member_of(a, b, group["id"])
        codes = [
            (await b.patch(f"{GROUPS_URL}/{group['id']}", json={"name": "Meu"})).status_code,
            (await b.post(f"{GROUPS_URL}/{group['id']}/invite", json={})).status_code,
            (await b.delete(f"{GROUPS_URL}/{group['id']}/invite")).status_code,
            (await b.put(f"{GROUPS_URL}/{group['id']}/days/1/note", json={"text": "x"})).status_code,
            (await b.delete(f"{GROUPS_URL}/{group['id']}/days/1/note")).status_code,
            (await b.delete(f"{GROUPS_URL}/{group['id']}/members/{group['members'][0]['id']}")).status_code,
            (await b.delete(f"{GROUPS_URL}/{group['id']}")).status_code,
        ]
        assert codes == [403] * 7

    async def test_member_marks_only_their_own_progress(self, client_as, user_a, user_b):
        a     = await client_as(user_a)
        group = await group_of(a)
        b     = await client_as(user_b)
        await member_of(a, b, group["id"])
        await b.put(f"{GROUPS_URL}/{group['id']}/days/1/read")
        leader_view = (await a.get(f"{GROUPS_URL}/{group['id']}")).json()["group"]
        assert (leader_view["days_read"], leader_view["days"][0]["readers"]) == (0, 1)

    async def test_members_do_not_see_each_others_private_studies(self, client_as, user_a, user_b):
        """Only the study attached to a note is readable; a member's own studies stay private."""
        a     = await client_as(user_a)
        group = await group_of(a)
        b     = await client_as(user_b)
        await member_of(a, b, group["id"])
        study = (await b.post("/api/v1/study", json={"title": "Privado de B", "sections": [], "references": []})).json()["study"]
        assert (await a.get(f"/api/v1/study/{study['id']}")).status_code == 404

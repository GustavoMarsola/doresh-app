"""
User B can't see, change, mark, realign or remove user A's reading plans.
"""
PLANS_URL = "/api/v1/reading-plans"


async def plan_of(client) -> str:
    response = await client.post(PLANS_URL, json={"plan_slug": "evangelhos", "start_date": "2026-10-26"})
    return response.json()["plan"]["id"]


async def progress(client, plan_id) -> tuple[int, int]:
    plan = (await client.get(f"{PLANS_URL}/{plan_id}")).json()["plan"]
    return plan["days_read"], plan["total_days"]


class TestReadingPlansOwnership:
    async def test_b_does_not_see_a_plans(self, client_as, user_a, user_b):
        plan_id = await plan_of(await client_as(user_a))
        b       = await client_as(user_b)
        listed  = (await b.get(PLANS_URL)).json()["plans"]
        direct  = await b.get(f"{PLANS_URL}/{plan_id}")
        assert (listed, direct.status_code) == ([], 404)

    async def test_b_cannot_mark_change_realign_or_delete_a_plan(self, client_as, user_a, user_b):
        a       = await client_as(user_a)
        plan_id = await plan_of(a)
        b       = await client_as(user_b)
        codes = [
            (await b.put(f"{PLANS_URL}/{plan_id}/days/1/read")).status_code,
            (await b.patch(f"{PLANS_URL}/{plan_id}", json={"total_days": 30})).status_code,
            (await b.post(f"{PLANS_URL}/{plan_id}/realign", json={"today": "2026-12-01"})).status_code,
            (await b.delete(f"{PLANS_URL}/{plan_id}")).status_code,
        ]
        assert (codes, await progress(a, plan_id)) == ([404, 404, 404, 404], (0, 90))

"""
Reading plans through the API: catalogue, starting a plan, marking days, changing the rhythm
without losing progress, "realign dates" and removing a plan.
"""
PLANS_URL   = "/api/v1/reading-plans"
CATALOG_URL = f"{PLANS_URL}/catalog"


async def start(client, **body) -> dict:
    response = await client.post(PLANS_URL, json={"plan_slug": "biblia-em-1-ano", "start_date": "2026-10-26", **body})
    assert response.status_code == 201, response.text
    return response.json()["plan"]


async def mark(client, plan_id, day: int, read: bool = True) -> dict:
    method   = "PUT" if read else "DELETE"
    response = await client.request(method, f"{PLANS_URL}/{plan_id}/days/{day}/read")
    assert response.status_code == 200, response.text
    return response.json()["plan"]


def statuses(plan: dict, count: int) -> list[str]:
    return [d["status"] for d in plan["days"][:count]]


class TestCatalog:
    async def test_lists_the_standard_plans(self, client_as, user_a):
        response = await (await client_as(user_a)).get(CATALOG_URL)
        slugs    = [p["slug"] for p in response.json()["plans"]]
        assert "biblia-em-1-ano" in slugs and "um-livro" in slugs

    async def test_requires_login(self, api_key_client):
        assert (await api_key_client.get(CATALOG_URL)).status_code == 401


class TestStartPlan:
    async def test_uses_the_plan_defaults(self, client_as, user_a):
        plan = await start(await client_as(user_a))
        assert (plan["reading_days"], plan["days_read"], plan["next_day"]["index"], plan["days"][0]["date"]) == (
            365, 0, 1, "2026-10-26",
        )

    async def test_book_plan_reads_the_chosen_book(self, client_as, user_a):
        plan  = await start(await client_as(user_a), plan_slug="um-livro", book="romanos")
        books = {p["book"] for d in plan["days"] for p in d["passages"]}
        assert (plan["title"], books, plan["reading_days"]) == ("Leitura de Romanos", {"Romanos"}, 16)

    async def test_unknown_plan_is_rejected(self, client_as, user_a):
        response = await (await client_as(user_a)).post(PLANS_URL, json={"plan_slug": "nao-existe"})
        assert (response.status_code, response.json()["detail"]) == (422, "reading_plan.unknown_plan")

    async def test_book_plan_without_book_is_rejected(self, client_as, user_a):
        response = await (await client_as(user_a)).post(PLANS_URL, json={"plan_slug": "um-livro"})
        assert (response.status_code, response.json()["detail"]) == (422, "reading_plan.invalid_book")

    async def test_too_long_for_a_short_book_is_rejected(self, client_as, user_a):
        response = await (await client_as(user_a)).post(
            PLANS_URL, json={"plan_slug": "um-livro", "book": "Obadias", "total_days": 365},
        )
        assert (response.status_code, response.json()["detail"]) == (422, "reading_plan.too_many_days")


class TestProgress:
    async def test_marking_days_counts_days_read(self, client_as, user_a):
        client = await client_as(user_a)
        plan   = await start(client)
        await mark(client, plan["id"], 1)
        plan = await mark(client, plan["id"], 2)
        assert (plan["days_read"], plan["next_day"]["index"]) == (2, 3)

    async def test_next_day_is_the_first_unread_even_when_a_later_day_was_read(self, client_as, user_a):
        client = await client_as(user_a)
        plan   = await start(client)
        await mark(client, plan["id"], 1)
        plan = await mark(client, plan["id"], 3)
        assert plan["next_day"]["index"] == 2

    async def test_unmarking_a_day(self, client_as, user_a):
        client = await client_as(user_a)
        plan   = await start(client)
        await mark(client, plan["id"], 1)
        plan = await mark(client, plan["id"], 1, read=False)
        assert (plan["days_read"], statuses(plan, 1)) == (0, ["unread"])

    async def test_day_out_of_range_is_not_found(self, client_as, user_a):
        client   = await client_as(user_a)
        plan     = await start(client)
        response = await client.put(f"{PLANS_URL}/{plan['id']}/days/999/read")
        assert (response.status_code, response.json()["detail"]) == (404, "reading_plan.day_not_found")


class TestRhythm:
    async def test_longer_duration_keeps_the_days_already_read(self, client_as, user_a):
        client = await client_as(user_a)
        plan   = await start(client)
        await mark(client, plan["id"], 1)
        await mark(client, plan["id"], 2)
        plan = (await client.patch(f"{PLANS_URL}/{plan['id']}", json={"total_days": 730})).json()["plan"]
        assert (plan["reading_days"], statuses(plan, 5)) == (730, ["read", "read", "read", "read", "unread"])

    async def test_weekdays_only_drops_weekends(self, client_as, user_a):
        client = await client_as(user_a)
        plan   = await start(client)
        plan   = (await client.patch(f"{PLANS_URL}/{plan['id']}", json={"weekdays": [1, 2, 3, 4, 5]})).json()["plan"]
        assert (plan["weekdays"], plan["reading_days"]) == ([1, 2, 3, 4, 5], 261)

    async def test_invalid_weekday_is_rejected_and_nothing_changes(self, client_as, user_a):
        client   = await client_as(user_a)
        plan     = await start(client)
        response = await client.patch(f"{PLANS_URL}/{plan['id']}", json={"weekdays": [8]})
        again    = (await client.get(f"{PLANS_URL}/{plan['id']}")).json()["plan"]
        assert (response.status_code, again["weekdays"]) == (422, [1, 2, 3, 4, 5, 6, 7])

    async def test_realign_puts_the_next_day_on_today(self, client_as, user_a):
        client = await client_as(user_a)
        plan   = await start(client)
        await mark(client, plan["id"], 1)
        response = await client.post(f"{PLANS_URL}/{plan['id']}/realign", json={"today": "2026-12-01"})
        plan     = response.json()["plan"]
        assert (plan["next_day"]["index"], plan["next_day"]["date"], plan["reading_days"], plan["days_read"]) == (
            2, "2026-12-01", 365, 1,
        )


class TestListAndDelete:
    async def test_lists_my_plans_with_progress(self, client_as, user_a):
        client = await client_as(user_a)
        plan   = await start(client)
        await mark(client, plan["id"], 1)
        plans = (await client.get(PLANS_URL)).json()["plans"]
        assert [(p["id"], p["days_read"]) for p in plans] == [(plan["id"], 1)]

    async def test_delete_removes_the_plan(self, client_as, user_a):
        client   = await client_as(user_a)
        plan     = await start(client)
        response = await client.delete(f"{PLANS_URL}/{plan['id']}")
        after    = await client.get(f"{PLANS_URL}/{plan['id']}")
        assert (response.status_code, after.status_code) == (204, 404)

"""
User B can't see, change or remove user A's highlights and comments.
"""
HIGHLIGHTS_URL = "/api/v1/bible/highlights"
COMMENTS_URL   = "/api/v1/bible/comments"
PASSAGE        = {"book": "João", "chapter": 3}


async def highlight(client, verses, color):
    return await client.put(HIGHLIGHTS_URL, json={**PASSAGE, "verses": verses, "color": color})


async def comment(client) -> str:
    response = await client.post(COMMENTS_URL, json={**PASSAGE, "verse_start": 16, "verse_end": 16, "comment": "de A"})
    return response.json()["comment"]["id"]


async def highlights_of(client) -> list[tuple[int, str]]:
    response = await client.get(HIGHLIGHTS_URL, params=PASSAGE)
    return [(h["verse"], h["color"]) for h in response.json()["highlights"]]


class TestHighlightsOwnership:
    async def test_b_does_not_see_a_highlights(self, client_as, user_a, user_b):
        await highlight(await client_as(user_a), [16], "yellow")
        assert await highlights_of(await client_as(user_b)) == []

    async def test_b_highlighting_the_same_verse_does_not_recolour_a(self, client_as, user_a, user_b):
        a = await client_as(user_a)
        await highlight(a, [16], "yellow")
        await highlight(await client_as(user_b), [16], "red")
        assert await highlights_of(a) == [(16, "yellow")]

    async def test_b_removing_the_same_verse_keeps_a_highlight(self, client_as, user_a, user_b):
        a = await client_as(user_a)
        await highlight(a, [16], "yellow")
        await (await client_as(user_b)).delete(HIGHLIGHTS_URL, params={**PASSAGE, "verses": [16]})
        assert await highlights_of(a) == [(16, "yellow")]


class TestCommentsOwnership:
    async def test_b_does_not_see_a_comments(self, client_as, user_a, user_b):
        await comment(await client_as(user_a))
        response = await (await client_as(user_b)).get(COMMENTS_URL, params=PASSAGE)
        assert response.json()["comments"] == []

    async def test_b_cannot_delete_a_comment(self, client_as, user_a, user_b):
        a          = await client_as(user_a)
        comment_id = await comment(a)
        response   = await (await client_as(user_b)).delete(f"{COMMENTS_URL}/{comment_id}")
        remaining  = (await a.get(COMMENTS_URL, params=PASSAGE)).json()["comments"]
        assert (response.status_code, len(remaining)) == (404, 1)

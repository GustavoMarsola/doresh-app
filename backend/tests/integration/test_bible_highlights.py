"""
Verse highlights: one row per verse, keyed by book slug + chapter + verse; PUT upserts the colour,
DELETE removes, GET lists one chapter. References are validated against the Bible text.
"""
HIGHLIGHTS_URL = "/api/v1/bible/highlights"


def verse_colors(response) -> list[tuple[int, str]]:
    return [(h["verse"], h["color"]) for h in response.json()["highlights"]]


async def put(client, verses, color="yellow", book="João", chapter=3):
    return await client.put(HIGHLIGHTS_URL, json={"book": book, "chapter": chapter, "verses": verses, "color": color})


class TestPutHighlights:
    async def test_stores_the_reference_with_the_book_slug(self, client_as, user_a):
        client   = await client_as(user_a)
        response = await put(client, [4, 5], book="1 Coríntios", chapter=13)
        assert (response.status_code, response.json()["highlights"][0]["book"], verse_colors(response)) == (
            200, "1_corintios", [(4, "yellow"), (5, "yellow")],
        )

    async def test_recolours_highlighted_verses_without_duplicating(self, client_as, user_a):
        client = await client_as(user_a)
        await put(client, [16, 17], color="yellow")
        response = await put(client, [17, 18], color="blue")
        assert verse_colors(response) == [(16, "yellow"), (17, "blue"), (18, "blue")]

    async def test_accepts_the_slug_as_book(self, client_as, user_a):
        client = await client_as(user_a)
        await put(client, [1], book="joao")
        response = await client.get(HIGHLIGHTS_URL, params={"book": "João", "chapter": 3})
        assert verse_colors(response) == [(1, "yellow")]

    async def test_rejects_a_verse_beyond_the_chapter(self, client_as, user_a):
        response = await put(await client_as(user_a), [37])  # João 3 has 36 verses
        assert (response.status_code, response.json()["detail"]) == (422, "bible.invalid_reference")

    async def test_rejects_a_chapter_beyond_the_book(self, client_as, user_a):
        response = await put(await client_as(user_a), [1], chapter=22)  # João has 21 chapters
        assert response.status_code == 422

    async def test_rejects_an_unknown_book(self, client_as, user_a):
        response = await put(await client_as(user_a), [1], book="../nvi/joao")
        assert (response.status_code, response.json()["detail"]) == (422, "bible.invalid_reference")

    async def test_rejects_an_unknown_colour(self, client_as, user_a):
        response = await put(await client_as(user_a), [1], color="green")
        assert response.status_code == 422

    async def test_requires_a_session(self, anonymous_client):
        response = await put(anonymous_client, [1])
        assert response.status_code == 401


class TestDeleteHighlights:
    async def test_removes_only_the_given_verses(self, client_as, user_a):
        client = await client_as(user_a)
        await put(client, [16, 17, 18])
        response = await client.delete(HIGHLIGHTS_URL, params={"book": "João", "chapter": 3, "verses": [16, 18]})
        assert (response.status_code, verse_colors(response)) == (200, [(17, "yellow")])


class TestGetHighlights:
    async def test_lists_only_the_requested_chapter(self, client_as, user_a):
        client = await client_as(user_a)
        await put(client, [16], chapter=3)
        await put(client, [1], chapter=4)
        response = await client.get(HIGHLIGHTS_URL, params={"book": "João", "chapter": 3})
        assert verse_colors(response) == [(16, "yellow")]


class TestProfileHighlights:
    async def test_include_the_verse_text_in_the_requested_version(self, client_as, user_a):
        client = await client_as(user_a)
        await put(client, [16])
        nvi = (await client.get("/api/v1/user/profile")).json()["highlights"][0]["text"]
        ara = (await client.get("/api/v1/user/profile", params={"version": "ara"})).json()["highlights"][0]["text"]
        assert ("Deus tanto amou o mundo" in nvi, "Deus amou o mundo de tal maneira" in ara) == (True, True)

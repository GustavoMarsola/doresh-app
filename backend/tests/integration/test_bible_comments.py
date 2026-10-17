"""
Comments on a verse range of one chapter: book slug + chapter + verse_start..verse_end.
"""
COMMENTS_URL = "/api/v1/bible/comments"


def comment_body(**overrides) -> dict:
    return {"book": "1 Coríntios", "chapter": 13, "verse_start": 4, "verse_end": 7, "comment": "O amor é paciente", **overrides}


class TestPostComment:
    async def test_stores_the_range_and_lists_it_in_the_chapter(self, client_as, user_a):
        client  = await client_as(user_a)
        created = await client.post(COMMENTS_URL, json=comment_body())
        listed  = await client.get(COMMENTS_URL, params={"book": "1 Coríntios", "chapter": 13})
        comment = listed.json()["comments"][0]
        assert (created.status_code, comment["book"], comment["verse_start"], comment["verse_end"]) == (
            201, "1_corintios", 4, 7,
        )

    async def test_rejects_an_inverted_range(self, client_as, user_a):
        response = await (await client_as(user_a)).post(COMMENTS_URL, json=comment_body(verse_start=7, verse_end=4))
        assert response.status_code == 422

    async def test_rejects_a_range_beyond_the_chapter(self, client_as, user_a):
        response = await (await client_as(user_a)).post(COMMENTS_URL, json=comment_body(verse_end=14))  # 1Co 13 has 13
        assert (response.status_code, response.json()["detail"]) == (422, "bible.invalid_reference")

    async def test_rejects_an_empty_comment(self, client_as, user_a):
        response = await (await client_as(user_a)).post(COMMENTS_URL, json=comment_body(comment=""))
        assert response.status_code == 422


class TestDeleteComment:
    async def test_removes_the_comment(self, client_as, user_a):
        client     = await client_as(user_a)
        comment_id = (await client.post(COMMENTS_URL, json=comment_body())).json()["comment"]["id"]
        deleted    = await client.delete(f"{COMMENTS_URL}/{comment_id}")
        listed     = await client.get(COMMENTS_URL, params={"book": "1 Coríntios", "chapter": 13})
        assert (deleted.status_code, listed.json()["comments"]) == (204, [])

    async def test_unknown_comment_is_not_found(self, client_as, user_a):
        response = await (await client_as(user_a)).delete(f"{COMMENTS_URL}/00000000-0000-0000-0000-000000000000")
        assert response.status_code == 404

import os
import re
import json
from functools import lru_cache
from src.common.utilities import normalize_string, read_json_file


def load_and_parse_bible(filepath_in: str, filepath_out: str):

    # Carrega a bíblia completa
    with open(filepath_in, 'r', encoding='utf-8-sig') as f:
        full_bible = json.load(f)

    # Salva cada livro como arquivo separado usando o nome
    for book in full_bible:
        book_name = normalize_string(book['name'])
        output_path = os.path.join(filepath_out, f'{book_name}.json')

        with open(output_path, 'w', encoding='utf-8-sig') as out_file:
            json.dump(book, out_file, ensure_ascii=False, indent=2)

    print(f'✅ {len(full_bible)} livros exportados para a pasta "{filepath_out}/" usando os nomes dos livros.')


def get_bible_book_content(book_name: str, version: str = "nvi") -> list[str]:
    book = normalize_string(book_name)
    filepath = f"src/common/bible/{version.lower()}/{book}.json"
    book_json = read_json_file(filepath)
    if not book_json:
        return []
    return book_json['chapters']


BIBLE_VERSIONS = ("nvi", "ara")
_BOOK_SLUG_RE  = re.compile(r"^[0-9a-z_]+$")


def bible_book_slug(book_name: str) -> str:
    """Stable key stored on highlights and comments: "1 Coríntios" → "1_corintios"."""
    return normalize_string(book_name.strip())


@lru_cache(maxsize=None)
def get_verse_counts(book_slug: str) -> tuple[int, ...]:
    """Verses per chapter (the largest among the versions); empty when the book doesn't exist."""
    if not _BOOK_SLUG_RE.match(book_slug):
        return ()
    counts: list[int] = []
    for version in BIBLE_VERSIONS:
        for index, chapter in enumerate(get_bible_book_content(book_slug, version)):
            if index < len(counts):
                counts[index] = max(counts[index], len(chapter))
            else:
                counts.append(len(chapter))
    return tuple(counts)


@lru_cache(maxsize=None)
def _cached_book_content(book_slug: str, version: str) -> tuple[tuple[str, ...], ...]:
    if not _BOOK_SLUG_RE.match(book_slug) or version not in BIBLE_VERSIONS:
        return ()
    return tuple(tuple(chapter) for chapter in get_bible_book_content(book_slug, version))


def get_verse_text(book_slug: str, chapter: int, verse: int, version: str = "nvi") -> str | None:
    """Text of one verse, read from the Bible files (never stored per user)."""
    chapters = _cached_book_content(book_slug, version)
    if not 1 <= chapter <= len(chapters) or not 1 <= verse <= len(chapters[chapter - 1]):
        return None
    return chapters[chapter - 1][verse - 1]


def is_valid_bible_reference(book_slug: str, chapter: int, verses: list[int]) -> bool:
    counts = get_verse_counts(book_slug)
    if not 1 <= chapter <= len(counts):
        return False
    return all(1 <= verse <= counts[chapter - 1] for verse in verses)


def fetch_bible_book_id(book_name: str) -> str:
    filepath = "src/common/bible/bible_books_database.json"
    bible_books = read_json_file(filepath)
    for book in bible_books:
        if normalize_string(book["book_name"]) == normalize_string(book_name):
            return book["id"]
    
    return ""

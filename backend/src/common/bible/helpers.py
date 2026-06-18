import os
import json
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


def fetch_bible_book_id(book_name: str) -> str:
    filepath = "src/common/bible/bible_books_database.json"
    bible_books = read_json_file(filepath)
    for book in bible_books:
        if normalize_string(book["book_name"]) == normalize_string(book_name):
            return book["id"]
    
    return ""

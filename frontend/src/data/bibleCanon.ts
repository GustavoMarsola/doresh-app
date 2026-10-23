// Livros da Bíblia na ordem canônica protestante, com o número de capítulos.
// Os nomes são os mesmos aceitos pela API (`/bible/book?name=`).

export type Testament = 'AT' | 'NT';

export interface BibleBook {
  name: string;
  chapters: number;
  testament: Testament;
}

const OLD_TESTAMENT: [string, number][] = [
  ['Gênesis', 50], ['Êxodo', 40], ['Levítico', 27], ['Números', 36], ['Deuteronômio', 34],
  ['Josué', 24], ['Juízes', 21], ['Rute', 4], ['1 Samuel', 31], ['2 Samuel', 24],
  ['1 Reis', 22], ['2 Reis', 25], ['1 Crônicas', 29], ['2 Crônicas', 36], ['Esdras', 10],
  ['Neemias', 13], ['Ester', 10], ['Jó', 42], ['Salmos', 150], ['Provérbios', 31],
  ['Eclesiastes', 12], ['Cantares', 8], ['Isaías', 66], ['Jeremias', 52], ['Lamentações', 5],
  ['Ezequiel', 48], ['Daniel', 12], ['Oséias', 14], ['Joel', 3], ['Amós', 9],
  ['Obadias', 1], ['Jonas', 4], ['Miqueias', 7], ['Naum', 3], ['Habacuque', 3],
  ['Sofonias', 3], ['Ageu', 2], ['Zacarias', 14], ['Malaquias', 4],
];

const NEW_TESTAMENT: [string, number][] = [
  ['Mateus', 28], ['Marcos', 16], ['Lucas', 24], ['João', 21], ['Atos', 28],
  ['Romanos', 16], ['1 Coríntios', 16], ['2 Coríntios', 13], ['Gálatas', 6], ['Efésios', 6],
  ['Filipenses', 4], ['Colossenses', 4], ['1 Tessalonicenses', 5], ['2 Tessalonicenses', 3],
  ['1 Timóteo', 6], ['2 Timóteo', 4], ['Tito', 3], ['Filemom', 1], ['Hebreus', 13],
  ['Tiago', 5], ['1 Pedro', 5], ['2 Pedro', 3], ['1 João', 5], ['2 João', 1],
  ['3 João', 1], ['Judas', 1], ['Apocalipse', 22],
];

export const BIBLE_BOOKS: BibleBook[] = [
  ...OLD_TESTAMENT.map(([name, chapters]) => ({ name, chapters, testament: 'AT' as const })),
  ...NEW_TESTAMENT.map(([name, chapters]) => ({ name, chapters, testament: 'NT' as const })),
];

export const BIBLE_VERSIONS = ['ARA', 'NVI'] as const;
export type BibleVersion = (typeof BIBLE_VERSIONS)[number];

export const findBook = (name: string) => BIBLE_BOOKS.find((b) => b.name === name);

export interface Passage {
  book: string;
  chapter: number;
}

/** Capítulo anterior, atravessando livros. `null` em Gênesis 1. */
export function previousPassage({ book, chapter }: Passage): Passage | null {
  if (chapter > 1) return { book, chapter: chapter - 1 };
  const index = BIBLE_BOOKS.findIndex((b) => b.name === book);
  if (index <= 0) return null;
  const prev = BIBLE_BOOKS[index - 1];
  return { book: prev.name, chapter: prev.chapters };
}

/** Próximo capítulo, atravessando livros. `null` em Apocalipse 22. */
export function nextPassage({ book, chapter }: Passage): Passage | null {
  const index = BIBLE_BOOKS.findIndex((b) => b.name === book);
  if (index < 0) return null;
  if (chapter < BIBLE_BOOKS[index].chapters) return { book, chapter: chapter + 1 };
  const next = BIBLE_BOOKS[index + 1];
  return next ? { book: next.name, chapter: 1 } : null;
}

/** Remove acentos e caixa, para a busca de livros ("genesis" encontra "Gênesis"). */
export const normalizeBookName = (value: string) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Chave do livro gravada pela API em grifos e comentários: "1 Coríntios" → "1_corintios". */
export const bookSlug = (name: string) => normalizeBookName(name).replace(/ /g, '_');

export const findBookBySlug = (slug: string) => BIBLE_BOOKS.find((b) => bookSlug(b.name) === slug);

/** "João 3:14–15" ou "João 3:3, 5, 7–9". */
export const formatReference = (book: string, chapter: number, verses: number[]) => {
  const sorted = [...verses].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (const v of sorted.slice(1).concat(Number.NaN)) {
    if (v === prev + 1) {
      prev = v;
      continue;
    }
    ranges.push(start === prev ? `${start}` : `${start}–${prev}`);
    start = v;
    prev = v;
  }
  return `${book} ${chapter}:${ranges.join(', ')}`;
};

/** Livros de `first` a `last`, na ordem canônica. */
export const booksBetween = (first: string, last: string) => {
  const names = BIBLE_BOOKS.map((b) => b.name);
  return names.slice(names.indexOf(first), names.indexOf(last) + 1);
};

/** Blocos usados para escolher livros de uma vez (ex.: no plano personalizado). */
export const BOOK_GROUPS: { label: string; books: string[] }[] = [
  { label: 'Antigo Testamento', books: booksBetween('Gênesis', 'Malaquias') },
  { label: 'Novo Testamento', books: booksBetween('Mateus', 'Apocalipse') },
  { label: 'Pentateuco', books: booksBetween('Gênesis', 'Deuteronômio') },
  { label: 'Livros históricos', books: booksBetween('Josué', 'Ester') },
  { label: 'Poéticos e sapienciais', books: booksBetween('Jó', 'Cantares') },
  { label: 'Profetas maiores', books: booksBetween('Isaías', 'Daniel') },
  { label: 'Profetas menores', books: booksBetween('Oséias', 'Malaquias') },
  { label: 'Evangelhos', books: booksBetween('Mateus', 'João') },
  { label: 'Atos', books: ['Atos'] },
  { label: 'Cartas de Paulo', books: booksBetween('Romanos', 'Filemom') },
  { label: 'Cartas gerais', books: booksBetween('Hebreus', 'Judas') },
  { label: 'Apocalipse', books: ['Apocalipse'] },
];

import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/components/auth/utils';
import { bookSlug, findBookBySlug } from '@/data/bibleCanon';

const API = import.meta.env.VITE_API_HOST;

// ── Tipos (espelham GET /user/profile) ──

export interface Highlight {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  color: string;
  text: string | null;
  updated_at: string;
}

export interface Comment {
  id: string;
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number;
  comment: string;
  created_at: string;
}

export interface Annotations {
  highlights: Highlight[];
  comments: Comment[];
}

export interface HighlightGroup {
  key: string;
  bookName: string;
  chapter: number;
  verses: number[];
  texts: (string | null)[];
  color: string;
  updatedAt: string;
}

/** Nome do livro a partir da chave gravada pela API ("1_corintios" → "1 Coríntios"). */
export const bookName = (slug: string) => findBookBySlug(slug)?.name ?? slug;

/** Junta versículos seguidos do mesmo capítulo e cor ("João 3:16–18"); os mais recentes primeiro. */
export const groupHighlights = (highlights: Highlight[]): HighlightGroup[] => {
  const sorted = [...highlights].sort(
    (a, b) => a.book.localeCompare(b.book) || a.chapter - b.chapter || a.verse - b.verse,
  );
  const groups: (HighlightGroup & { slug: string })[] = [];
  for (const h of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.slug === h.book && last.chapter === h.chapter && last.color === h.color && last.verses[last.verses.length - 1] === h.verse - 1) {
      last.verses.push(h.verse);
      last.texts.push(h.text);
      if (h.updated_at > last.updatedAt) last.updatedAt = h.updated_at;
    } else {
      groups.push({ key: h.id, slug: h.book, bookName: bookName(h.book), chapter: h.chapter, verses: [h.verse], texts: [h.text], color: h.color, updatedAt: h.updated_at });
    }
  }
  return groups.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

/** Um trecho de capítulo, como os dias de um plano de leitura. */
export interface VerseRange {
  book: string; // nome de exibição ("1 Coríntios")
  chapter: number;
  verse_start: number;
  verse_end: number;
}

/** Destaques e comentários que caem dentro dos trechos (um comentário conta se tocar o trecho). */
export const annotationsIn = (annotations: Annotations, ranges: VerseRange[]): Annotations => {
  const inRange = (slug: string, chapter: number, start: number, end: number) =>
    ranges.some((r) => bookSlug(r.book) === slug && r.chapter === chapter && start <= r.verse_end && end >= r.verse_start);
  return {
    highlights: annotations.highlights.filter((h) => inRange(h.book, h.chapter, h.verse, h.verse)),
    comments: annotations.comments.filter((c) => inRange(c.book, c.chapter, c.verse_start, c.verse_end)),
  };
};

export const commentVerses = (c: Comment) =>
  Array.from({ length: c.verse_end - c.verse_start + 1 }, (_, i) => c.verse_start + i);

/** Versão que a pessoa usou por último no leitor (o leitor guarda em doresh:last-passage). */
export const lastReaderVersion = () => {
  try {
    return JSON.parse(localStorage.getItem('doresh:last-passage') ?? 'null')?.version === 'ARA' ? 'ara' : 'nvi';
  } catch {
    return 'nvi';
  }
};

export const fetchAnnotations = async (): Promise<Annotations> => {
  const res = await authFetch(`${API}/user/profile?version=${lastReaderVersion()}`);
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  const data = await res.json();
  return { highlights: data.highlights, comments: data.comments };
};

export const useAnnotations = (enabled = true) =>
  useQuery({ queryKey: ['annotations'], queryFn: fetchAnnotations, enabled });

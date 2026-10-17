import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import jsPDF from 'jspdf';
import { authFetch } from '@/components/auth/utils';

const API = import.meta.env.VITE_API_HOST;

// ── Tipos (espelham backend/src/schemas/studies_schemas.py e study_to_dict) ──

export interface StudyReference {
  book: string;
  chapter: number;
  verse_start: number | null;
  verse_end: number | null;
}

export interface StudySection {
  id?: string;
  title: string | null;
  text: string;
  order_index?: number;
}

export interface Study {
  id: string;
  title: string;
  introduction: string;
  conclusion: string;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
  sections: StudySection[];
  references: StudyReference[];
}

export interface StudiesPage {
  page: number;
  per_page: number;
  total: number;
  pages: number;
  studies: Study[];
}

export interface StudyInput {
  title: string;
  introduction: string;
  conclusion: string;
  sections: { title: string | null; text: string }[];
  references: StudyReference[];
}

export class StudyNotFoundError extends Error {}

// ── Formatação ──

/** "Mateus 13", "Mateus 13:3" ou "Mateus 13:1–9". */
export const formatReference = (ref: StudyReference) => {
  if (!ref.verse_start) return `${ref.book} ${ref.chapter}`;
  if (!ref.verse_end || ref.verse_end === ref.verse_start) return `${ref.book} ${ref.chapter}:${ref.verse_start}`;
  return `${ref.book} ${ref.chapter}:${ref.verse_start}–${ref.verse_end}`;
};

export const formatReferences = (refs: StudyReference[]) => refs.map(formatReference).join('; ');

// ── API ──

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const res = await authFetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  if (res.status === 404) throw new StudyNotFoundError('Estudo não encontrado.');
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  return res.json();
};

const PER_PAGE = 12;

export const studiesApi = {
  list: (page: number, q: string) => {
    const params = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE), sort_by: 'updated_at', order: 'desc' });
    if (q.trim()) params.set('q', q.trim());
    return request<StudiesPage>(`/studies?${params}`);
  },
  get: (id: string) => request<{ study: Study }>(`/study/${id}`).then((r) => r.study),
  create: (input: StudyInput) =>
    request<{ study: Study }>('/study', { method: 'POST', body: JSON.stringify(input) }).then((r) => r.study),
  update: (id: string, input: StudyInput) =>
    request<{ study: Study }>('/study', { method: 'PATCH', body: JSON.stringify({ study_id: id, ...input }) }).then((r) => r.study),
  remove: (id: string) => request<{ message: string }>(`/study/${id}`, { method: 'DELETE' }),
};

// ── Queries ──

export const studyKeys = {
  all: ['studies'] as const,
  list: (q: string) => ['studies', 'list', q] as const,
  detail: (id: string) => ['studies', 'detail', id] as const,
};

export const useStudies = (q: string) =>
  useInfiniteQuery({
    queryKey: studyKeys.list(q),
    queryFn: ({ pageParam }) => studiesApi.list(pageParam, q),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });

export const useStudy = (id: string | undefined) =>
  useQuery({
    queryKey: studyKeys.detail(id ?? ''),
    queryFn: () => studiesApi.get(id!),
    enabled: !!id,
    retry: (count, error) => !(error instanceof StudyNotFoundError) && count < 2,
  });

export const useDeleteStudy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studiesApi.remove(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: studyKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: studyKeys.all });
    },
  });
};

// ── Texto bíblico de uma referência ──

export const fetchPassageText = async (ref: StudyReference, version = 'ARA') => {
  const res = await authFetch(`${API}/bible/book?name=${encodeURIComponent(ref.book)}&version=${version}`);
  if (!res.ok) throw new Error('Não foi possível carregar o texto bíblico.');
  const data = await res.json();
  const verses: string[] = data.chapters?.[ref.chapter - 1] ?? [];
  const start = ref.verse_start ?? 1;
  const end = ref.verse_end ?? (ref.verse_start ? ref.verse_start : verses.length);
  return verses.slice(start - 1, end).map((text, i) => ({ verse: start + i, text }));
};

// ── PDF ──

export const exportStudyToPDF = async (study: Study) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 20;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
  };

  const paragraph = (text: string, x = 10, color = 40) => {
    if (!text.trim()) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(color);
    for (const line of doc.splitTextToSize(text, 190 - x) as string[]) {
      ensureSpace(6);
      doc.text(line, x, y);
      y += 6;
    }
    y += 6;
    doc.setTextColor(0);
  };

  const heading = (text: string, size = 14) => {
    ensureSpace(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(0);
    doc.text(text, 10, y);
    y += 8;
  };

  try {
    const svgText = await (await fetch('/logo.svg')).text();
    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgText)));
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 120;
    canvas.getContext('2d')?.drawImage(img, 0, 0, 120, 120);
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, 18, 18);
  } catch {
    /* PDF segue sem o logo */
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(study.title, 160) as string[];
  doc.text(titleLines, 34, 20);
  y = 20 + titleLines.length * 8;

  if (study.references.length) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(90);
    doc.text(doc.splitTextToSize(formatReferences(study.references), 160), 34, y);
    y += 8;
  }
  y = Math.max(y, 34);
  doc.setDrawColor(200);
  doc.line(10, y, 200, y);
  y += 10;

  if (study.introduction.trim()) {
    heading('Introdução');
    paragraph(study.introduction);
  }
  study.sections.forEach((section, i) => {
    heading(`${i + 1}. ${section.title?.trim() || `Ponto ${i + 1}`}`, 13);
    paragraph(section.text, 14);
  });
  if (study.conclusion.trim()) {
    heading('Conclusão');
    paragraph(study.conclusion);
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Doresh · Página ${i} de ${pageCount}`, doc.internal.pageSize.getWidth() / 2, pageHeight - 10, { align: 'center' });
  }

  doc.save(`${study.title}.pdf`);
};

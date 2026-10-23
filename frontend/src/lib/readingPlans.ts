import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/components/auth/utils';
import { bookSlug, findBookBySlug } from '@/data/bibleCanon';

const API = import.meta.env.VITE_API_HOST;

// ── Tipos (espelham backend/src/schemas/reading_plans_schemas.py) ──

/** Dias da semana ISO: 1 = segunda … 7 = domingo. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface CatalogPlan {
  slug: string;
  title: string;
  description: string;
  needs_book: boolean;
  needs_books: boolean;
  default_days: number | null;
  default_weekdays: Weekday[];
}

export interface PlanPassage {
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number;
  whole_chapter: boolean;
}

export type DayStatus = 'read' | 'partial' | 'unread';

export interface PlanDay {
  index: number;
  date: string; // AAAA-MM-DD
  status: DayStatus;
  passages: PlanPassage[];
}

export interface PlanSummary {
  id: string;
  plan_slug: string;
  title: string;
  book: string | null;
  books: string[] | null;
  start_date: string;
  end_date: string;
  total_days: number;
  weekdays: Weekday[];
  reading_days: number;
  days_read: number;
  next_day: PlanDay | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanDetail extends PlanSummary {
  days: PlanDay[];
}

/** POST /reading-plans/preview: os dias que o plano teria, sem salvar nada. */
export interface PlanPreview {
  title: string;
  books: string[] | null;
  start_date: string;
  end_date: string;
  total_days: number;
  weekdays: Weekday[];
  reading_days: number;
  days: PlanDay[];
}

export interface PlanInput extends Partial<Rhythm> {
  plan_slug: string;
  book?: string;
  books?: string[];
  title?: string;
}

export interface Rhythm {
  start_date: string;
  total_days: number;
  weekdays: Weekday[];
}

/** Erro da API com o código estável do backend (ex.: "reading_plan.too_many_days"). */
export class PlanApiError extends Error {
  constructor(public status: number, public code: string | null) {
    super(code ?? `Erro ${status}`);
  }
}

export const planErrorMessage = (error: unknown) => {
  const code = error instanceof PlanApiError ? error.code : null;
  switch (code) {
    case 'reading_plan.too_many_days':
      return 'Esse prazo é longo demais para este plano. Escolha uma duração menor.';
    case 'reading_plan.invalid_duration':
      return 'Escolha uma duração entre 1 semana e 4 anos.';
    case 'reading_plan.invalid_weekdays':
      return 'Escolha pelo menos um dia da semana para ler.';
    case 'reading_plan.invalid_book':
      return 'Escolha um livro da Bíblia.';
    case 'reading_plan.invalid_books':
      return 'Escolha pelo menos um livro da Bíblia.';
    case 'reading_plan.not_found':
      return 'Plano não encontrado. Ele pode ter sido removido.';
    default:
      return 'Verifique sua conexão e tente novamente.';
  }
};

// ── Datas (sempre no fuso de quem usa o app) ──

export const todayISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const parseISODate = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const dayFormat = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
const monthFormat = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const longFormat = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

export const formatDay = (value: string) => dayFormat.format(parseISODate(value)).replace(/\./g, '');
export const formatMonth = (value: string) => monthFormat.format(parseISODate(value));
export const formatLongDate = (value: string) => longFormat.format(parseISODate(value));

export const WEEKDAYS: { value: Weekday; short: string; long: string }[] = [
  { value: 1, short: 'S', long: 'Segunda' },
  { value: 2, short: 'T', long: 'Terça' },
  { value: 3, short: 'Q', long: 'Quarta' },
  { value: 4, short: 'Q', long: 'Quinta' },
  { value: 5, short: 'S', long: 'Sexta' },
  { value: 6, short: 'S', long: 'Sábado' },
  { value: 7, short: 'D', long: 'Domingo' },
];

/** Ritmo inicial ao começar um plano: hoje, com a duração e os dias padrão do plano. */
export const defaultRhythm = (defaultDays: number | null, weekdays: Weekday[]): Rhythm => ({
  start_date: todayISO(),
  total_days: defaultDays ?? 7,
  weekdays,
});

/** Dias de leitura entre `start` e `start + totalDays` (igual ao cálculo do backend). */
export const countReadingDays = (start: string, totalDays: number, weekdays: Weekday[]) => {
  const first = parseISODate(start);
  const allowed = new Set(weekdays);
  let count = 0;
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(first.getFullYear(), first.getMonth(), first.getDate() + i);
    if (allowed.has(((d.getDay() + 6) % 7) + 1 as Weekday)) count++;
  }
  return count;
};

/** Dias de calendário a partir de `start` necessários para caberem `readingDays` dias de leitura. */
export const spanFor = (start: string, readingDays: number, weekdays: Weekday[]) => {
  const first = parseISODate(start);
  const allowed = new Set(weekdays);
  let span = 0;
  let found = 0;
  while (found < readingDays && allowed.size) {
    const d = new Date(first.getFullYear(), first.getMonth(), first.getDate() + span);
    if (allowed.has((((d.getDay() + 6) % 7) + 1) as Weekday)) found++;
    span++;
  }
  return span;
};

/** Dias de calendário de `start` até `end`, incluindo os dois. */
export const daysBetween = (start: string, end: string) =>
  Math.round((parseISODate(end).getTime() - parseISODate(start).getTime()) / 86_400_000) + 1;

/** Índice do dia que o calendário marca para hoje (o último dia com data ≤ hoje), ou 0 antes do início. */
export const scheduledIndex = (days: PlanDay[], today = todayISO()) => {
  let index = 0;
  for (const day of days) {
    if (day.date > today) break;
    index = day.index;
  }
  return index;
};

// ── Passagens ──

/** "Gênesis 1–3", "Provérbios 1:1–6" ou "Salmos 119:1–88". */
export const formatPassages = (passages: PlanPassage[]) => {
  const labels: string[] = [];
  let run: PlanPassage[] = [];
  const flush = () => {
    if (!run.length) return;
    const [first, last] = [run[0], run[run.length - 1]];
    labels.push(first.chapter === last.chapter ? `${first.book} ${first.chapter}` : `${first.book} ${first.chapter}–${last.chapter}`);
    run = [];
  };
  for (const p of passages) {
    if (!p.whole_chapter) {
      flush();
      labels.push(`${p.book} ${p.chapter}:${p.verse_start === p.verse_end ? p.verse_start : `${p.verse_start}–${p.verse_end}`}`);
      continue;
    }
    const last = run[run.length - 1];
    if (last && (last.book !== p.book || last.chapter !== p.chapter - 1)) flush();
    run.push(p);
  }
  flush();
  return labels;
};

export const passageLabel = (p: PlanPassage) =>
  p.whole_chapter
    ? `${p.book} ${p.chapter}`
    : `${p.book} ${p.chapter}:${p.verse_start === p.verse_end ? p.verse_start : `${p.verse_start}–${p.verse_end}`}`;

export const readerLink = (p: PlanPassage) => `/ler?livro=${encodeURIComponent(p.book)}&cap=${p.chapter}`;

// ── API ──

/** O backend usa a grafia da tabela de livros ("Oseias"); o app usa a do cânone do frontend ("Oséias"). */
const displayBook = (name: string) => findBookBySlug(bookSlug(name))?.name ?? name;
const normalizeDay = (day: PlanDay): PlanDay => ({
  ...day,
  passages: day.passages.map((p) => ({ ...p, book: displayBook(p.book) })),
});
const normalizeSummary = <T extends PlanSummary>(plan: T): T => ({
  ...plan,
  books: plan.books?.map(displayBook) ?? null,
  next_day: plan.next_day && normalizeDay(plan.next_day),
});
const normalizePlan = (plan: PlanDetail): PlanDetail => ({ ...normalizeSummary(plan), days: plan.days.map(normalizeDay) });

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const res = await authFetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new PlanApiError(res.status, typeof body?.detail === 'string' ? body.detail : null);
  }
  return res.status === 204 ? (undefined as T) : res.json();
};

export const plansApi = {
  catalog: () => request<{ plans: CatalogPlan[] }>('/reading-plans/catalog').then((r) => r.plans),
  list: () => request<{ plans: PlanSummary[] }>('/reading-plans').then((r) => r.plans.map(normalizeSummary)),
  get: (id: string) => request<{ plan: PlanDetail }>(`/reading-plans/${id}`).then((r) => normalizePlan(r.plan)),
  preview: (input: PlanInput) =>
    request<PlanPreview>('/reading-plans/preview', { method: 'POST', body: JSON.stringify(input) }).then((r) => ({
      ...r,
      books: r.books?.map(displayBook) ?? null,
      days: r.days.map(normalizeDay),
    })),
  start: (input: PlanInput) =>
    request<{ plan: PlanDetail }>('/reading-plans', { method: 'POST', body: JSON.stringify(input) }).then((r) => normalizePlan(r.plan)),
  updateRhythm: (id: string, rhythm: Partial<Rhythm>) =>
    request<{ plan: PlanDetail }>(`/reading-plans/${id}`, { method: 'PATCH', body: JSON.stringify(rhythm) }).then((r) => normalizePlan(r.plan)),
  setRead: (id: string, day: number, read: boolean) =>
    request<{ plan: PlanDetail }>(`/reading-plans/${id}/days/${day}/read`, { method: read ? 'PUT' : 'DELETE' }).then((r) => normalizePlan(r.plan)),
  realign: (id: string) =>
    request<{ plan: PlanDetail }>(`/reading-plans/${id}/realign`, { method: 'POST', body: JSON.stringify({ today: todayISO() }) }).then((r) => normalizePlan(r.plan)),
  remove: (id: string) => request<void>(`/reading-plans/${id}`, { method: 'DELETE' }),
};

// ── Queries ──

export const planKeys = {
  all: ['reading-plans'] as const,
  catalog: ['reading-plans', 'catalog'] as const,
  list: ['reading-plans', 'list'] as const,
  detail: (id: string) => ['reading-plans', 'detail', id] as const,
};

export const usePlanCatalog = () =>
  useQuery({ queryKey: planKeys.catalog, queryFn: plansApi.catalog, staleTime: Infinity });

/** Pré-visualização do plano; `input` nulo enquanto a escolha está incompleta. */
export const usePlanPreview = (input: PlanInput | null) =>
  useQuery({
    queryKey: ['reading-plans', 'preview', input],
    queryFn: () => plansApi.preview(input!),
    enabled: !!input,
    placeholderData: keepPreviousData,
    retry: false,
  });

export const useMyPlans = () => useQuery({ queryKey: planKeys.list, queryFn: plansApi.list });

export const usePlan = (id: string | undefined) =>
  useQuery({
    queryKey: planKeys.detail(id ?? ''),
    queryFn: () => plansApi.get(id!),
    enabled: !!id,
    retry: (count, error) => !(error instanceof PlanApiError && error.status === 404) && count < 2,
  });

/** Guarda o plano que a API devolveu e marca a lista como desatualizada. */
const usePlanUpdate = <V>(mutationFn: (vars: V) => Promise<PlanDetail>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (plan) => {
      queryClient.setQueryData(planKeys.detail(plan.id), plan);
      queryClient.invalidateQueries({ queryKey: planKeys.list });
    },
  });
};

export const useStartPlan = () => usePlanUpdate(plansApi.start);
export const useUpdateRhythm = (id: string) => usePlanUpdate((rhythm: Partial<Rhythm>) => plansApi.updateRhythm(id, rhythm));
export const useSetDayRead = (id: string) =>
  usePlanUpdate(({ day, read }: { day: number; read: boolean }) => plansApi.setRead(id, day, read));
export const useRealign = (id: string) => usePlanUpdate(() => plansApi.realign(id));

export const useRemovePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: plansApi.remove,
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: planKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: planKeys.list });
    },
  });
};

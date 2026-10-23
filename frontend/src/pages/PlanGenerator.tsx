import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { WeekdayPicker } from '@/components/plans/WeekdayPicker';
import { BIBLE_BOOKS, BOOK_GROUPS } from '@/data/bibleCanon';
import {
  daysBetween,
  formatDay,
  formatLongDate,
  formatPassages,
  parseISODate,
  planErrorMessage,
  spanFor,
  todayISO,
  usePlanPreview,
  useStartPlan,
  type PlanInput,
  type Weekday,
} from '@/lib/readingPlans';
import { cn } from '@/lib/utils';

type Mode = 'until' | 'per-day';

const MIN_TOTAL_DAYS = 7;
const MAX_TOTAL_DAYS = 4 * 366;
const PREVIEW_DAYS = 7;

const isoPlusDays = (iso: string, days: number) => {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const useDebounced = <T,>(value: T, delay: number) => {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
};

/** Nome sugerido: o bloco quando a escolha é exatamente um bloco ("Evangelhos"), senão os livros. */
const suggestedTitle = (books: string[]) => {
  const chosen = new Set(books);
  const group = BOOK_GROUPS.find((g) => g.books.length === chosen.size && g.books.every((b) => chosen.has(b)));
  if (group) return group.books.length === 1 ? `Leitura de ${group.label}` : group.label;
  if (books.length === 1) return `Leitura de ${books[0]}`;
  if (books.length <= 3) return `${books.slice(0, -1).join(', ')} e ${books[books.length - 1]}`;
  return `${books[0]}, ${books[1]} e mais ${books.length - 2} livros`;
};

export const PlanGenerator: React.FC = () => {
  const navigate = useNavigate();
  const startPlan = useStartPlan();

  const [books, setBooks] = React.useState<string[]>([]);
  const [showAllBooks, setShowAllBooks] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [startDate, setStartDate] = React.useState(todayISO());
  const [mode, setMode] = React.useState<Mode>('until');
  const [endDate, setEndDate] = React.useState(isoPlusDays(todayISO(), 29));
  const [perDay, setPerDay] = React.useState(3);
  const [weekdays, setWeekdays] = React.useState<Weekday[]>([1, 2, 3, 4, 5, 6, 7]);
  const [showAllDays, setShowAllDays] = React.useState(false);

  const ordered = React.useMemo(() => BIBLE_BOOKS.map((b) => b.name).filter((n) => books.includes(n)), [books]);
  const chapters = ordered.reduce((sum, name) => sum + (BIBLE_BOOKS.find((b) => b.name === name)?.chapters ?? 0), 0);

  const totalDays =
    mode === 'until'
      ? endDate && startDate ? daysBetween(startDate, endDate) : 0
      : startDate && perDay > 0 && weekdays.length ? spanFor(startDate, Math.ceil(chapters / perDay), weekdays) : 0;

  const localError = !ordered.length
    ? 'Escolha pelo menos um livro.'
    : !startDate
      ? 'Escolha a data de início.'
      : !weekdays.length
        ? 'Escolha pelo menos um dia da semana para ler.'
        : mode === 'until' && totalDays < MIN_TOTAL_DAYS
          ? 'Escolha uma data de término pelo menos uma semana depois do início.'
          : mode === 'per-day' && !(perDay >= 1 && perDay <= 50)
            ? 'Escolha de 1 a 50 capítulos por dia.'
            : totalDays > MAX_TOTAL_DAYS
              ? 'O plano pode durar no máximo 4 anos. Escolha um ritmo mais rápido.'
              : null;

  const input: PlanInput | null = localError
    ? null
    : {
        plan_slug: 'personalizado',
        books: ordered,
        title: title.trim() || suggestedTitle(ordered),
        start_date: startDate,
        total_days: Math.max(MIN_TOTAL_DAYS, totalDays),
        weekdays,
      };
  const debouncedInput = useDebounced(input, 400);
  const preview = usePlanPreview(debouncedInput);
  const previewStale = JSON.stringify(input) !== JSON.stringify(debouncedInput) || preview.isFetching;

  const toggleBook = (name: string) =>
    setBooks((current) => (current.includes(name) ? current.filter((b) => b !== name) : [...current, name]));

  const toggleGroup = (groupBooks: string[], active: boolean) =>
    setBooks((current) =>
      active ? current.filter((b) => !groupBooks.includes(b)) : Array.from(new Set([...current, ...groupBooks])),
    );

  const submit = () => {
    if (!input) return;
    startPlan.mutate(input, { onSuccess: (plan) => navigate(`/planos/${plan.id}`) });
  };

  const sizes = preview.data?.days.map((d) => d.passages.reduce((s, p) => s + p.verse_end - p.verse_start + 1, 0)) ?? [];
  const averageVerses = sizes.length ? Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length) : 0;
  const shownDays = showAllDays ? preview.data?.days : preview.data?.days.slice(0, PREVIEW_DAYS);
  const error = localError ?? (preview.isError ? planErrorMessage(preview.error) : startPlan.isError ? planErrorMessage(startPlan.error) : null);

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-10">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="h-10 w-10 shrink-0">
          <Link to="/planos" aria-label="Voltar para os planos">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Plano personalizado</h1>
          <p className="text-muted-foreground">Escolha o que ler e o seu ritmo. O Doresh divide a leitura em dias parecidos.</p>
        </div>
      </div>

      {/* 1. Livros */}
      <section aria-labelledby="books-heading" className="space-y-4 rounded-2xl border border-border bg-card p-5 md:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="books-heading" className="text-lg font-semibold text-foreground">
            1. O que você quer ler
          </h2>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {ordered.length ? `${ordered.length} ${ordered.length === 1 ? 'livro' : 'livros'} · ${chapters} capítulos` : 'Nenhum livro escolhido'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {BOOK_GROUPS.map((group) => {
            const active = group.books.every((b) => books.includes(b));
            return (
              <button
                key={group.label}
                type="button"
                aria-pressed={active}
                onClick={() => toggleGroup(group.books, active)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:border-primary',
                )}
              >
                {group.label}
              </button>
            );
          })}
        </div>

        {ordered.length > 0 && (
          <p className="text-sm text-foreground">
            <span className="text-muted-foreground">Escolhidos:</span> {ordered.join(', ')}{' '}
            <button type="button" onClick={() => setBooks([])} className="ml-1 font-medium text-primary hover:underline">
              Limpar
            </button>
          </p>
        )}

        <div>
          <button
            type="button"
            aria-expanded={showAllBooks}
            onClick={() => setShowAllBooks((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', showAllBooks && 'rotate-180')} />
            Escolher livro a livro
          </button>
          {showAllBooks && (
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {(['AT', 'NT'] as const).map((testament) => (
                <fieldset key={testament} className="space-y-2">
                  <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {testament === 'AT' ? 'Antigo Testamento' : 'Novo Testamento'}
                  </legend>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                    {BIBLE_BOOKS.filter((b) => b.testament === testament).map((b) => (
                      <label key={b.name} className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox checked={books.includes(b.name)} onCheckedChange={() => toggleBook(b.name)} />
                        {b.name}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 2. Ritmo */}
      <section aria-labelledby="rhythm-heading" className="space-y-5 rounded-2xl border border-border bg-card p-5 md:p-6">
        <h2 id="rhythm-heading" className="text-lg font-semibold text-foreground">
          2. O seu ritmo
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="gen-start">Começar em</Label>
            <Input id="gen-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gen-title">Nome do plano</Label>
            <Input
              id="gen-title"
              value={title}
              maxLength={80}
              placeholder={ordered.length ? suggestedTitle(ordered) : 'Ex.: Romanos até a Páscoa'}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10"
            />
          </div>
        </div>

        <RadioGroup value={mode} onValueChange={(v) => setMode(v as Mode)} className="grid gap-3 sm:grid-cols-2">
          <label
            className={cn(
              'flex cursor-pointer flex-col gap-3 rounded-xl border p-4',
              mode === 'until' ? 'border-primary bg-primary/5' : 'border-border',
            )}
          >
            <span className="flex items-center gap-2 font-medium">
              <RadioGroupItem value="until" id="mode-until" /> Terminar até
            </span>
            <Input
              type="date"
              aria-label="Data de término"
              value={endDate}
              min={startDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setMode('until');
              }}
              className="h-10"
            />
          </label>
          <label
            className={cn(
              'flex cursor-pointer flex-col gap-3 rounded-xl border p-4',
              mode === 'per-day' ? 'border-primary bg-primary/5' : 'border-border',
            )}
          >
            <span className="flex items-center gap-2 font-medium">
              <RadioGroupItem value="per-day" id="mode-per-day" /> Capítulos por dia
            </span>
            <Input
              type="number"
              inputMode="numeric"
              aria-label="Capítulos por dia"
              min={1}
              max={50}
              value={perDay}
              onChange={(e) => {
                setPerDay(Number(e.target.value));
                setMode('per-day');
              }}
              className="h-10"
            />
          </label>
        </RadioGroup>

        <WeekdayPicker value={weekdays} onChange={setWeekdays} />
      </section>

      {/* 3. Pré-visualização */}
      <section aria-labelledby="preview-heading" className="space-y-4">
        <h2 id="preview-heading" className="text-lg font-semibold text-foreground">
          3. Como fica
        </h2>

        {error ? (
          <p role="alert" className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </p>
        ) : !preview.data ? (
          <div className="space-y-2" aria-busy="true">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : (
          <div className={cn('space-y-4 transition-opacity', previewStale && 'opacity-60')} aria-busy={previewStale}>
            <p className="rounded-xl bg-muted/60 px-4 py-3 text-sm text-foreground" aria-live="polite">
              <strong>{preview.data.title}</strong>: <strong>{preview.data.reading_days}</strong> dias de leitura, cerca de{' '}
              {averageVerses} versículos por dia, de {formatLongDate(preview.data.start_date)} a {formatLongDate(preview.data.end_date)}.
            </p>
            <ol className="divide-y divide-border rounded-2xl border border-border bg-card">
              {shownDays?.map((day) => (
                <li key={day.index} className="flex items-baseline gap-3 px-4 py-3">
                  <span className="w-28 shrink-0 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">Dia {day.index}</span> · {formatDay(day.date)}
                  </span>
                  <span className="min-w-0 font-crimson text-[17px] leading-snug text-foreground">{formatPassages(day.passages).join(' · ')}</span>
                </li>
              ))}
            </ol>
            {preview.data.days.length > PREVIEW_DAYS && (
              <button type="button" onClick={() => setShowAllDays((v) => !v)} className="text-sm font-medium text-primary hover:underline">
                {showAllDays ? 'Mostrar menos' : `Ver os ${preview.data.days.length} dias`}
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button asChild variant="outline">
            <Link to="/planos">Cancelar</Link>
          </Button>
          <Button onClick={submit} disabled={!input || !preview.data || preview.isError || startPlan.isPending}>
            {startPlan.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Começar plano
          </Button>
        </div>
      </section>
    </div>
  );
};

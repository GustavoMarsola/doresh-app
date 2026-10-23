import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Check, ChevronLeft, ChevronRight, FilePlus2, Highlighter, Loader2, MessageSquare, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { AnnotationImport, StudyPrefill } from '@/components/studies/AnnotationsDialog';
import { formatReference } from '@/data/bibleCanon';
import { useToast } from '@/hooks/use-toast';
import { annotationsIn, bookName, commentVerses, groupHighlights, useAnnotations } from '@/lib/annotations';
import {
  PlanApiError,
  formatDay,
  formatPassages,
  passageLabel,
  readerLink,
  todayISO,
  usePlan,
  useSetDayRead,
  type PlanDay,
  type PlanDetail,
} from '@/lib/readingPlans';
import { cn } from '@/lib/utils';

const highlightBorder: Record<string, string> = {
  yellow: 'border-yellow-400',
  blue: 'border-blue-400',
  red: 'border-red-500',
};

export const ReadingPlanDay: React.FC = () => {
  const { id = '', day: dayParam = '' } = useParams();
  const planQuery = usePlan(id);
  const index = Number(dayParam);
  const day = planQuery.data?.days[index - 1];

  if ((planQuery.error instanceof PlanApiError && planQuery.error.status === 404) || (planQuery.data && !day)) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-lg font-semibold">Dia não encontrado.</p>
        <p className="mt-1 text-muted-foreground">O plano pode ter sido removido ou ter menos dias.</p>
        <Button asChild className="mt-6" variant="outline">
          <Link to={planQuery.data ? `/planos/${id}` : '/planos'}>Voltar</Link>
        </Button>
      </div>
    );
  }

  if (planQuery.isError) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-lg font-semibold">Não foi possível carregar o plano.</p>
        <Button className="mt-6" variant="outline" onClick={() => planQuery.refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!planQuery.data || !day) {
    return (
      <div className="mx-auto max-w-3xl space-y-6" aria-busy="true">
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return <DayView plan={planQuery.data} day={day} />;
};

const DayView: React.FC<{ plan: PlanDetail; day: PlanDay }> = ({ plan, day }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const setRead = useSetDayRead(plan.id);
  const annotationsQuery = useAnnotations();
  const mine = React.useMemo(
    () => (annotationsQuery.data ? annotationsIn(annotationsQuery.data, day.passages) : null),
    [annotationsQuery.data, day.passages],
  );
  const highlightGroups = React.useMemo(() => groupHighlights(mine?.highlights ?? []), [mine]);
  const isRead = day.status === 'read';
  const previous = day.index > 1 ? day.index - 1 : null;
  const following = day.index < plan.days.length ? day.index + 1 : null;

  const toggle = () =>
    setRead.mutate(
      { day: day.index, read: !isRead },
      {
        onSuccess: (updated) => {
          if (isRead) return;
          const next = updated.next_day;
          toast({
            title: `Dia ${day.index} lido`,
            description: next ? `Próxima leitura: dia ${next.index}.` : 'Você concluiu o plano. Glória a Deus!',
          });
        },
        onError: () =>
          toast({ title: 'Não foi possível salvar a leitura', description: 'Verifique sua conexão e tente novamente.', variant: 'destructive' }),
      },
    );

  /** Estudo novo com os trechos do dia no texto base e cada comentário como um ponto. */
  const toStudy = () => {
    const items: AnnotationImport[] = day.passages.map((p) => ({
      reference: {
        book: p.book,
        chapter: p.chapter,
        verse_start: p.whole_chapter ? null : p.verse_start,
        verse_end: p.whole_chapter ? null : p.verse_end,
      },
    }));
    for (const c of mine?.comments ?? []) {
      const label = formatReference(bookName(c.book), c.chapter, commentVerses(c));
      items.push({
        reference: { book: bookName(c.book), chapter: c.chapter, verse_start: c.verse_start, verse_end: c.verse_end },
        section: { title: label, text: c.comment },
      });
    }
    const prefill: StudyPrefill = { title: formatPassages(day.passages).join('; '), items };
    navigate('/estudos/novo', { state: { prefill } });
  };

  // Conta o que aparece na lista: versículos destacados seguidos formam um só item
  const count = highlightGroups.length + (mine?.comments.length ?? 0);

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-10">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="h-10 w-10 shrink-0">
          <Link to={`/planos/${plan.id}`} aria-label={`Voltar para ${plan.title}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-muted-foreground">{plan.title}</p>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Dia {day.index}</h1>
        </div>
        <div className="flex shrink-0 items-center">
          <Button variant="ghost" size="icon" className="h-10 w-10" disabled={!previous} asChild={!!previous}>
            {previous ? (
              <Link to={`/planos/${plan.id}/dia/${previous}`} aria-label={`Dia ${previous}`}>
                <ChevronLeft className="h-5 w-5" />
              </Link>
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10" disabled={!following} asChild={!!following}>
            {following ? (
              <Link to={`/planos/${plan.id}/dia/${following}`} aria-label={`Dia ${following}`}>
                <ChevronRight className="h-5 w-5" />
              </Link>
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Leitura do dia */}
      <section
        aria-labelledby="reading-heading"
        className={cn('rounded-2xl border p-5 md:p-6', isRead ? 'border-border bg-card' : 'border-primary/30 bg-primary/5')}
      >
        <p id="reading-heading" className="text-sm text-muted-foreground">
          {formatDay(day.date)}
          {day.date === todayISO() && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">hoje</span>}
          {isRead && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">lido</span>}
          {day.status === 'partial' && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">lido em parte</span>}
        </p>
        <ul className="mt-4 space-y-2">
          {day.passages.map((p, i) => (
            <li key={i}>
              <Link
                to={readerLink(p)}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 transition-colors hover:border-primary"
              >
                <span className="font-crimson text-lg text-foreground">{passageLabel(p)}</span>
                <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
                  <BookOpen className="h-4 w-4" /> Ler
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Button className="mt-5" variant={isRead ? 'outline' : 'default'} onClick={toggle} disabled={setRead.isPending}>
          {setRead.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isRead ? <Undo2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          {isRead ? 'Desmarcar leitura' : 'Marcar como lido'}
        </Button>
      </section>

      {/* Minhas anotações deste trecho */}
      <section aria-labelledby="notes-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="notes-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Minhas anotações {count > 0 && `(${count})`}
          </h2>
          <Button variant="outline" size="sm" onClick={toStudy} disabled={annotationsQuery.isLoading}>
            <FilePlus2 className="h-4 w-4" />
            Levar para um estudo
          </Button>
        </div>

        {annotationsQuery.isLoading ? (
          <div className="space-y-2" aria-busy="true">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : annotationsQuery.isError ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm">
            <p className="font-medium text-foreground">Não foi possível carregar suas anotações.</p>
            <Button className="mt-3" variant="outline" size="sm" onClick={() => annotationsQuery.refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : count === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            <p>Você ainda não destacou nem comentou estes trechos.</p>
            <p className="mt-1">
              Abra a leitura, toque num versículo para destacar ou comentar, e volte aqui: suas anotações aparecem neste dia.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to={readerLink(day.passages[0])}>
                <BookOpen className="h-4 w-4" /> Abrir a leitura
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {highlightGroups.map((h) => (
              <li key={h.key} className={cn('rounded-xl border-l-4 bg-card p-3 shadow-sm', highlightBorder[h.color] ?? 'border-primary')}>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Highlighter className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatReference(h.bookName, h.chapter, h.verses)}
                </p>
                {h.texts.some(Boolean) && (
                  <p className="mt-1 font-crimson text-[17px] leading-relaxed text-foreground/90">{h.texts.filter(Boolean).join(' ')}</p>
                )}
              </li>
            ))}
            {mine?.comments.map((c) => (
              <li key={c.id} className="rounded-xl border border-border bg-card p-3">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatReference(bookName(c.book), c.chapter, commentVerses(c))}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-foreground/90">{c.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

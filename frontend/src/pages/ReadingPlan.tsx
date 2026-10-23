import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Check, ChevronDown, Loader2, MoreHorizontal, Settings2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PlanRhythmDialog } from '@/components/plans/PlanRhythmDialog';
import { useToast } from '@/hooks/use-toast';
import {
  PlanApiError,
  formatDay,
  formatLongDate,
  formatMonth,
  formatPassages,
  passageLabel,
  planErrorMessage,
  readerLink,
  scheduledIndex,
  todayISO,
  usePlan,
  usePlanCatalog,
  useRealign,
  useRemovePlan,
  useSetDayRead,
  useUpdateRhythm,
  type PlanDay,
  type PlanDetail,
} from '@/lib/readingPlans';
import { cn } from '@/lib/utils';

export const ReadingPlan: React.FC = () => {
  const { id = '' } = useParams();
  const planQuery = usePlan(id);

  if (planQuery.error instanceof PlanApiError && planQuery.error.status === 404) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-lg font-semibold">Plano não encontrado.</p>
        <p className="mt-1 text-muted-foreground">Ele pode ter sido removido.</p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/planos">Voltar para os planos</Link>
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

  if (!planQuery.data) {
    return (
      <div className="mx-auto max-w-3xl space-y-6" aria-busy="true">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return <PlanView plan={planQuery.data} />;
};

const PlanView: React.FC<{ plan: PlanDetail }> = ({ plan }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const catalog = usePlanCatalog();
  const setRead = useSetDayRead(plan.id);
  const realign = useRealign(plan.id);
  const updateRhythm = useUpdateRhythm(plan.id);
  const removePlan = useRemovePlan();
  const [rhythmOpen, setRhythmOpen] = React.useState(false);
  const [removeOpen, setRemoveOpen] = React.useState(false);

  const percent = Math.round((plan.days_read / plan.reading_days) * 100);
  const today = todayISO();
  const scheduled = scheduledIndex(plan.days, today);
  const next = plan.next_day;
  // Só sugere realinhar quando o calendário já passou do próximo dia por ler — sem tom de cobrança
  const behind = next ? scheduled - next.index : 0;
  const defaultDays = catalog.data?.find((p) => p.slug === plan.plan_slug)?.default_days ?? null;

  const toggle = (day: PlanDay) =>
    setRead.mutate(
      { day: day.index, read: day.status !== 'read' },
      {
        onError: () =>
          toast({ title: 'Não foi possível salvar a leitura', description: 'Verifique sua conexão e tente novamente.', variant: 'destructive' }),
      },
    );

  const doRealign = () =>
    realign.mutate(undefined, {
      onSuccess: () => toast({ title: 'Datas realinhadas', description: 'A próxima leitura ficou para hoje.' }),
      onError: (error) => toast({ title: 'Não foi possível realinhar', description: planErrorMessage(error), variant: 'destructive' }),
    });

  const remove = () =>
    removePlan.mutate(plan.id, {
      onSuccess: () => {
        toast({ title: 'Plano removido', description: plan.title });
        navigate('/planos', { replace: true });
      },
      onError: () => toast({ title: 'Não foi possível remover o plano', description: 'Tente novamente.', variant: 'destructive' }),
    });

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-10">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="h-10 w-10 shrink-0">
            <Link to="/planos" aria-label="Voltar para os planos">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="min-w-0 flex-1 text-2xl font-bold text-foreground md:text-3xl">{plan.title}</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" aria-label="Opções do plano">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => { updateRhythm.reset(); setRhythmOpen(true); }}>
                <Settings2 className="h-4 w-4" /> Ajustar ritmo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setRemoveOpen(true)} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4" /> Remover plano
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-1.5">
          <Progress value={percent} aria-label={`${plan.days_read} de ${plan.reading_days} dias lidos`} className="h-2.5" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{plan.days_read}</strong> de {plan.reading_days} dias lidos · de{' '}
            {formatLongDate(plan.start_date)} a {formatLongDate(plan.end_date)}
          </p>
        </div>
      </div>

      {/* Próxima leitura */}
      {next ? (
        <section aria-labelledby="next-heading" className="rounded-2xl border border-primary/30 bg-primary/5 p-5 md:p-6">
          <p id="next-heading" className="text-sm font-semibold uppercase tracking-wide text-primary">
            Próxima leitura · Dia {next.index}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{formatDay(next.date)}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {next.passages.map((p, i) => (
              <li key={i}>
                <Link
                  to={readerLink(p)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 font-crimson text-[17px] text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <BookOpen className="h-4 w-4 font-inter" />
                  {passageLabel(p)}
                </Link>
              </li>
            ))}
          </ul>
          <Button className="mt-5" onClick={() => toggle(next)} disabled={setRead.isPending}>
            {setRead.isPending && setRead.variables?.day === next.index ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Marcar dia {next.index} como lido
          </Button>
          {behind > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              Pelo calendário, hoje seria o dia {scheduled}. Siga no seu ritmo ou{' '}
              <button type="button" onClick={doRealign} disabled={realign.isPending} className="font-medium text-primary hover:underline disabled:opacity-60">
                realinhe as datas
              </button>{' '}
              para continuar a partir de hoje.
            </p>
          )}
        </section>
      ) : (
        <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
          <p className="text-lg font-semibold text-foreground">Você concluiu este plano. Glória a Deus!</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/planos">Escolher outro plano</Link>
          </Button>
        </section>
      )}

      <DayList plan={plan} today={today} onToggle={toggle} pendingDay={setRead.isPending ? setRead.variables?.day : undefined} />

      <PlanRhythmDialog
        open={rhythmOpen}
        onOpenChange={setRhythmOpen}
        title="Ajustar ritmo"
        description="O que você já leu continua lido. Os dias são redistribuídos com o novo ritmo."
        submitLabel="Salvar ritmo"
        initial={{ start_date: plan.start_date, total_days: plan.total_days, weekdays: plan.weekdays }}
        defaultDays={defaultDays}
        pending={updateRhythm.isPending}
        error={updateRhythm.isError ? planErrorMessage(updateRhythm.error) : null}
        onSubmit={({ start_date, total_days, weekdays }) =>
          updateRhythm.mutate(
            { start_date, total_days, weekdays },
            {
              onSuccess: () => {
                setRhythmOpen(false);
                toast({ title: 'Ritmo atualizado' });
              },
            },
          )
        }
      />

      <AlertDialog open={removeOpen} onOpenChange={(next) => !removePlan.isPending && setRemoveOpen(next)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover este plano?</AlertDialogTitle>
            <AlertDialogDescription>
              “{plan.title}” e o progresso dele serão removidos. Seus destaques e comentários continuam na Bíblia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removePlan.isPending}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={remove} disabled={removePlan.isPending}>
              {removePlan.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Remover plano
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/** Dias agrupados por mês; o mês da próxima leitura vem aberto. */
const DayList: React.FC<{
  plan: PlanDetail;
  today: string;
  onToggle: (day: PlanDay) => void;
  pendingDay: number | undefined;
}> = ({ plan, today, onToggle, pendingDay }) => {
  const months = React.useMemo(() => {
    const groups: { key: string; days: PlanDay[] }[] = [];
    for (const day of plan.days) {
      const key = day.date.slice(0, 7);
      if (groups[groups.length - 1]?.key !== key) groups.push({ key, days: [] });
      groups[groups.length - 1].days.push(day);
    }
    return groups;
  }, [plan.days]);
  const focusMonth = (plan.next_day?.date ?? plan.days[plan.days.length - 1].date).slice(0, 7);

  return (
    <section aria-labelledby="days-heading" className="space-y-3">
      <h2 id="days-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Todos os dias
      </h2>
      <div className="space-y-2">
        {months.map((month) => {
          const read = month.days.filter((d) => d.status === 'read').length;
          return (
            <details key={month.key} open={month.key === focusMonth} className="group rounded-2xl border border-border bg-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                <span className="font-medium capitalize text-foreground">{formatMonth(month.days[0].date)}</span>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  {read}/{month.days.length}
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                </span>
              </summary>
              <ol className="divide-y divide-border border-t border-border">
                {month.days.map((day) => (
                  <DayRow
                    key={day.index}
                    day={day}
                    isToday={day.date === today}
                    isNext={day.index === plan.next_day?.index}
                    pending={pendingDay === day.index}
                    onToggle={() => onToggle(day)}
                  />
                ))}
              </ol>
            </details>
          );
        })}
      </div>
    </section>
  );
};

const DayRow: React.FC<{ day: PlanDay; isToday: boolean; isNext: boolean; pending: boolean; onToggle: () => void }> = ({
  day,
  isToday,
  isNext,
  pending,
  onToggle,
}) => {
  const label = day.status === 'read' ? 'lido' : day.status === 'partial' ? 'lido em parte' : 'não lido';
  return (
    <li className={cn('flex items-center gap-3 px-4 py-3', isNext && 'bg-primary/5')}>
      <button
        type="button"
        onClick={onToggle}
        disabled={pending}
        aria-label={`Dia ${day.index}: ${label}. ${day.status === 'read' ? 'Desmarcar' : 'Marcar como lido'}`}
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          day.status === 'read' && 'border-primary bg-primary text-primary-foreground',
          day.status === 'partial' && 'border-primary bg-[linear-gradient(90deg,hsl(var(--primary))_50%,transparent_50%)] text-primary-foreground',
          day.status === 'unread' && 'border-border text-transparent hover:border-primary',
        )}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Check className="h-4 w-4" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Dia {day.index}</span> · {formatDay(day.date)}
          {isToday && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">hoje</span>}
        </p>
        <p className="mt-0.5 font-crimson text-[17px] leading-snug text-foreground">
          {formatPassages(day.passages).join(' · ')}
        </p>
      </div>
      <Link
        to={readerLink(day.passages[0])}
        className="shrink-0 rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={`Ler o dia ${day.index}`}
      >
        <BookOpen className="h-4 w-4" />
      </Link>
    </li>
  );
};

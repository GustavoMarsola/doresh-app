import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarCheck, ChevronRight, ListChecks, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { PlanRhythmDialog } from '@/components/plans/PlanRhythmDialog';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { useMyGroups, type GroupSummary } from '@/lib/readingGroups';
import {
  defaultRhythm,
  formatPassages,
  planErrorMessage,
  useMyPlans,
  usePlanCatalog,
  useStartPlan,
  type CatalogPlan,
  type PlanSummary,
} from '@/lib/readingPlans';

export const ReadingPlans: React.FC = () => {
  const navigate = useNavigate();
  const myPlans = useMyPlans();
  const catalog = usePlanCatalog();
  const startPlan = useStartPlan();
  const myGroups = useMyGroups();
  const [chosen, setChosen] = React.useState<CatalogPlan | null>(null);
  const [groupOpen, setGroupOpen] = React.useState(false);

  const open = (plan: CatalogPlan) => {
    if (plan.needs_books) {
      navigate('/planos/novo');
      return;
    }
    startPlan.reset();
    setChosen(plan);
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Planos de leitura</h1>
        <p className="mt-1 text-muted-foreground">Leia a Palavra com constância, no ritmo que serve para você.</p>
      </div>

      <section aria-labelledby="my-plans" className="space-y-4">
        <h2 id="my-plans" className="text-lg font-semibold text-foreground">
          Meus planos
        </h2>
        {myPlans.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </div>
        ) : myPlans.isError ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="font-medium text-foreground">Não foi possível carregar seus planos.</p>
            <Button className="mt-4" variant="outline" onClick={() => myPlans.refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : myPlans.data?.length ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {myPlans.data.map((plan) => (
              <li key={plan.id}>
                <MyPlanCard plan={plan} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center gap-4 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            <ListChecks className="h-6 w-6 shrink-0 text-primary" />
            Você ainda não segue nenhum plano. Escolha um abaixo para começar.
          </div>
        )}
      </section>

      <section aria-labelledby="my-groups" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="my-groups" className="text-lg font-semibold text-foreground">
            Meus grupos
          </h2>
          <Button variant="outline" size="sm" onClick={() => setGroupOpen(true)} disabled={!myPlans.data?.length}>
            <Plus className="h-4 w-4" /> Criar grupo
          </Button>
        </div>
        {myGroups.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        ) : myGroups.isError ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="font-medium text-foreground">Não foi possível carregar seus grupos.</p>
            <Button className="mt-4" variant="outline" onClick={() => myGroups.refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : myGroups.data?.length ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {myGroups.data.map((group) => (
              <li key={group.id}>
                <MyGroupCard group={group} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center gap-4 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            <Users className="h-6 w-6 shrink-0 text-primary" />
            <span>
              Leia junto com sua célula, classe ou família: crie um grupo a partir de um dos seus planos e convide por link.
              {!myPlans.data?.length && ' Comece um plano primeiro.'}
            </span>
          </div>
        )}
      </section>

      <section aria-labelledby="catalog" className="space-y-4">
        <h2 id="catalog" className="text-lg font-semibold text-foreground">
          Escolha um plano
        </h2>
        {catalog.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : catalog.isError ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="font-medium text-foreground">Não foi possível carregar os planos.</p>
            <Button className="mt-4" variant="outline" onClick={() => catalog.refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {catalog.data?.map((plan) => (
              <li key={plan.slug} className="flex flex-col rounded-2xl border border-border bg-card p-5">
                <h3 className="font-semibold text-foreground">{plan.title}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{plan.description}</p>
                <Button className="mt-4 self-start" variant="outline" onClick={() => open(plan)}>
                  {plan.needs_books ? 'Montar plano' : 'Começar'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CreateGroupDialog open={groupOpen} onOpenChange={setGroupOpen} />

      {chosen && (
        <PlanRhythmDialog
          open={!!chosen}
          onOpenChange={(next) => !next && setChosen(null)}
          title={chosen.title}
          description="Escolha quando começar e o seu ritmo. Você pode mudar isso depois."
          submitLabel="Começar plano"
          initial={defaultRhythm(chosen.default_days, chosen.default_weekdays)}
          defaultDays={chosen.default_days}
          needsBook={chosen.needs_book}
          pending={startPlan.isPending}
          error={startPlan.isError ? planErrorMessage(startPlan.error) : null}
          onSubmit={(value) =>
            startPlan.mutate(
              { plan_slug: chosen.slug, ...value },
              { onSuccess: (plan) => navigate(`/planos/${plan.id}`) },
            )
          }
        />
      )}
    </div>
  );
};

const MyGroupCard: React.FC<{ group: GroupSummary }> = ({ group }) => {
  const percent = Math.round((group.days_read / group.reading_days) * 100);
  return (
    <Link
      to={`/grupos/${group.id}`}
      className="group block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-foreground">{group.name}</h3>
          <p className="truncate text-sm text-muted-foreground">
            {group.title} · {group.members_count} {group.members_count === 1 ? 'participante' : 'participantes'}
            {group.role === 'leader' && ' · você lidera'}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <div className="mt-3 space-y-1.5">
        <Progress value={percent} aria-label={`${group.days_read} de ${group.reading_days} dias lidos`} className="h-2" />
        <p className="text-sm text-muted-foreground">
          Você leu {group.days_read} de {group.reading_days} dias
        </p>
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm text-foreground">
        <Users className="h-4 w-4 shrink-0 text-primary" />
        {group.next_day ? (
          <span className="min-w-0 truncate">
            Próxima leitura: <strong>Dia {group.next_day.index}</strong> · {formatPassages(group.next_day.passages).join('; ')}
          </span>
        ) : (
          <span>Leitura concluída. Glória a Deus!</span>
        )}
      </p>
    </Link>
  );
};

const MyPlanCard: React.FC<{ plan: PlanSummary }> = ({ plan }) => {
  const percent = Math.round((plan.days_read / plan.reading_days) * 100);
  return (
    <Link
      to={`/planos/${plan.id}`}
      className="group block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-foreground">{plan.title}</h3>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <div className="mt-3 space-y-1.5">
        <Progress value={percent} aria-label={`${plan.days_read} de ${plan.reading_days} dias lidos`} className="h-2" />
        <p className="text-sm text-muted-foreground">
          {plan.days_read} de {plan.reading_days} dias lidos
        </p>
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm text-foreground">
        <CalendarCheck className="h-4 w-4 shrink-0 text-primary" />
        {plan.next_day ? (
          <span className="min-w-0 truncate">
            Próxima leitura: <strong>Dia {plan.next_day.index}</strong> · {formatPassages(plan.next_day.passages).join('; ')}
          </span>
        ) : (
          <span>Plano concluído. Glória a Deus!</span>
        )}
      </p>
    </Link>
  );
};

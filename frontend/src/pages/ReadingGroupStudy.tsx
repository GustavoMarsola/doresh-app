import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AiBadge } from '@/components/studies/AiBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGroup, useGroupDayStudy } from '@/lib/readingGroups';
import { PlanApiError } from '@/lib/readingPlans';
import { formatReference } from '@/lib/studies';
import { StudyBody } from '@/pages/StudyView';

/** Leitura (sem edição) do estudo que o líder anexou a um dia do grupo. */
export const ReadingGroupStudy: React.FC = () => {
  const { id = '', day: dayParam = '' } = useParams();
  const index = Number(dayParam);
  const groupQuery = useGroup(id);
  const studyQuery = useGroupDayStudy(id, index);
  const back = `/grupos/${id}/dia/${index}`;

  if (studyQuery.error instanceof PlanApiError && [403, 404].includes(studyQuery.error.status)) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-lg font-semibold">Estudo não disponível.</p>
        <p className="mt-1 text-muted-foreground">O líder pode ter removido a nota ou o estudo, ou você não faz parte do grupo.</p>
        <Button asChild className="mt-6" variant="outline">
          <Link to={back}>Voltar para o dia</Link>
        </Button>
      </div>
    );
  }

  if (studyQuery.isError) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-lg font-semibold">Não foi possível abrir o estudo.</p>
        <Button className="mt-6" variant="outline" onClick={() => studyQuery.refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const study = studyQuery.data;
  if (!study) {
    return (
      <div className="mx-auto max-w-3xl space-y-5" aria-busy="true">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-11 w-3/4" />
        <Skeleton className="mt-8 h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl pb-10">
      <div className="mb-6">
        <Button variant="ghost" asChild className="-ml-3 gap-1.5 text-muted-foreground">
          <Link to={back}>
            <ArrowLeft className="h-4 w-4" />
            {groupQuery.data ? `${groupQuery.data.name} · Dia ${index}` : 'Voltar'}
          </Link>
        </Button>
      </div>
      <header className="space-y-3 border-b border-border pb-6">
        {study.ai_generated && <AiBadge />}
        <h1 className="font-crimson text-3xl font-semibold leading-tight text-foreground md:text-[2.75rem]">{study.title}</h1>
        {study.references.length > 0 && <p className="font-medium text-primary">{study.references.map(formatReference).join(' · ')}</p>}
        <p className="text-sm text-muted-foreground">Estudo compartilhado pelo líder do grupo</p>
      </header>
      <StudyBody study={study} />
    </article>
  );
};

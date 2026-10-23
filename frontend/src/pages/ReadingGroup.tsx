import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  Link2,
  Link2Off,
  Loader2,
  LogOut,
  MessageSquareText,
  MoreHorizontal,
  Settings2,
  Share2,
  Trash2,
  UserMinus,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
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
  groupErrorMessage,
  inviteUrl,
  readersLabel,
  shareText,
  useCreateInvite,
  useGroup,
  useLeaveGroup,
  useRemoveGroup,
  useRemoveMember,
  useRevokeInvite,
  useSetGroupDayRead,
  useSetShowName,
  useUpdateGroup,
  type GroupDay,
  type GroupDetail,
  type GroupMember,
} from '@/lib/readingGroups';
import { PlanApiError, WEEKDAYS, formatDay, formatLongDate, formatMonth, formatPassages, passageLabel, readerLink, todayISO } from '@/lib/readingPlans';
import { cn } from '@/lib/utils';

export const ReadingGroup: React.FC = () => {
  const { id = '' } = useParams();
  const groupQuery = useGroup(id);

  if (groupQuery.error instanceof PlanApiError && groupQuery.error.status === 404) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-lg font-semibold">Grupo não encontrado.</p>
        <p className="mt-1 text-muted-foreground">Ele pode ter sido encerrado, ou você não faz parte dele.</p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/planos">Voltar para os planos</Link>
        </Button>
      </div>
    );
  }

  if (groupQuery.isError) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-lg font-semibold">Não foi possível carregar o grupo.</p>
        <Button className="mt-6" variant="outline" onClick={() => groupQuery.refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!groupQuery.data) {
    return (
      <div className="mx-auto max-w-3xl space-y-6" aria-busy="true">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return <GroupView group={groupQuery.data} />;
};

const GroupView: React.FC<{ group: GroupDetail }> = ({ group }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isLeader = group.role === 'leader';
  const setRead = useSetGroupDayRead(group.id);
  const updateGroup = useUpdateGroup(group.id);
  const setShowName = useSetShowName(group.id);
  const leaveGroup = useLeaveGroup();
  const removeGroup = useRemoveGroup();
  const [rhythmOpen, setRhythmOpen] = React.useState(false);
  const [confirm, setConfirm] = React.useState<'leave' | 'remove' | null>(null);

  const percent = Math.round((group.days_read / group.reading_days) * 100);
  const today = todayISO();
  const next = group.next_day ? group.days[group.next_day.index - 1] : null;
  const meeting = group.meeting_weekday ? WEEKDAYS.find((d) => d.value === group.meeting_weekday)?.long : null;

  const toggle = (day: GroupDay) =>
    setRead.mutate(
      { day: day.index, read: day.status !== 'read' },
      { onError: () => toast({ title: 'Não foi possível salvar a leitura', description: 'Verifique sua conexão e tente novamente.', variant: 'destructive' }) },
    );

  const leave = () =>
    leaveGroup.mutate(group.id, {
      onSuccess: () => {
        toast({ title: 'Você saiu do grupo', description: 'Sua participação e seu progresso no grupo foram apagados.' });
        navigate('/planos', { replace: true });
      },
      onError: (error) => toast({ title: 'Não foi possível sair', description: groupErrorMessage(error), variant: 'destructive' }),
    });

  const remove = () =>
    removeGroup.mutate(group.id, {
      onSuccess: () => {
        toast({ title: 'Grupo encerrado', description: group.name });
        navigate('/planos', { replace: true });
      },
      onError: (error) => toast({ title: 'Não foi possível encerrar o grupo', description: groupErrorMessage(error), variant: 'destructive' }),
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
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">{group.name}</h1>
            <p className="truncate text-sm text-muted-foreground">
              {group.title} · {group.members_count} {group.members_count === 1 ? 'participante' : 'participantes'}
              {meeting && ` · encontro: ${meeting.toLowerCase()}`}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" aria-label="Opções do grupo">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {isLeader && (
                <DropdownMenuItem onSelect={() => { updateGroup.reset(); setRhythmOpen(true); }}>
                  <Settings2 className="h-4 w-4" /> Ajustar ritmo do grupo
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setShowName.mutate(!group.show_name); }} className="justify-between">
                <span>Mostrar meu nome</span>
                <Switch checked={group.show_name} aria-label="Mostrar meu nome ao grupo" className="pointer-events-none" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isLeader ? (
                <DropdownMenuItem onSelect={() => setConfirm('remove')} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4" /> Encerrar grupo
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => setConfirm('leave')} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" /> Sair do grupo
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-1.5">
          <Progress value={percent} aria-label={`${group.days_read} de ${group.reading_days} dias lidos`} className="h-2.5" />
          <p className="text-sm text-muted-foreground">
            Você leu <strong className="text-foreground">{group.days_read}</strong> de {group.reading_days} dias · de{' '}
            {formatLongDate(group.start_date)} a {formatLongDate(group.end_date)}
          </p>
        </div>
      </div>

      {next ? (
        <section aria-labelledby="next-heading" className="rounded-2xl border border-primary/30 bg-primary/5 p-5 md:p-6">
          <p id="next-heading" className="text-sm font-semibold uppercase tracking-wide text-primary">
            Sua próxima leitura · Dia {next.index}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDay(next.date)} · {readersLabel(next.readers, group.members_count)}
          </p>
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
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button onClick={() => toggle(next)} disabled={setRead.isPending}>
              {setRead.isPending && setRead.variables?.day === next.index ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Marcar dia {next.index} como lido
            </Button>
            <Button asChild variant="outline">
              <Link to={`/grupos/${group.id}/dia/${next.index}`}>Abrir o dia{next.note ? ' e a nota do líder' : ''}</Link>
            </Button>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
          <p className="text-lg font-semibold text-foreground">Você concluiu a leitura do grupo. Glória a Deus!</p>
        </section>
      )}

      {isLeader && <InviteCard group={group} />}

      <MembersList group={group} />

      <DayList group={group} today={today} onToggle={toggle} pendingDay={setRead.isPending ? setRead.variables?.day : undefined} />

      {isLeader && (
        <PlanRhythmDialog
          open={rhythmOpen}
          onOpenChange={setRhythmOpen}
          title="Ajustar ritmo do grupo"
          description="Vale para todos os membros. O que cada um já leu continua lido; os dias são redistribuídos."
          submitLabel="Salvar ritmo"
          initial={{ start_date: group.start_date, total_days: group.total_days, weekdays: group.weekdays }}
          defaultDays={null}
          pending={updateGroup.isPending}
          error={updateGroup.isError ? groupErrorMessage(updateGroup.error) : null}
          onSubmit={({ start_date, total_days, weekdays }) =>
            updateGroup.mutate(
              { start_date, total_days, weekdays },
              { onSuccess: () => { setRhythmOpen(false); toast({ title: 'Ritmo do grupo atualizado' }); } },
            )
          }
        />
      )}

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && !leaveGroup.isPending && !removeGroup.isPending && setConfirm(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === 'remove' ? 'Encerrar este grupo?' : 'Sair deste grupo?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === 'remove'
                ? `“${group.name}” será encerrado para todos: as participações, o progresso no grupo e as notas serão apagados. Os planos e as anotações pessoais de cada um continuam.`
                : 'Sua participação e seu progresso neste grupo serão apagados. Se quiser voltar, use o link de convite de novo.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={leaveGroup.isPending || removeGroup.isPending}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={confirm === 'remove' ? remove : leave} disabled={leaveGroup.isPending || removeGroup.isPending}>
              {(leaveGroup.isPending || removeGroup.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirm === 'remove' ? 'Encerrar grupo' : 'Sair do grupo'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/** Link de convite (só o líder vê): gerar, copiar/partilhar, renovar e cancelar. */
const InviteCard: React.FC<{ group: GroupDetail }> = ({ group }) => {
  const { toast } = useToast();
  const createInvite = useCreateInvite(group.id);
  const revokeInvite = useRevokeInvite(group.id);
  const invite = group.invite;
  const url = invite ? inviteUrl(invite.token) : null;

  const share = async () => {
    if (!url) return;
    try {
      const how = await shareText(`Venha ler “${group.title}” comigo no grupo “${group.name}”: ${url}`, group.name);
      if (how === 'copied') toast({ title: 'Link copiado', description: 'Cole no WhatsApp ou onde o grupo conversa.' });
    } catch {
      /* partilha cancelada */
    }
  };

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    toast({ title: 'Link copiado' });
  };

  const generate = () =>
    createInvite.mutate(undefined, {
      onError: (error) => toast({ title: 'Não foi possível gerar o link', description: groupErrorMessage(error), variant: 'destructive' }),
    });

  const revoke = () =>
    revokeInvite.mutate(undefined, {
      onSuccess: () => toast({ title: 'Link cancelado', description: 'Quem ainda não entrou não consegue mais usá-lo.' }),
      onError: (error) => toast({ title: 'Não foi possível cancelar o link', description: groupErrorMessage(error), variant: 'destructive' }),
    });

  return (
    <section aria-labelledby="invite-heading" className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="invite-heading" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Link2 className="h-4 w-4" /> Convite
        </h2>
        {invite && <span className="text-xs text-muted-foreground">válido até {formatLongDate(invite.expires_at.slice(0, 10))}</span>}
      </div>
      {invite && url ? (
        <>
          <p className="break-all rounded-xl bg-muted/60 px-3 py-2 font-mono text-xs text-foreground">{url}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={share}>
              <Share2 className="h-4 w-4" /> Compartilhar
            </Button>
            <Button size="sm" variant="outline" onClick={copy}>
              <Copy className="h-4 w-4" /> Copiar link
            </Button>
            <Button size="sm" variant="ghost" onClick={generate} disabled={createInvite.isPending}>
              {createInvite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Novo link
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={revoke} disabled={revokeInvite.isPending}>
              {revokeInvite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2Off className="h-4 w-4" />} Cancelar link
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Quem abrir o link vê o plano, aceita o termo de participação e entra. Cancelar o link não remove quem já entrou.</p>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">Gere um link e compartilhe no WhatsApp. Ele vale por 30 dias e pode ser cancelado a qualquer momento.</p>
          <Button size="sm" onClick={generate} disabled={createInvite.isPending}>
            {createInvite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Gerar link de convite
          </Button>
        </>
      )}
    </section>
  );
};

const MembersList: React.FC<{ group: GroupDetail }> = ({ group }) => {
  const { toast } = useToast();
  const removeMember = useRemoveMember(group.id);
  const [removing, setRemoving] = React.useState<GroupMember | null>(null);
  const isLeader = group.role === 'leader';

  const remove = () => {
    if (!removing) return;
    removeMember.mutate(removing.id, {
      onSuccess: () => { setRemoving(null); toast({ title: 'Participante removido' }); },
      onError: (error) => toast({ title: 'Não foi possível remover', description: groupErrorMessage(error), variant: 'destructive' }),
    });
  };

  return (
    <section aria-labelledby="members-heading" className="space-y-3">
      <h2 id="members-heading" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <Users className="h-4 w-4" /> Participantes ({group.members.length})
      </h2>
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {group.members.map((m) => (
          <li key={m.id} className="flex items-center gap-3 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
              {(m.name ?? 'M').slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {m.name ?? 'Participante'}
                {m.is_me && <span className="ml-1.5 text-muted-foreground">(você)</span>}
                {m.role === 'leader' && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">líder</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                {m.days_read} de {group.reading_days} dias lidos
              </p>
            </div>
            {isLeader && m.role !== 'leader' && (
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" aria-label="Remover participante" onClick={() => setRemoving(m)}>
                <UserMinus className="h-4 w-4" />
              </Button>
            )}
          </li>
        ))}
      </ul>
      {group.members.length === 1 && isLeader && (
        <p className="text-sm text-muted-foreground">Por enquanto só você. Compartilhe o link de convite para o grupo entrar.</p>
      )}

      <AlertDialog open={!!removing} onOpenChange={(open) => !open && !removeMember.isPending && setRemoving(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {removing?.name ?? 'este participante'}?</AlertDialogTitle>
            <AlertDialogDescription>A participação e o progresso dessa pessoa no grupo serão apagados. Ela pode voltar pelo link de convite.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMember.isPending}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={remove} disabled={removeMember.isPending}>
              {removeMember.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Remover
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

/** Dias agrupados por mês, com quantos do grupo leram cada um; o mês da próxima leitura vem aberto. */
const DayList: React.FC<{ group: GroupDetail; today: string; onToggle: (day: GroupDay) => void; pendingDay: number | undefined }> = ({
  group,
  today,
  onToggle,
  pendingDay,
}) => {
  const months = React.useMemo(() => {
    const groups: { key: string; days: GroupDay[] }[] = [];
    for (const day of group.days) {
      const key = day.date.slice(0, 7);
      if (groups[groups.length - 1]?.key !== key) groups.push({ key, days: [] });
      groups[groups.length - 1].days.push(day);
    }
    return groups;
  }, [group.days]);
  const focusMonth = (group.next_day?.date ?? group.days[group.days.length - 1].date).slice(0, 7);

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
                    group={group}
                    day={day}
                    isToday={day.date === today}
                    isNext={day.index === group.next_day?.index}
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

const DayRow: React.FC<{ group: GroupDetail; day: GroupDay; isToday: boolean; isNext: boolean; pending: boolean; onToggle: () => void }> = ({
  group,
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
      <Link to={`/grupos/${group.id}/dia/${day.index}`} className="min-w-0 flex-1 rounded-md hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">Dia {day.index}</span> · {formatDay(day.date)}
          </span>
          {isToday && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">hoje</span>}
          {day.is_meeting && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">encontro</span>}
          {day.note && <MessageSquareText className="h-3.5 w-3.5 text-primary" aria-label="Tem nota do líder" />}
        </p>
        <p className="mt-0.5 font-crimson text-[17px] leading-snug text-foreground">{formatPassages(day.passages).join(' · ')}</p>
      </Link>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground" title={readersLabel(day.readers, group.members_count)}>
        <Users className="mr-1 inline h-3.5 w-3.5" aria-hidden />
        {day.readers}/{group.members_count}
      </span>
    </li>
  );
};

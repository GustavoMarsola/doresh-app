import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, BookOpen, Check, ChevronLeft, ChevronRight, FileText, Loader2, MessageSquareText, Pencil, Share2, Trash2, Undo2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { groupErrorMessage, readersLabel, shareDayText, shareText, useDeleteNote, useGroup, usePutNote, useSetGroupDayRead, type GroupDay, type GroupDetail } from '@/lib/readingGroups';
import { PlanApiError, formatDay, passageLabel, readerLink, todayISO } from '@/lib/readingPlans';
import { useStudies } from '@/lib/studies';
import { cn } from '@/lib/utils';

export const ReadingGroupDay: React.FC = () => {
  const { id = '', day: dayParam = '' } = useParams();
  const groupQuery = useGroup(id);
  const index = Number(dayParam);
  const day = groupQuery.data?.days[index - 1];

  if ((groupQuery.error instanceof PlanApiError && groupQuery.error.status === 404) || (groupQuery.data && !day)) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-lg font-semibold">Dia não encontrado.</p>
        <p className="mt-1 text-muted-foreground">O grupo pode ter sido encerrado, ter menos dias, ou você não faz parte dele.</p>
        <Button asChild className="mt-6" variant="outline">
          <Link to={groupQuery.data ? `/grupos/${id}` : '/planos'}>Voltar</Link>
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

  if (!groupQuery.data || !day) {
    return (
      <div className="mx-auto max-w-3xl space-y-6" aria-busy="true">
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return <DayView group={groupQuery.data} day={day} />;
};

const DayView: React.FC<{ group: GroupDetail; day: GroupDay }> = ({ group, day }) => {
  const { toast } = useToast();
  const setRead = useSetGroupDayRead(group.id);
  const isRead = day.status === 'read';
  const isLeader = group.role === 'leader';
  const previous = day.index > 1 ? day.index - 1 : null;
  const following = day.index < group.days.length ? day.index + 1 : null;

  const toggle = () =>
    setRead.mutate(
      { day: day.index, read: !isRead },
      {
        onSuccess: (updated) => {
          if (isRead) return;
          const next = updated.next_day;
          toast({ title: `Dia ${day.index} lido`, description: next ? `Próxima leitura: dia ${next.index}.` : 'Você concluiu a leitura do grupo. Glória a Deus!' });
        },
        onError: () => toast({ title: 'Não foi possível salvar a leitura', description: 'Verifique sua conexão e tente novamente.', variant: 'destructive' }),
      },
    );

  const share = async () => {
    try {
      const how = await shareText(shareDayText(group, day), `${group.name} · Dia ${day.index}`);
      if (how === 'copied') toast({ title: 'Copiado', description: 'Referência e link do dia, prontos para colar no WhatsApp.' });
    } catch {
      /* partilha cancelada */
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-10">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="h-10 w-10 shrink-0">
          <Link to={`/grupos/${group.id}`} aria-label={`Voltar para ${group.name}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-muted-foreground">{group.name}</p>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Dia {day.index}</h1>
        </div>
        <div className="flex shrink-0 items-center">
          <Button variant="ghost" size="icon" className="h-10 w-10" disabled={!previous} asChild={!!previous}>
            {previous ? (
              <Link to={`/grupos/${group.id}/dia/${previous}`} aria-label={`Dia ${previous}`}>
                <ChevronLeft className="h-5 w-5" />
              </Link>
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10" disabled={!following} asChild={!!following}>
            {following ? (
              <Link to={`/grupos/${group.id}/dia/${following}`} aria-label={`Dia ${following}`}>
                <ChevronRight className="h-5 w-5" />
              </Link>
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Leitura do dia */}
      <section aria-labelledby="reading-heading" className={cn('rounded-2xl border p-5 md:p-6', isRead ? 'border-border bg-card' : 'border-primary/30 bg-primary/5')}>
        <p id="reading-heading" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span>{formatDay(day.date)}</span>
          {day.date === todayISO() && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">hoje</span>}
          {day.is_meeting && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">dia do encontro</span>}
          {isRead && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">lido</span>}
          {day.status === 'partial' && <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">lido em parte</span>}
        </p>
        <ul className="mt-4 space-y-2">
          {day.passages.map((p, i) => (
            <li key={i}>
              <Link to={readerLink(p)} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 transition-colors hover:border-primary">
                <span className="font-crimson text-lg text-foreground">{passageLabel(p)}</span>
                <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
                  <BookOpen className="h-4 w-4" /> Ler
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button variant={isRead ? 'outline' : 'default'} onClick={toggle} disabled={setRead.isPending}>
            {setRead.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isRead ? <Undo2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            {isRead ? 'Desmarcar leitura' : 'Marcar como lido'}
          </Button>
          <Button variant="outline" onClick={share}>
            <Share2 className="h-4 w-4" /> Compartilhar o dia
          </Button>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" /> {readersLabel(day.readers, group.members_count)}
          </p>
        </div>
      </section>

      {/* Nota do líder */}
      <section aria-labelledby="note-heading" className="space-y-3">
        <h2 id="note-heading" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <MessageSquareText className="h-4 w-4" /> Nota do líder
        </h2>
        {isLeader ? <NoteEditor group={group} day={day} /> : <NoteView group={group} day={day} />}
      </section>
    </div>
  );
};

const NoteView: React.FC<{ group: GroupDetail; day: GroupDay }> = ({ group, day }) => {
  if (!day.note) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        O líder ainda não deixou uma nota para este dia.
      </div>
    );
  }
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <p className="whitespace-pre-line text-[17px] leading-relaxed text-foreground">{day.note.text}</p>
      <StudyLink group={group} day={day} />
    </div>
  );
};

const StudyLink: React.FC<{ group: GroupDetail; day: GroupDay }> = ({ group, day }) => {
  if (!day.note?.study_id) return null;
  if (!day.note.study_title) {
    return <p className="text-sm text-muted-foreground">O estudo anexado não está mais disponível.</p>;
  }
  return (
    <Button asChild variant="outline" size="sm">
      <Link to={`/grupos/${group.id}/dia/${day.index}/estudo`}>
        <FileText className="h-4 w-4" /> Abrir o estudo: {day.note.study_title}
      </Link>
    </Button>
  );
};

/** O líder escreve a nota do dia e, se quiser, anexa um dos seus estudos (o grupo lê, não edita). */
const NoteEditor: React.FC<{ group: GroupDetail; day: GroupDay }> = ({ group, day }) => {
  const { toast } = useToast();
  const putNote = usePutNote(group.id);
  const deleteNote = useDeleteNote(group.id);
  const studies = useStudies('');
  const [editing, setEditing] = React.useState(!day.note);
  const [text, setText] = React.useState(day.note?.text ?? '');
  const [studyId, setStudyId] = React.useState(day.note?.study_id ?? 'none');

  React.useEffect(() => {
    setEditing(!day.note);
    setText(day.note?.text ?? '');
    setStudyId(day.note?.study_id ?? 'none');
  }, [day.index, day.note]);

  const options = studies.data?.pages.flatMap((p) => p.studies) ?? [];
  // Mantém o estudo anexado na lista mesmo que não esteja na primeira página
  const attached = day.note?.study_id && day.note.study_title && !options.some((s) => s.id === day.note!.study_id)
    ? [{ id: day.note.study_id, title: day.note.study_title }]
    : [];

  const save = () =>
    putNote.mutate(
      { day: day.index, text: text.trim(), study_id: studyId === 'none' ? null : studyId },
      {
        onSuccess: () => { setEditing(false); toast({ title: 'Nota publicada', description: 'O grupo já pode vê-la neste dia.' }); },
        onError: (error) => toast({ title: 'Não foi possível salvar a nota', description: groupErrorMessage(error), variant: 'destructive' }),
      },
    );

  const remove = () =>
    deleteNote.mutate(day.index, {
      onSuccess: () => toast({ title: 'Nota removida' }),
      onError: (error) => toast({ title: 'Não foi possível remover a nota', description: groupErrorMessage(error), variant: 'destructive' }),
    });

  if (!editing && day.note) {
    return (
      <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <p className="whitespace-pre-line text-[17px] leading-relaxed text-foreground">{day.note.text}</p>
        <div className="flex flex-wrap items-center gap-2">
          <StudyLink group={group} day={day} />
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Editar
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={remove} disabled={deleteNote.isPending}>
            {deleteNote.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Remover
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (text.trim()) save(); }}
      className="space-y-4 rounded-2xl border border-border bg-card p-5"
    >
      <div className="space-y-2">
        <Label htmlFor="note-text">O que o grupo deve ver neste dia</Label>
        <Textarea
          id="note-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={4000}
          rows={5}
          placeholder="Uma orientação para a leitura, uma pergunta para o encontro, um lembrete…"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="note-study">Anexar um estudo seu (opcional)</Label>
        <Select value={studyId} onValueChange={setStudyId}>
          <SelectTrigger id="note-study" className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem estudo</SelectItem>
            {[...attached, ...options].map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">O grupo lê o estudo dentro do Doresh; só você pode editá-lo.</p>
      </div>
      {putNote.isError && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {groupErrorMessage(putNote.error)}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={!text.trim() || putNote.isPending}>
          {putNote.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Publicar nota
        </Button>
        {day.note && (
          <Button type="button" variant="outline" onClick={() => { setEditing(false); setText(day.note!.text); setStudyId(day.note!.study_id ?? 'none'); }} disabled={putNote.isPending}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
};

import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  Check,
  CloudOff,
  Loader2,
  Plus,
  Quote,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ToastAction } from '@/components/ui/toast';
import { ReferenceDialog } from '@/components/studies/ReferenceDialog';
import { useToast } from '@/hooks/use-toast';
import {
  StudyNotFoundError,
  fetchPassageText,
  formatReference,
  studiesApi,
  studyKeys,
  useStudy,
  type Study,
  type StudyInput,
  type StudyReference,
} from '@/lib/studies';
import { cn } from '@/lib/utils';

type SectionDraft = { key: string; title: string; text: string };

interface Draft {
  title: string;
  introduction: string;
  conclusion: string;
  sections: SectionDraft[];
  references: StudyReference[];
}

type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

const AUTOSAVE_DELAY = 1200;
const newKey = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()));

const emptyDraft = (): Draft => ({
  title: '',
  introduction: '',
  conclusion: '',
  sections: [{ key: newKey(), title: '', text: '' }],
  references: [],
});

const draftFromStudy = (study: Study): Draft => ({
  title: study.title,
  introduction: study.introduction,
  conclusion: study.conclusion,
  sections: study.sections.length
    ? study.sections.map((s) => ({ key: s.id ?? newKey(), title: s.title ?? '', text: s.text }))
    : [{ key: newKey(), title: '', text: '' }],
  references: study.references,
});

const toInput = (draft: Draft): StudyInput => ({
  title: draft.title.trim(),
  introduction: draft.introduction,
  conclusion: draft.conclusion,
  // Pontos totalmente vazios não são salvos
  sections: draft.sections
    .filter((s) => s.title.trim() || s.text.trim())
    .map((s) => ({ title: s.title.trim() || null, text: s.text })),
  references: draft.references,
});

const autoGrow = 'min-h-[7rem] resize-y [field-sizing:content]';

export const StudyEditor: React.FC = () => {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [studyId, setStudyId] = React.useState<string | undefined>(routeId);
  const studyQuery = useStudy(routeId);
  const [draft, setDraft] = React.useState<Draft | null>(routeId ? null : emptyDraft);
  const [status, setStatus] = React.useState<SaveStatus>('idle');
  const [savedAt, setSavedAt] = React.useState<Date | null>(null);
  const [titleError, setTitleError] = React.useState(false);
  const [referenceOpen, setReferenceOpen] = React.useState(false);

  const draftRef = React.useRef(draft);
  draftRef.current = draft;
  const studyIdRef = React.useRef(studyId);
  studyIdRef.current = studyId;
  const inFlight = React.useRef<Promise<void> | null>(null);
  const changedDuringSave = React.useRef(false);
  const lastSaveOk = React.useRef(true);

  // O rascunho antigo ficava no navegador sem dono; não é mais usado.
  React.useEffect(() => {
    try {
      localStorage.removeItem('draft-sermon');
    } catch {
      /* ignora */
    }
  }, []);

  React.useEffect(() => {
    if (routeId && studyQuery.data && draft === null) setDraft(draftFromStudy(studyQuery.data));
  }, [routeId, studyQuery.data, draft]);

  const save = React.useCallback(async (): Promise<void> => {
    const current = draftRef.current;
    if (!current || !current.title.trim()) return;
    if (inFlight.current) {
      changedDuringSave.current = true;
      return inFlight.current;
    }

    setStatus('saving');
    const run = (async () => {
      try {
        const input = toInput(current);
        const saved = studyIdRef.current
          ? await studiesApi.update(studyIdRef.current, input)
          : await studiesApi.create(input);
        queryClient.setQueryData(studyKeys.detail(saved.id), saved);
        queryClient.invalidateQueries({ queryKey: ['studies', 'list'] });
        if (!studyIdRef.current) {
          setStudyId(saved.id);
          studyIdRef.current = saved.id;
          navigate(`/estudos/${saved.id}/editar`, { replace: true });
        }
        lastSaveOk.current = true;
        setSavedAt(new Date());
        setStatus(changedDuringSave.current ? 'unsaved' : 'saved');
      } catch {
        lastSaveOk.current = false;
        setStatus('error');
      } finally {
        inFlight.current = null;
      }
    })();
    inFlight.current = run;
    await run;
    if (changedDuringSave.current) {
      changedDuringSave.current = false;
      await save();
    }
  }, [navigate, queryClient]);

  // Salvamento automático após uma pausa na digitação
  React.useEffect(() => {
    if (status !== 'unsaved' || !draft?.title.trim()) return;
    const timer = window.setTimeout(save, AUTOSAVE_DELAY);
    return () => window.clearTimeout(timer);
  }, [draft, status, save]);

  // Aviso ao fechar a aba com alterações pendentes
  React.useEffect(() => {
    if (status !== 'unsaved' && status !== 'saving' && status !== 'error') return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [status]);

  const update = (patch: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => {
    setDraft((d) => (d ? { ...d, ...(typeof patch === 'function' ? patch(d) : patch) } : d));
    if (inFlight.current) changedDuringSave.current = true;
    setStatus('unsaved');
  };

  const updateSection = (key: string, patch: Partial<SectionDraft>) =>
    update((d) => ({ sections: d.sections.map((s) => (s.key === key ? { ...s, ...patch } : s)) }));

  const moveSection = (index: number, delta: -1 | 1) =>
    update((d) => {
      const sections = [...d.sections];
      const [item] = sections.splice(index, 1);
      sections.splice(index + delta, 0, item);
      return { sections };
    });

  const removeSection = (index: number) => {
    const removed = draft?.sections[index];
    if (!removed) return;
    update((d) => ({ sections: d.sections.filter((_, i) => i !== index) }));
    if (removed.title.trim() || removed.text.trim()) {
      toast({
        title: 'Ponto removido',
        description: removed.title.trim() || 'Ponto sem título',
        action: (
          <ToastAction
            altText="Desfazer remoção"
            onClick={() =>
              update((d) => {
                const sections = [...d.sections];
                sections.splice(Math.min(index, sections.length), 0, removed);
                return { sections };
              })
            }
          >
            Desfazer
          </ToastAction>
        ),
      });
    }
  };

  const finish = async () => {
    if (!draft?.title.trim()) {
      setTitleError(true);
      document.getElementById('study-title')?.focus();
      return;
    }
    if (!(studyIdRef.current && (status === 'saved' || status === 'idle'))) await save();
    if (studyIdRef.current && lastSaveOk.current) navigate(`/estudos/${studyIdRef.current}`);
  };

  if (routeId && studyQuery.error instanceof StudyNotFoundError) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-lg font-semibold">Estudo não encontrado.</p>
        <p className="mt-1 text-muted-foreground">Ele pode ter sido excluído.</p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/estudos">Voltar para Meus estudos</Link>
        </Button>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="mx-auto max-w-3xl space-y-6" aria-busy="true">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl pb-10">
      {/* Barra do editor */}
      <div className="sticky top-14 z-20 -mx-4 mb-6 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:top-0 md:-mx-8 md:px-8">
        <Button variant="ghost" size="icon" asChild className="h-10 w-10 shrink-0">
          <Link to={studyId ? `/estudos/${studyId}` : '/estudos'} aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <SaveIndicator status={status} savedAt={savedAt} hasTitle={!!draft.title.trim()} onRetry={save} />
        <Button className="ml-auto" onClick={finish} disabled={status === 'saving'}>
          {status === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />}
          Concluir
        </Button>
      </div>

      <div className="space-y-8">
        {/* Título */}
        <div className="space-y-1.5">
          <Label htmlFor="study-title" className="sr-only">
            Título do estudo
          </Label>
          <Input
            id="study-title"
            autoFocus={!routeId}
            placeholder="Título do estudo"
            value={draft.title}
            onChange={(e) => {
              setTitleError(false);
              update({ title: e.target.value });
            }}
            aria-invalid={titleError}
            aria-describedby={titleError ? 'study-title-error' : undefined}
            className="h-auto border-0 bg-transparent px-0 font-crimson text-3xl font-semibold shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0 md:text-4xl"
          />
          {titleError ? (
            <p id="study-title-error" className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" /> Dê um título ao estudo para salvá-lo.
            </p>
          ) : (
            !draft.title.trim() && <p className="text-sm text-muted-foreground">O estudo é salvo automaticamente assim que tiver um título.</p>
          )}
        </div>

        {/* Passagens */}
        <section aria-labelledby="refs-heading" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="refs-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Texto base
            </h2>
            <Button variant="outline" size="sm" onClick={() => setReferenceOpen(true)}>
              <Plus className="h-4 w-4" />
              Adicionar passagem
            </Button>
          </div>
          {draft.references.length === 0 ? (
            <button
              type="button"
              onClick={() => setReferenceOpen(true)}
              className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-border p-4 text-left text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              <BookOpen className="h-5 w-5 shrink-0" />
              Adicione a passagem bíblica em que o estudo se baseia. O texto aparece aqui para consulta.
            </button>
          ) : (
            <div className="space-y-3">
              {draft.references.map((ref, i) => (
                <PassageCard
                  key={`${formatReference(ref)}-${i}`}
                  reference={ref}
                  onRemove={() => update((d) => ({ references: d.references.filter((_, j) => j !== i) }))}
                  onInsert={(text) =>
                    update((d) => ({
                      introduction: `${d.introduction.trimEnd()}${d.introduction.trim() ? '\n\n' : ''}“${text}” (${formatReference(ref)})`,
                    }))
                  }
                />
              ))}
            </div>
          )}
        </section>

        <Field label="Introdução" htmlFor="study-intro">
          <Textarea
            id="study-intro"
            placeholder="Como você vai abrir o estudo? Contexto, pergunta inicial, ilustração…"
            value={draft.introduction}
            onChange={(e) => update({ introduction: e.target.value })}
            className={cn(autoGrow, 'text-base')}
          />
        </Field>

        {/* Desenvolvimento */}
        <section aria-labelledby="points-heading" className="space-y-3">
          <h2 id="points-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Desenvolvimento
          </h2>
          <ol className="space-y-4">
            {draft.sections.map((section, index) => (
              <li key={section.key} className="rounded-2xl border border-border bg-card p-4 md:p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <Label htmlFor={`point-title-${section.key}`} className="sr-only">
                    Título do ponto {index + 1}
                  </Label>
                  <Input
                    id={`point-title-${section.key}`}
                    placeholder={`Ponto ${index + 1}`}
                    value={section.title}
                    onChange={(e) => updateSection(section.key, { title: e.target.value })}
                    className="h-10 flex-1 border-0 bg-transparent px-1 text-base font-semibold shadow-none focus-visible:ring-1"
                  />
                  <div className="flex shrink-0 items-center">
                    <Button variant="ghost" size="icon" className="h-9 w-9" disabled={index === 0} onClick={() => moveSection(index, -1)} aria-label={`Mover ponto ${index + 1} para cima`}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" disabled={index === draft.sections.length - 1} onClick={() => moveSection(index, 1)} aria-label={`Mover ponto ${index + 1} para baixo`}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => removeSection(index)} aria-label={`Remover ponto ${index + 1}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Label htmlFor={`point-text-${section.key}`} className="sr-only">
                  Conteúdo do ponto {index + 1}
                </Label>
                <Textarea
                  id={`point-text-${section.key}`}
                  placeholder="Desenvolva este ponto: explicação, textos de apoio, aplicação…"
                  value={section.text}
                  onChange={(e) => updateSection(section.key, { text: e.target.value })}
                  className={cn(autoGrow, 'text-base')}
                />
              </li>
            ))}
          </ol>
          <Button variant="outline" className="w-full border-dashed" onClick={() => update((d) => ({ sections: [...d.sections, { key: newKey(), title: '', text: '' }] }))}>
            <Plus className="h-4 w-4" />
            Adicionar ponto
          </Button>
        </section>

        <Field label="Conclusão" htmlFor="study-conclusion">
          <Textarea
            id="study-conclusion"
            placeholder="Como você vai encerrar? Resumo, apelo, oração…"
            value={draft.conclusion}
            onChange={(e) => update({ conclusion: e.target.value })}
            className={cn(autoGrow, 'text-base')}
          />
        </Field>
      </div>

      <ReferenceDialog
        open={referenceOpen}
        onOpenChange={setReferenceOpen}
        onAdd={(ref) => update((d) => ({ references: [...d.references, ref] }))}
      />
    </div>
  );
};

const Field: React.FC<{ label: string; htmlFor: string; children: React.ReactNode }> = ({ label, htmlFor, children }) => (
  <div className="space-y-3">
    <Label htmlFor={htmlFor} className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
    </Label>
    {children}
  </div>
);

const timeFormat = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

const SaveIndicator: React.FC<{ status: SaveStatus; savedAt: Date | null; hasTitle: boolean; onRetry: () => void }> = ({
  status,
  savedAt,
  hasTitle,
  onRetry,
}) => {
  const content = (() => {
    if (status === 'saving') return <><Loader2 className="h-4 w-4 animate-spin" /> Salvando…</>;
    if (status === 'error')
      return (
        <>
          <CloudOff className="h-4 w-4 text-destructive" />
          <span className="text-destructive">Não foi possível salvar.</span>
          <button type="button" onClick={onRetry} className="font-medium text-foreground underline underline-offset-2">
            Tentar novamente
          </button>
        </>
      );
    if (status === 'unsaved') return hasTitle ? <>Alterações não salvas</> : <>Rascunho não salvo</>;
    if (status === 'saved' && savedAt) return <><Check className="h-4 w-4 text-primary" /> Salvo às {timeFormat.format(savedAt)}</>;
    return null;
  })();

  return (
    <p role="status" aria-live="polite" className="flex min-w-0 items-center gap-1.5 truncate text-sm text-muted-foreground">
      {content}
    </p>
  );
};

const PassageCard: React.FC<{
  reference: StudyReference;
  onRemove: () => void;
  onInsert: (text: string) => void;
}> = ({ reference, onRemove, onInsert }) => {
  const [expanded, setExpanded] = React.useState(false);
  const passage = useQuery({
    queryKey: ['bible', 'passage', reference.book, reference.chapter, reference.verse_start, reference.verse_end],
    queryFn: () => fetchPassageText(reference),
    staleTime: Infinity,
  });
  const plain = passage.data?.map((v) => v.text).join(' ') ?? '';

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-foreground">{formatReference(reference)}</p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" disabled={!plain} onClick={() => onInsert(plain)}>
            <Quote className="h-4 w-4" />
            <span className="hidden sm:inline">Inserir na introdução</span>
            <span className="sm:hidden">Inserir</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onRemove} aria-label={`Remover ${formatReference(reference)}`}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className={cn('mt-2 font-crimson text-[17px] leading-relaxed text-foreground/90', !expanded && 'line-clamp-3')}>
        {passage.isLoading && <Skeleton className="h-3.5 w-full" />}
        {passage.isError && <span className="font-inter text-sm text-muted-foreground">Não foi possível carregar o texto.</span>}
        {passage.data?.map((v) => (
          <span key={v.verse}>
            <sup className="mr-1 font-inter text-[0.65em] font-semibold text-primary">{v.verse}</sup>
            {v.text}{' '}
          </span>
        ))}
      </div>
      {passage.data && passage.data.length > 2 && (
        <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1 text-sm font-medium text-primary hover:underline">
          {expanded ? 'Mostrar menos' : 'Ver passagem inteira'}
        </button>
      )}
    </div>
  );
};

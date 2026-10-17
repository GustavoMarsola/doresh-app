import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileDown, Minus, MoreHorizontal, Pencil, Plus, BookOpenText, Trash2, X } from 'lucide-react';
import { AiBadge } from '@/components/studies/AiBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteStudyDialog } from '@/components/studies/DeleteStudyDialog';
import {
  StudyNotFoundError,
  exportStudyToPDF,
  fetchPassageText,
  formatReference,
  useStudy,
  type Study,
  type StudyReference,
} from '@/lib/studies';
import { cn } from '@/lib/utils';

const dateFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

const READING_SIZES = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
const READING_SIZE_KEY = 'doresh:reading-mode-font-size';

export const StudyView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const studyQuery = useStudy(id);
  const [reading, setReading] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  if (studyQuery.error instanceof StudyNotFoundError) {
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

  if (studyQuery.isError) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-lg font-semibold">Não foi possível abrir o estudo.</p>
        <p className="mt-1 text-muted-foreground">Verifique sua conexão e tente novamente.</p>
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
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="mt-8 h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl pb-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Button variant="ghost" asChild className="-ml-3 gap-1.5 text-muted-foreground">
          <Link to="/estudos">
            <ArrowLeft className="h-4 w-4" />
            Meus estudos
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to={`/estudos/${study.id}/editar`}>
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Mais ações">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={() => exportStudyToPDF(study)}>
                <FileDown className="h-4 w-4" />
                Baixar PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setDeleting(true)} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4" />
                Excluir estudo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <header className="space-y-3 border-b border-border pb-6">
        {study.ai_generated && <AiBadge />}
        <h1 className="font-crimson text-3xl font-semibold leading-tight text-foreground md:text-[2.75rem]">{study.title}</h1>
        {study.references.length > 0 && (
          <p className="font-medium text-primary">{study.references.map(formatReference).join(' · ')}</p>
        )}
        <p className="text-sm text-muted-foreground">Editado em {dateFormat.format(new Date(study.updated_at))}</p>
        <Button size="lg" className="mt-2" onClick={() => setReading(true)}>
          <BookOpenText className="h-5 w-5" />
          Modo leitura
        </Button>
      </header>

      <StudyBody study={study} />

      {reading && <ReadingMode study={study} onClose={() => setReading(false)} />}

      <DeleteStudyDialog
        study={deleting ? study : null}
        onOpenChange={(open) => !open && setDeleting(false)}
        onDeleted={() => navigate('/estudos', { replace: true })}
      />
    </article>
  );
};

const StudyBody: React.FC<{ study: Study; large?: boolean }> = ({ study, large = false }) => {
  const body = cn('whitespace-pre-wrap leading-relaxed text-foreground', large ? 'text-[1em]' : 'text-[17px]');
  const heading = cn('font-semibold text-foreground', large ? 'mb-3 font-crimson text-[1.25em]' : 'mb-2 text-sm uppercase tracking-wide text-muted-foreground');
  const empty = !study.introduction.trim() && !study.conclusion.trim() && study.sections.length === 0;

  return (
    <div className="space-y-10 pt-8">
      {study.references.map((ref, i) => (
        <PassageBlock key={i} reference={ref} large={large} />
      ))}

      {empty && <p className="text-muted-foreground">Este estudo ainda não tem conteúdo.</p>}

      {study.introduction.trim() && (
        <section>
          <h2 className={heading}>Introdução</h2>
          <p className={body}>{study.introduction}</p>
        </section>
      )}

      {study.sections.length > 0 && (
        <section className="space-y-8">
          {!large && <h2 className={heading}>Desenvolvimento</h2>}
          <ol className="space-y-8">
            {study.sections.map((section, i) => (
              <li key={section.id ?? i} className="flex gap-4">
                <span className={cn('flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary', large ? 'h-[1.6em] w-[1.6em] text-[0.8em]' : 'h-8 w-8 text-sm')}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  {section.title?.trim() && <h3 className={cn('font-semibold text-foreground', large ? 'mb-2 font-crimson text-[1.2em]' : 'mb-1.5 text-lg')}>{section.title}</h3>}
                  <p className={body}>{section.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {study.conclusion.trim() && (
        <section>
          <h2 className={heading}>Conclusão</h2>
          <p className={body}>{study.conclusion}</p>
        </section>
      )}
    </div>
  );
};

const PassageBlock: React.FC<{ reference: StudyReference; large: boolean }> = ({ reference, large }) => {
  const passage = useQuery({
    queryKey: ['bible', 'passage', reference.book, reference.chapter, reference.verse_start, reference.verse_end],
    queryFn: () => fetchPassageText(reference),
    staleTime: Infinity,
  });

  return (
    <figure className={cn('rounded-2xl bg-muted/50 p-5 md:p-6', large && 'bg-muted/40')}>
      <blockquote className={cn('font-crimson leading-relaxed text-foreground', large ? 'text-[1.05em]' : 'text-[19px]')}>
        {passage.isLoading && <Skeleton className="h-4 w-full" />}
        {passage.isError && <span className="font-inter text-sm text-muted-foreground">Não foi possível carregar o texto bíblico.</span>}
        {passage.data?.map((v) => (
          <span key={v.verse}>
            <sup className="mr-1 font-inter text-[0.6em] font-semibold text-primary">{v.verse}</sup>
            {v.text}{' '}
          </span>
        ))}
      </blockquote>
      <figcaption className={cn('mt-3 font-semibold text-primary', large ? 'text-[0.75em]' : 'text-sm')}>
        {formatReference(reference)} · ARA
      </figcaption>
    </figure>
  );
};

const ReadingMode: React.FC<{ study: Study; onClose: () => void }> = ({ study, onClose }) => {
  const [size, setSize] = React.useState(() => {
    try {
      const saved = Number(localStorage.getItem(READING_SIZE_KEY));
      return Number.isInteger(saved) && saved >= 0 && saved < READING_SIZES.length ? saved : 1;
    } catch {
      return 1;
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(READING_SIZE_KEY, String(size));
    } catch {
      /* ignora */
    }
  }, [size]);

  // Mantém a tela ligada e trava a rolagem do fundo durante a leitura
  React.useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock?.request('screen').then((l) => (lock = l)).catch(() => undefined);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      lock?.release().catch(() => undefined);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={`Modo leitura: ${study.title}`} className="fixed inset-0 z-[60] overflow-y-auto bg-background">
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background/95 px-3 py-2 backdrop-blur md:px-6">
        <Button variant="ghost" onClick={onClose} className="gap-1.5">
          <X className="h-5 w-5" />
          Sair
        </Button>
        <p className="min-w-0 flex-1 truncate text-center text-sm font-medium text-muted-foreground">{study.title}</p>
        <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => setSize((s) => Math.max(0, s - 1))} disabled={size === 0} aria-label="Diminuir texto">
          <Minus className="h-5 w-5" />
        </Button>
        <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => setSize((s) => Math.min(READING_SIZES.length - 1, s + 1))} disabled={size === READING_SIZES.length - 1} aria-label="Aumentar texto">
          <Plus className="h-5 w-5" />
        </Button>
      </div>
      <div className={cn('mx-auto max-w-3xl px-5 pb-24 pt-6 md:px-8', READING_SIZES[size])}>
        <h1 className="font-crimson text-[1.6em] font-semibold leading-tight text-foreground">{study.title}</h1>
        <StudyBody study={study} large />
      </div>
    </div>
  );
};

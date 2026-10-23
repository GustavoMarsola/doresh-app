import React from 'react';
import { Link } from 'react-router-dom';
import { Highlighter, MessageSquare, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatReference, normalizeBookName } from '@/data/bibleCanon';
import { bookName, commentVerses, groupHighlights, useAnnotations } from '@/lib/annotations';
import type { StudyReference } from '@/lib/studies';
import { cn } from '@/lib/utils';

/** O que uma anotação acrescenta ao estudo: sempre a passagem; um comentário vira também um ponto. */
export interface AnnotationImport {
  reference: StudyReference;
  section?: { title: string; text: string };
}

/** Estudo novo já preenchido, passado em `navigate('/estudos/novo', { state: { prefill } })`. */
export interface StudyPrefill {
  title: string;
  items: AnnotationImport[];
}

interface AnnotationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (items: AnnotationImport[]) => void;
}

interface Item {
  id: string;
  kind: 'highlight' | 'comment';
  label: string;
  text: string;
  color?: string;
  import: AnnotationImport;
}

const highlightColor: Record<string, string> = {
  yellow: 'border-yellow-400',
  blue: 'border-blue-400',
  red: 'border-red-500',
};

export const AnnotationsDialog: React.FC<AnnotationsDialogProps> = ({ open, onOpenChange, onImport }) => {
  const annotations = useAnnotations(open);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setSelected(new Set());
      setQuery('');
    }
  }, [open]);

  const items = React.useMemo<Item[]>(() => {
    if (!annotations.data) return [];
    const highlights: Item[] = groupHighlights(annotations.data.highlights).map((g) => ({
      id: `h-${g.key}`,
      kind: 'highlight',
      label: formatReference(g.bookName, g.chapter, g.verses),
      text: g.texts.filter(Boolean).join(' '),
      color: g.color,
      import: {
        reference: { book: g.bookName, chapter: g.chapter, verse_start: g.verses[0], verse_end: g.verses[g.verses.length - 1] },
      },
    }));
    const comments: Item[] = annotations.data.comments.map((c) => {
      const label = formatReference(bookName(c.book), c.chapter, commentVerses(c));
      return {
        id: `c-${c.id}`,
        kind: 'comment',
        label,
        text: c.comment,
        import: {
          reference: { book: bookName(c.book), chapter: c.chapter, verse_start: c.verse_start, verse_end: c.verse_end },
          section: { title: label, text: c.comment },
        },
      };
    });
    return [...highlights, ...comments];
  }, [annotations.data]);

  const visible = React.useMemo(() => {
    const q = normalizeBookName(query);
    if (!q) return items;
    return items.filter((item) => normalizeBookName(`${item.label} ${item.text}`).includes(q));
  }, [items, query]);

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const confirm = () => {
    onImport(items.filter((item) => selected.has(item.id)).map((item) => item.import));
    onOpenChange(false);
  };

  const highlights = visible.filter((i) => i.kind === 'highlight');
  const comments = visible.filter((i) => i.kind === 'comment');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-4 rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Minhas anotações</DialogTitle>
          <DialogDescription>
            Escolha destaques e comentários para trazer ao estudo. As passagens entram no texto base e cada comentário
            vira um ponto do desenvolvimento.
          </DialogDescription>
        </DialogHeader>

        {items.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filtrar por livro ou texto"
              aria-label="Filtrar anotações"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        <div className="-mx-6 min-h-0 flex-1 overflow-y-auto px-6">
          {annotations.isLoading ? (
            <div className="space-y-3" aria-busy="true">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : annotations.isError ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <p>Não foi possível carregar suas anotações.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => annotations.refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <p>Você ainda não tem destaques nem comentários.</p>
              <p className="mt-1">
                Marque versículos ou comente passagens na{' '}
                <Link to="/ler" className="font-medium text-primary hover:underline">
                  leitura da Bíblia
                </Link>{' '}
                e eles aparecem aqui.
              </p>
            </div>
          ) : visible.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma anotação encontrada para “{query}”.</p>
          ) : (
            <div className="space-y-5 pb-1">
              <ItemGroup title="Destaques" icon={<Highlighter className="h-4 w-4" />} items={highlights} selected={selected} onToggle={toggle} />
              <ItemGroup title="Comentários" icon={<MessageSquare className="h-4 w-4" />} items={comments} selected={selected} onToggle={toggle} />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={confirm} disabled={selected.size === 0}>
            {selected.size === 0
              ? 'Adicionar ao estudo'
              : `Adicionar ${selected.size} ${selected.size === 1 ? 'anotação' : 'anotações'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ItemGroup: React.FC<{
  title: string;
  icon: React.ReactNode;
  items: Item[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}> = ({ title, icon, items, selected, onToggle }) => {
  if (items.length === 0) return null;
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item) => {
          const checked = selected.has(item.id);
          return (
            <li key={item.id}>
              <label
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/60',
                  checked && 'border-primary bg-primary/5',
                )}
              >
                <Checkbox checked={checked} onCheckedChange={() => onToggle(item.id)} className="mt-0.5" />
                <span className={cn('min-w-0 flex-1', item.color && cn('border-l-4 pl-2', highlightColor[item.color] ?? 'border-primary'))}>
                  <span className="block text-sm font-semibold text-foreground">{item.label}</span>
                  {item.text && (
                    <span
                      className={cn(
                        'mt-0.5 line-clamp-2 block text-foreground/80',
                        item.kind === 'highlight' ? 'font-crimson text-[16px] leading-snug' : 'text-sm',
                      )}
                    >
                      {item.text}
                    </span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

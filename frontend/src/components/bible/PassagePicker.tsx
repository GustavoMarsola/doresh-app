import React from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  BIBLE_BOOKS,
  BIBLE_VERSIONS,
  type BibleVersion,
  type Testament,
  findBook,
  normalizeBookName,
} from '@/data/bibleCanon';
import { cn } from '@/lib/utils';

interface PassagePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: string;
  chapter: number;
  version: BibleVersion;
  onVersionChange: (version: BibleVersion) => void;
  onSelect: (book: string, chapter: number) => void;
}

const Segmented: React.FC<{
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}> = ({ label, options, value, onChange }) => (
  <div role="radiogroup" aria-label={label} className="flex gap-0.5 rounded-lg bg-muted p-[3px]">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        role="radio"
        aria-checked={value === option.value}
        onClick={() => onChange(option.value)}
        className={cn(
          'h-9 flex-1 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          value === option.value ? 'bg-card font-semibold text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export const PassagePicker: React.FC<PassagePickerProps> = ({
  open,
  onOpenChange,
  book,
  chapter,
  version,
  onVersionChange,
  onSelect,
}) => {
  const [query, setQuery] = React.useState('');
  const [testament, setTestament] = React.useState<Testament>(findBook(book)?.testament ?? 'NT');
  const [expanded, setExpanded] = React.useState<string | null>(book);
  const currentRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setQuery('');
    setExpanded(book);
    setTestament(findBook(book)?.testament ?? 'NT');
    const id = window.setTimeout(() => currentRef.current?.scrollIntoView({ block: 'center' }), 50);
    return () => window.clearTimeout(id);
  }, [open, book]);

  const normalizedQuery = normalizeBookName(query);
  const books = normalizedQuery
    ? BIBLE_BOOKS.filter((b) => normalizeBookName(b.name).includes(normalizedQuery))
    : BIBLE_BOOKS.filter((b) => b.testament === testament);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex h-[100dvh] max-w-none flex-col gap-0 overflow-hidden rounded-none p-0',
          'left-0 top-0 translate-x-0 translate-y-0',
          'sm:left-[50%] sm:top-[50%] sm:h-[min(720px,85vh)] sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl',
        )}
      >
        <DialogHeader className="space-y-4 border-b border-border bg-card p-4 text-left">
          <DialogTitle className="text-xl">Escolher passagem</DialogTitle>
          <DialogDescription className="sr-only">Escolha a versão, o livro e o capítulo para ler.</DialogDescription>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Versão</span>
            <Segmented
              label="Versão"
              value={version}
              onChange={(v) => onVersionChange(v as BibleVersion)}
              options={BIBLE_VERSIONS.map((v) => ({ value: v, label: v }))}
            />
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Buscar livro"
              placeholder="Buscar livro"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 rounded-xl bg-background pl-10 text-base"
            />
          </div>

          {!normalizedQuery && (
            <Segmented
              label="Testamento"
              value={testament}
              onChange={(v) => setTestament(v as Testament)}
              options={[
                { value: 'AT', label: 'Antigo Testamento' },
                { value: 'NT', label: 'Novo Testamento' },
              ]}
            />
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {books.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">Nenhum livro encontrado para “{query}”.</p>
          )}

          {books.map((b) => {
            const isOpen = expanded === b.name;
            const isCurrent = b.name === book;
            return (
              <div key={b.name} ref={isCurrent ? currentRef : undefined} className="border-b border-border">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setExpanded(isOpen ? null : b.name)}
                  className={cn(
                    'flex min-h-[52px] w-full items-center justify-between px-1 text-left text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isCurrent ? 'font-semibold text-primary' : 'font-medium text-foreground',
                  )}
                >
                  {b.name}
                  <span className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                    {!isOpen && `${b.chapters} cap.`}
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </button>

                {isOpen && (
                  <div className="grid grid-cols-6 gap-2 pb-4">
                    {Array.from({ length: b.chapters }, (_, i) => i + 1).map((n) => {
                      const active = isCurrent && n === chapter;
                      return (
                        <button
                          key={n}
                          type="button"
                          aria-current={active ? 'true' : undefined}
                          aria-label={`${b.name} ${n}`}
                          onClick={() => onSelect(b.name, n)}
                          className={cn(
                            'h-12 rounded-lg border text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            active
                              ? 'border-primary bg-primary font-semibold text-primary-foreground'
                              : 'border-border bg-card text-foreground hover:border-primary hover:text-primary',
                          )}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

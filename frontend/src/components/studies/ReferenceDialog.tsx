import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BIBLE_BOOKS, findBook } from '@/data/bibleCanon';
import { fetchPassageText, formatReference, type StudyReference } from '@/lib/studies';

interface ReferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (reference: StudyReference) => void;
}

const parseVerse = (value: string) => {
  const n = Number(value);
  return value.trim() && Number.isInteger(n) && n > 0 ? n : null;
};

export const ReferenceDialog: React.FC<ReferenceDialogProps> = ({ open, onOpenChange, onAdd }) => {
  const [book, setBook] = React.useState('João');
  const [chapter, setChapter] = React.useState(3);
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setFrom('');
      setTo('');
    }
  }, [open]);

  const chapters = findBook(book)?.chapters ?? 1;
  const verseStart = parseVerse(from);
  const verseEnd = parseVerse(to);
  const rangeError = verseStart && verseEnd && verseEnd < verseStart ? 'O versículo final deve vir depois do inicial.' : null;

  const reference: StudyReference = {
    book,
    chapter,
    verse_start: verseStart,
    verse_end: verseStart ? verseEnd ?? null : null,
  };

  const preview = useQuery({
    queryKey: ['bible', 'passage', book, chapter, verseStart, verseEnd],
    queryFn: () => fetchPassageText(reference),
    enabled: open && !rangeError,
    staleTime: Infinity,
  });

  const outOfRange = preview.isSuccess && preview.data.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar passagem</DialogTitle>
          <DialogDescription>Escolha o texto bíblico em que o estudo se baseia.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-[1fr_6.5rem] gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ref-book">Livro</Label>
            <Select
              value={book}
              onValueChange={(value) => {
                setBook(value);
                setChapter(1);
              }}
            >
              <SelectTrigger id="ref-book">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectGroup>
                  <SelectLabel>Antigo Testamento</SelectLabel>
                  {BIBLE_BOOKS.filter((b) => b.testament === 'AT').map((b) => (
                    <SelectItem key={b.name} value={b.name}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Novo Testamento</SelectLabel>
                  {BIBLE_BOOKS.filter((b) => b.testament === 'NT').map((b) => (
                    <SelectItem key={b.name} value={b.name}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ref-chapter">Capítulo</Label>
            <Select value={String(chapter)} onValueChange={(value) => setChapter(Number(value))}>
              <SelectTrigger id="ref-chapter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {Array.from({ length: chapters }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <fieldset className="space-y-1.5">
          <legend className="text-sm font-medium">
            Versículos <span className="font-normal text-muted-foreground">(opcional — vazio para o capítulo inteiro)</span>
          </legend>
          <div className="flex items-center gap-2">
            <Input aria-label="Do versículo" inputMode="numeric" placeholder="De" value={from} onChange={(e) => setFrom(e.target.value)} className="w-24" />
            <span className="text-muted-foreground">até</span>
            <Input aria-label="Até o versículo" inputMode="numeric" placeholder="Até" value={to} onChange={(e) => setTo(e.target.value)} className="w-24" disabled={!verseStart} />
          </div>
          {rangeError && <p className="text-sm text-destructive">{rangeError}</p>}
        </fieldset>

        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{formatReference(reference)} · ARA</p>
          <div className="max-h-44 overflow-y-auto pr-1 font-crimson text-[17px] leading-relaxed text-foreground">
            {preview.isLoading && (
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-11/12" />
                <Skeleton className="h-3.5 w-2/3" />
              </div>
            )}
            {preview.isError && <p className="font-inter text-sm text-muted-foreground">Não foi possível carregar o texto agora.</p>}
            {outOfRange && <p className="font-inter text-sm text-destructive">Este capítulo não tem esses versículos.</p>}
            {preview.data?.map((v) => (
              <span key={v.verse}>
                <sup className="mr-1 font-inter text-[0.65em] font-semibold text-primary">{v.verse}</sup>
                {v.text}{' '}
              </span>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!!rangeError || outOfRange}
            onClick={() => {
              onAdd(reference);
              onOpenChange(false);
            }}
          >
            Adicionar passagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

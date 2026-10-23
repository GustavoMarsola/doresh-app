import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { BIBLE_BOOKS } from '@/data/bibleCanon';
import { countReadingDays, type Rhythm, type Weekday } from '@/lib/readingPlans';
import { WeekdayPicker } from '@/components/plans/WeekdayPicker';

const DURATION_PRESETS = [30, 91, 182, 365, 547, 730, 1095];

const durationLabel = (days: number) => {
  const named: Record<number, string> = {
    30: '1 mês', 91: '3 meses', 182: '6 meses', 365: '1 ano', 547: '18 meses', 730: '2 anos', 1095: '3 anos',
  };
  if (named[days]) return named[days];
  if (days % 7 === 0) return `${days / 7} semanas`;
  return `${days} dias`;
};

/** Duração padrão de "Um livro" no frontend, igual à do backend: ~1 capítulo por dia, mínimo 1 semana. */
const bookDefaultDays = (book: string) => Math.max(7, BIBLE_BOOKS.find((b) => b.name === book)?.chapters ?? 7);

export interface RhythmSubmit extends Rhythm {
  book?: string;
}

interface PlanRhythmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  submitLabel: string;
  /** Valores iniciais; `defaultDays` marca a opção "(padrão)". */
  initial: Rhythm;
  defaultDays: number | null;
  needsBook?: boolean;
  pending: boolean;
  error: string | null;
  onSubmit: (value: RhythmSubmit) => void;
}

export const PlanRhythmDialog: React.FC<PlanRhythmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  initial,
  defaultDays,
  needsBook = false,
  pending,
  error,
  onSubmit,
}) => {
  const [book, setBook] = React.useState('Romanos');
  const [startDate, setStartDate] = React.useState(initial.start_date);
  const [totalDays, setTotalDays] = React.useState(initial.total_days);
  const [weekdays, setWeekdays] = React.useState<Weekday[]>(initial.weekdays);
  const [touchedDuration, setTouchedDuration] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setStartDate(initial.start_date);
    setTotalDays(initial.total_days);
    setWeekdays(initial.weekdays);
    setTouchedDuration(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Num plano de um livro, a duração padrão acompanha o livro até a pessoa escolher outra
  const planDefault = needsBook ? bookDefaultDays(book) : defaultDays;
  React.useEffect(() => {
    if (open && needsBook && !touchedDuration) setTotalDays(bookDefaultDays(book));
  }, [book, needsBook, open, touchedDuration]);

  const options = Array.from(new Set([...DURATION_PRESETS, totalDays, ...(planDefault ? [planDefault] : [])])).sort((a, b) => a - b);
  const readingDays = startDate ? countReadingDays(startDate, totalDays, weekdays) : 0;
  const localError = !startDate ? 'Escolha a data de início.' : weekdays.length === 0 ? 'Escolha pelo menos um dia da semana.' : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localError) return;
    onSubmit({ start_date: startDate, total_days: totalDays, weekdays, ...(needsBook ? { book } : {}) });
  };

  const shownError = localError ?? error;

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          {needsBook && (
            <div className="space-y-2">
              <Label htmlFor="plan-book">Livro</Label>
              <Select value={book} onValueChange={setBook}>
                <SelectTrigger id="plan-book">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {(['AT', 'NT'] as const).map((testament) => (
                    <SelectGroup key={testament}>
                      <SelectLabel>{testament === 'AT' ? 'Antigo Testamento' : 'Novo Testamento'}</SelectLabel>
                      {BIBLE_BOOKS.filter((b) => b.testament === testament).map((b) => (
                        <SelectItem key={b.name} value={b.name}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="plan-start">Começar em</Label>
              <Input
                id="plan-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-duration">Duração</Label>
              <Select
                value={String(totalDays)}
                onValueChange={(v) => {
                  setTouchedDuration(true);
                  setTotalDays(Number(v));
                }}
              >
                <SelectTrigger id="plan-duration" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((days) => (
                    <SelectItem key={days} value={String(days)}>
                      {durationLabel(days)}
                      {days === planDefault ? ' (padrão)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <WeekdayPicker value={weekdays} onChange={setWeekdays} />

          <p className="rounded-xl bg-muted/60 px-4 py-3 text-sm text-foreground" aria-live="polite">
            {readingDays > 0 ? (
              <>
                <strong>{readingDays}</strong> {readingDays === 1 ? 'dia de leitura' : 'dias de leitura'}. Se atrasar, o
                plano espera por você: o que já leu nunca se perde.
              </>
            ) : (
              'Nenhum dia de leitura com esta combinação.'
            )}
          </p>

          {shownError && (
            <p role="alert" className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" /> {shownError}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending || !!localError || readingDays === 0}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

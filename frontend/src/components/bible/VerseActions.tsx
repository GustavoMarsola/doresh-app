import React from 'react';
import { Copy, Loader2, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DoveIcon } from '@/components/ui/dove-icon';
import { cn } from '@/lib/utils';

export type HighlightColor = 'yellow' | 'blue' | 'red';

const HIGHLIGHT_OPTIONS: { value: HighlightColor; label: string; swatch: string }[] = [
  { value: 'yellow', label: 'Amarelo', swatch: 'bg-[#F2CF5B]' },
  { value: 'blue', label: 'Azul', swatch: 'bg-[#7FAEE6]' },
  { value: 'red', label: 'Rosa', swatch: 'bg-[#E79A9A]' },
];

interface VerseActionsProps {
  reference: string;
  count: number;
  onClose: () => void;
  onHighlight: (color: HighlightColor) => void;
  onCopy: () => void;
  /** Omitido quando o Ruach está desligado. */
  onAskRuach?: () => void;
  onSaveComment: (comment: string) => void;
  savingComment: boolean;
}

export const VerseActions: React.FC<VerseActionsProps> = ({
  reference,
  count,
  onClose,
  onHighlight,
  onCopy,
  onAskRuach,
  onSaveComment,
  savingComment,
}) => {
  const [commenting, setCommenting] = React.useState(false);
  const [comment, setComment] = React.useState('');

  const save = () => {
    if (!comment.trim()) return;
    // O painel fecha quando o comentário for salvo; em caso de erro o texto continua aqui.
    onSaveComment(comment.trim());
  };

  return (
    <section
      aria-label={`Ações para ${reference}`}
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 flex flex-col gap-4 rounded-t-2xl border-t border-border bg-card px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-12px_32px_rgba(0,0,0,0.12)] max-md:animate-in max-md:slide-in-from-bottom-4',
        'md:inset-x-auto md:bottom-6 md:left-[calc(50%+var(--sidebar-w,16rem)/2)] md:w-[min(720px,calc(100vw-var(--sidebar-w,16rem)-4rem))] md:-translate-x-1/2 md:rounded-2xl md:border md:p-4 md:shadow-xl',
      )}
    >
      <div className="mx-auto h-1 w-10 rounded-full bg-border md:hidden" aria-hidden="true" />

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-foreground md:text-[15px]">{reference}</p>
          <p className="text-[13px] text-muted-foreground">
            {count} {count === 1 ? 'versículo selecionado' : 'versículos selecionados'}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full bg-muted md:h-10 md:w-10 md:bg-transparent" onClick={onClose} aria-label="Limpar seleção">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
        <span className="text-[13px] font-semibold text-muted-foreground md:mr-1">Grifar</span>
        <div className="flex gap-2">
          {HIGHLIGHT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onHighlight(option.value)}
              className="flex h-16 flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-card text-[13px] font-medium text-foreground transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-10 md:flex-none md:flex-row md:gap-2 md:rounded-lg md:px-3 md:text-sm"
            >
              <span className={cn('h-5 w-5 rounded-full border border-black/10 md:h-4 md:w-4', option.swatch)} aria-hidden="true" />
              {option.label}
            </button>
          ))}
        </div>

        <span className="mx-1.5 hidden h-6 w-px bg-border md:block" aria-hidden="true" />

        <div className="mt-2 flex gap-2 md:mt-0">
          <ActionButton onClick={() => setCommenting((v) => !v)} pressed={commenting}>
            <MessageSquare className="h-5 w-5 md:h-4 md:w-4" />
            Comentar
          </ActionButton>
          <ActionButton onClick={onCopy}>
            <Copy className="h-5 w-5 md:h-4 md:w-4" />
            Copiar
          </ActionButton>
          {onAskRuach && (
            <ActionButton onClick={onAskRuach} tone="accent">
              <DoveIcon size="sm" className="h-5 w-5 md:h-4 md:w-4" />
              Perguntar ao Ruach
            </ActionButton>
          )}
        </div>
      </div>

      {commenting && (
        <div className="flex flex-col gap-2 border-t border-border pt-3.5">
          <Label htmlFor="verse-comment" className="text-[13px] font-semibold">
            Seu comentário
          </Label>
          <Textarea
            id="verse-comment"
            autoFocus
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="O que esta passagem fala com você?"
            className="resize-y text-[15px]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCommenting(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={!comment.trim() || savingComment}>
              {savingComment && <Loader2 className="h-4 w-4 animate-spin" />}
              {savingComment ? 'Salvando…' : 'Salvar comentário'}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};

const ActionButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  pressed?: boolean;
  tone?: 'default' | 'accent';
}> = ({ onClick, children, pressed, tone = 'default' }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={pressed}
    className={cn(
      'flex h-[68px] flex-1 flex-col items-center justify-center gap-1.5 rounded-xl text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      'md:h-10 md:flex-none md:flex-row md:gap-2 md:rounded-lg md:px-3 md:text-sm',
      tone === 'accent'
        ? 'bg-accent/10 text-accent hover:bg-accent/15 dark:bg-accent/30 dark:text-[hsl(213_85%_70%)]'
        : 'bg-muted text-foreground hover:bg-muted/70 md:bg-transparent md:hover:bg-muted',
      pressed && 'bg-primary/10 text-primary md:bg-primary/10',
    )}
  >
    {children}
  </button>
);

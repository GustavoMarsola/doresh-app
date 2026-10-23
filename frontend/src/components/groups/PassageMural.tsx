import React from 'react';
import { CornerDownRight, EyeOff, Flag, Highlighter, Loader2, MessageSquare, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { formatReference } from '@/data/bibleCanon';
import { useToast } from '@/hooks/use-toast';
import { bookName } from '@/lib/annotations';
import {
  groupErrorMessage,
  useDayMural,
  useDeleteReply,
  useReplyToShare,
  useReportShare,
  useSetShareHidden,
  useUnshareAnnotation,
  type GroupDetail,
  type Share,
  type ShareAuthor,
} from '@/lib/readingGroups';
import { cn } from '@/lib/utils';

const highlightBorder: Record<string, string> = {
  yellow: 'border-yellow-400',
  blue: 'border-blue-400',
  red: 'border-red-500',
};

const verses = (s: { verse_start: number; verse_end: number }) =>
  Array.from({ length: s.verse_end - s.verse_start + 1 }, (_, i) => s.verse_start + i);

const authorLabel = (a: ShareAuthor) => (a.is_me ? 'Você' : a.name ?? (a.role === 'leader' ? 'Líder' : 'Participante'));

/** Mural da passagem: anotações partilhadas pelos membros, presas aos versículos do dia. */
export const PassageMural: React.FC<{ group: GroupDetail; day: number }> = ({ group, day }) => {
  const mural = useDayMural(group.id, day);

  if (mural.isLoading) {
    return (
      <div className="space-y-2" aria-busy="true">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }
  if (mural.isError) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm">
        <p className="font-medium text-foreground">Não foi possível carregar o mural.</p>
        <Button className="mt-3" variant="outline" size="sm" onClick={() => mural.refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }
  if (!mural.data?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        <p>Ninguém compartilhou uma anotação deste trecho ainda.</p>
        <p className="mt-1">Nas suas anotações abaixo, escolha “Compartilhar com o grupo” para o que quiser mostrar aos outros.</p>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {mural.data.map((share) => (
        <ShareCard key={share.id} group={group} day={day} share={share} />
      ))}
    </ul>
  );
};

const ShareCard: React.FC<{ group: GroupDetail; day: number; share: Share }> = ({ group, day, share }) => {
  const { toast } = useToast();
  const isLeader = group.role === 'leader';
  const reply = useReplyToShare(group.id, day);
  const deleteReply = useDeleteReply(group.id, day);
  const setHidden = useSetShareHidden(group.id, day);
  const report = useReportShare(group.id, day);
  const unshare = useUnshareAnnotation();
  const [replying, setReplying] = React.useState(false);
  const [text, setText] = React.useState('');

  const fail = (title: string) => (error: unknown) => toast({ title, description: groupErrorMessage(error), variant: 'destructive' });
  const reference = formatReference(bookName(share.book), share.chapter, verses(share));

  const sendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    reply.mutate(
      { shareId: share.id, text: text.trim() },
      { onSuccess: () => { setText(''); setReplying(false); }, onError: fail('Não foi possível responder') },
    );
  };

  return (
    <li className={cn('rounded-xl border bg-card p-4', share.kind === 'highlight' ? cn('border-l-4', highlightBorder[share.color ?? ''] ?? 'border-primary') : 'border-border', share.hidden && 'opacity-60')}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {share.kind === 'highlight' ? <Highlighter className="h-3.5 w-3.5 text-muted-foreground" /> : <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="font-semibold text-foreground">{reference}</span>
        <span className="text-muted-foreground">· {authorLabel(share.author)}</span>
        {share.hidden && <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">oculto pelo líder</span>}
        {isLeader && share.reports > 0 && (
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
            {share.reports} {share.reports === 1 ? 'denúncia' : 'denúncias'}
          </span>
        )}
      </div>
      {share.kind === 'highlight' ? (
        <p className="mt-1 text-sm text-muted-foreground">Destacou este trecho.</p>
      ) : (
        <p className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-foreground">{share.text}</p>
      )}

      {share.replies.length > 0 && (
        <ul className="mt-3 space-y-2 border-l-2 border-border pl-3">
          {share.replies.map((r) => (
            <li key={r.id} className="text-sm">
              <p className="text-foreground">
                <span className="font-semibold">{authorLabel(r.author)}</span>
                <span className="text-muted-foreground"> · </span>
                <span className="whitespace-pre-line">{r.text}</span>
              </p>
              {(r.author.is_me || isLeader) && (
                <button
                  type="button"
                  className="mt-0.5 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => deleteReply.mutate({ shareId: share.id, replyId: r.id }, { onError: fail('Não foi possível remover a resposta') })}
                  disabled={deleteReply.isPending}
                >
                  Remover
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {replying ? (
        <form onSubmit={sendReply} className="mt-3 space-y-2">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={2000} autoFocus placeholder="Sua resposta" className="text-[15px]" />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={!text.trim() || reply.isPending}>
              {reply.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Responder
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setReplying(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => setReplying(true)}>
            <CornerDownRight className="h-4 w-4" /> Responder
          </Button>
          {share.author.is_me && (
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => unshare.mutate({ groupId: group.id, shareId: share.id }, { onSuccess: () => toast({ title: 'Partilha desfeita', description: 'A anotação continua nas suas anotações.' }), onError: fail('Não foi possível desfazer') })}
              disabled={unshare.isPending}
            >
              <Trash2 className="h-4 w-4" /> Desfazer partilha
            </Button>
          )}
          {isLeader && (
            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setHidden.mutate({ shareId: share.id, hidden: !share.hidden }, { onError: fail('Não foi possível alterar') })} disabled={setHidden.isPending}>
              <EyeOff className="h-4 w-4" /> {share.hidden ? 'Mostrar de novo' : 'Ocultar'}
            </Button>
          )}
          {!share.author.is_me && (
            <Button
              size="sm"
              variant="ghost"
              className={cn('text-muted-foreground', share.reported_by_me && 'text-destructive')}
              onClick={() => !share.reported_by_me && report.mutate(share.id, { onSuccess: () => toast({ title: 'Denúncia enviada', description: 'O líder do grupo vai ver.' }), onError: fail('Não foi possível denunciar') })}
              disabled={report.isPending || share.reported_by_me}
            >
              <Flag className="h-4 w-4" /> {share.reported_by_me ? 'Denunciado' : 'Denunciar'}
            </Button>
          )}
        </div>
      )}
    </li>
  );
};

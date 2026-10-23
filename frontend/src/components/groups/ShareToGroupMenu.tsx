import React from 'react';
import { Check, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  findMyShare,
  groupErrorMessage,
  useMyGroups,
  useMyShares,
  useShareAnnotation,
  useUnshareAnnotation,
  type ShareInput,
} from '@/lib/readingGroups';
import { cn } from '@/lib/utils';

interface ShareToGroupMenuProps {
  input: ShareInput;
  /** Só este grupo (na página do grupo); sem isto, lista todos os meus grupos. */
  groupId?: string;
  size?: 'sm' | 'default';
  className?: string;
}

/**
 * "Compartilhar com o grupo": uma anotação minha (comentário ou destaque) entra no mural de
 * cada grupo escolhido; desmarcar desfaz. A anotação original continua privada.
 */
export const ShareToGroupMenu: React.FC<ShareToGroupMenuProps> = ({ input, groupId, size = 'sm', className }) => {
  const { toast } = useToast();
  const groups = useMyGroups();
  const mine = useMyShares();
  const share = useShareAnnotation();
  const unshare = useUnshareAnnotation();

  const candidates = (groups.data ?? []).filter((g) => !groupId || g.id === groupId);
  if (groups.isSuccess && candidates.length === 0) return null;

  const sharedIn = candidates.filter((g) => mine.data && findMyShare(mine.data, g.id, input));
  const pending = share.isPending || unshare.isPending;

  const toggle = (id: string) => {
    const existing = mine.data ? findMyShare(mine.data, id, input) : undefined;
    if (existing) {
      unshare.mutate(
        { groupId: id, shareId: existing.id },
        {
          onSuccess: () => toast({ title: 'Partilha desfeita', description: 'A anotação saiu do mural; continua nas suas anotações.' }),
          onError: (error) => toast({ title: 'Não foi possível desfazer', description: groupErrorMessage(error), variant: 'destructive' }),
        },
      );
    } else {
      share.mutate(
        { groupId: id, input },
        {
          onSuccess: () => toast({ title: 'Compartilhado com o grupo', description: 'Aparece no mural do dia, preso ao versículo.' }),
          onError: (error) => toast({ title: 'Não foi possível compartilhar', description: groupErrorMessage(error), variant: 'destructive' }),
        },
      );
    }
  };

  // Um grupo só: botão direto, sem menu
  if (candidates.length === 1) {
    const only = candidates[0];
    const shared = sharedIn.length > 0;
    return (
      <Button variant={shared ? 'secondary' : 'outline'} size={size} className={className} onClick={() => toggle(only.id)} disabled={pending || mine.isLoading} aria-pressed={shared}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : shared ? <Check className="h-4 w-4" /> : <Users className="h-4 w-4" />}
        {shared ? 'No mural do grupo' : 'Compartilhar com o grupo'}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={sharedIn.length ? 'secondary' : 'outline'} size={size} className={className} disabled={pending || mine.isLoading}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
          {sharedIn.length ? `No mural de ${sharedIn.length === 1 ? sharedIn[0].name : `${sharedIn.length} grupos`}` : 'Compartilhar com o grupo'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">Compartilhar com</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {candidates.map((g) => {
          const shared = sharedIn.some((s) => s.id === g.id);
          return (
            <DropdownMenuItem key={g.id} onSelect={(e) => { e.preventDefault(); toggle(g.id); }} className="gap-2">
              <span className={cn('flex h-4 w-4 items-center justify-center rounded border', shared ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>
                {shared && <Check className="h-3 w-3" />}
              </span>
              <span className="min-w-0 flex-1 truncate">{g.name}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

import React from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { isTokenExpired } from '@/components/auth/utils';
import { Layout } from '@/components/layout/layout';
import { ChatProvider } from '@/hooks/ChatContext';
import { useToast } from '@/hooks/use-toast';
import { CONSENT_TEXT, PENDING_INVITE_KEY, groupErrorMessage, useInvitePreview, useJoinGroup } from '@/lib/readingGroups';
import { PlanApiError, formatLongDate, formatPassages } from '@/lib/readingPlans';

/**
 * Entrada num grupo pelo link de convite. Quem ainda não está logado é levado ao login e volta
 * para cá depois (o token fica guardado no navegador até lá).
 */
export const JoinReadingGroup: React.FC = () => {
  const { token = '' } = useParams();
  const auth = localStorage.getItem('token');
  const loggedIn = !!auth && !isTokenExpired(auth);

  if (!loggedIn) {
    try {
      localStorage.setItem(PENDING_INVITE_KEY, token);
    } catch {
      /* sem armazenamento, a pessoa abre o link de novo depois do login */
    }
    return <Navigate to="/login" replace />;
  }

  return (
    <ChatProvider>
      <Layout showAssistant={false}>
        <JoinView token={token} />
      </Layout>
    </ChatProvider>
  );
};

const JoinView: React.FC<{ token: string }> = ({ token }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const preview = useInvitePreview(token);
  const join = useJoinGroup(token);
  const [showName, setShowName] = React.useState(false);
  const [consent, setConsent] = React.useState(false);

  if (preview.isError) {
    const code = preview.error instanceof PlanApiError ? preview.error.code : null;
    const known = code === 'reading_group.invite_invalid' || code === 'reading_group.invite_expired';
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-lg font-semibold">{known ? 'Convite indisponível' : 'Não foi possível abrir o convite.'}</p>
        <p className="mt-1 text-muted-foreground">{groupErrorMessage(preview.error)}</p>
        {known ? (
          <Button asChild className="mt-6" variant="outline">
            <Link to="/planos">Ir para os planos</Link>
          </Button>
        ) : (
          <Button className="mt-6" variant="outline" onClick={() => preview.refetch()}>
            Tentar novamente
          </Button>
        )}
      </div>
    );
  }

  if (!preview.data) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-8" aria-busy="true">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  const invite = preview.data;

  if (invite.already_member) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-lg font-semibold">Você já faz parte de “{invite.name}”.</p>
        <Button asChild className="mt-6">
          <Link to={`/grupos/${invite.group_id}`}>Abrir o grupo</Link>
        </Button>
      </div>
    );
  }

  const accept = () =>
    join.mutate(showName, {
      onSuccess: (group) => {
        toast({ title: `Bem-vindo a “${group.name}”`, description: 'Boa leitura!' });
        navigate(`/grupos/${group.id}`, { replace: true });
      },
    });

  return (
    <div className="mx-auto max-w-md space-y-6 py-4">
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Users className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-foreground">Convite para “{invite.name}”</h1>
        <p className="mt-1 text-muted-foreground">
          {invite.leader_name ? `${invite.leader_name} convidou você` : 'Você foi convidado'} para ler junto.
        </p>
      </div>

      <dl className="space-y-3 rounded-2xl border border-border bg-card p-5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Plano</dt>
          <dd className="text-right font-medium text-foreground">{invite.title}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Período</dt>
          <dd className="text-right text-foreground">
            {formatLongDate(invite.start_date)} a {formatLongDate(invite.end_date)} · {invite.reading_days} dias
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Primeira leitura</dt>
          <dd className="text-right font-crimson text-base text-foreground">{formatPassages(invite.next_passages).join('; ')}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Participantes</dt>
          <dd className="text-right text-foreground">{invite.members_count}</dd>
        </div>
      </dl>

      <div className="space-y-3">
        <label className="flex items-start gap-3 text-sm">
          <Checkbox checked={showName} onCheckedChange={(v) => setShowName(v === true)} className="mt-0.5" />
          <span className="text-foreground">
            Mostrar meu nome ao grupo. <span className="text-muted-foreground">Sem isso, o grupo só vê o total de quem leu.</span>
          </span>
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3 text-sm">
          <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
          <span className="text-foreground">{CONSENT_TEXT}</span>
        </label>
      </div>

      {join.isError && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {groupErrorMessage(join.error)}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button onClick={accept} disabled={!consent || join.isPending} className="sm:flex-1">
          {join.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Entrar no grupo
        </Button>
        <Button asChild variant="outline">
          <Link to="/planos">Agora não</Link>
        </Button>
      </div>
    </div>
  );
};

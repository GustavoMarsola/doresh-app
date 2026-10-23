import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, MailCheck } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export const ForgotPassword: React.FC = () => {
  const { toast } = useToast();
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [sentTo, setSentTo] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_HOST}/user/password/forgot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_API_KEY,
        },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (response.status === 429) {
        toast({
          title: 'Muitas tentativas',
          description: 'Aguarde um minuto e tente novamente.',
          variant: 'destructive',
        });
        return;
      }
      if (!response.ok) throw new Error(`Erro ${response.status}`);
      setSentTo(email.trim());
    } catch {
      toast({
        title: 'Não foi possível enviar o link',
        description: 'Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (sentTo) {
    return (
      <AuthShell title="Verifique seu e-mail">
        <div className="flex gap-3 rounded-xl bg-primary/5 p-4 text-sm text-foreground">
          <MailCheck className="h-5 w-5 shrink-0 text-primary" />
          <p>
            Se houver uma conta com <strong className="break-all">{sentTo}</strong>, enviamos um link para criar uma nova
            senha. O link expira em pouco tempo e só pode ser usado uma vez.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Não chegou? Confira a caixa de spam ou{' '}
          <button type="button" onClick={() => setSentTo(null)} className="font-medium text-primary hover:underline">
            tente outro e-mail
          </button>
          .
        </p>
        <Button asChild variant="outline" className="w-full h-11">
          <Link to="/login">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o login
          </Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Esqueceu sua senha?" description="Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="exemplo@email.com"
              className="pl-10 h-11 bg-background transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-11 rounded-lg font-medium" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Enviar link'}
        </Button>
      </form>

      <div className="pt-5 border-t border-border text-center">
        <Link to="/login" className="text-sm font-semibold text-primary hover:underline underline-offset-4">
          Voltar para o login
        </Link>
      </div>
    </AuthShell>
  );
};

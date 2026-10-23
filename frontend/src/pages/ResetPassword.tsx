import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const MIN_PASSWORD = 8;

export const ResetPassword: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = React.useState('');
  const [confirmation, setConfirmation] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [linkInvalid, setLinkInvalid] = React.useState(!token);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) {
      setError(`A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`);
      return;
    }
    if (password !== confirmation) {
      setError('As senhas não coincidem.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_HOST}/user/password/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_API_KEY,
        },
        body: JSON.stringify({ token, password }),
      });
      if (response.status === 400) {
        setLinkInvalid(true);
        return;
      }
      if (!response.ok) throw new Error(`Erro ${response.status}`);
      localStorage.removeItem('token');
      toast({ title: 'Senha alterada', description: 'Entre com a sua nova senha.' });
      navigate('/login', { replace: true });
    } catch {
      toast({
        title: 'Não foi possível alterar a senha',
        description: 'Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (linkInvalid) {
    return (
      <AuthShell
        title="Link inválido ou expirado"
        description="Este link de redefinição já foi usado, expirou ou foi substituído por um pedido mais recente."
      >
        <Button asChild className="w-full h-11">
          <Link to="/recuperar">Pedir um novo link</Link>
        </Button>
        <div className="text-center">
          <Link to="/login" className="text-sm font-semibold text-primary hover:underline underline-offset-4">
            Voltar para o login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Criar nova senha" description="Escolha uma senha com pelo menos 8 caracteres. Você sairá da conta em todos os aparelhos.">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground font-medium">Nova senha</Label>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              autoFocus
              className="pl-10 pr-10 h-11 bg-background transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? 'reset-error' : undefined}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmation" className="text-foreground font-medium">Confirme a nova senha</Label>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              id="confirmation"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="pl-10 h-11 bg-background transition-all"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? 'reset-error' : undefined}
              disabled={isLoading}
            />
          </div>
        </div>

        {error && (
          <p id="reset-error" className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </p>
        )}

        <Button type="submit" className="w-full h-11 rounded-lg font-medium" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Salvar nova senha'}
        </Button>
      </form>
    </AuthShell>
  );
};

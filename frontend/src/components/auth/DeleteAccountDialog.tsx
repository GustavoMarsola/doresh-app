import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authFetch } from '@/components/auth/utils';
import { useToast } from '@/hooks/use-toast';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Remove o que a conta deixou neste navegador; o tema é preferência do aparelho e fica. */
const clearLocalData = () => {
  try {
    localStorage.removeItem('token');
    Object.keys(localStorage)
      .filter((key) => key.startsWith('doresh:') && key !== 'doresh:theme')
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    /* ignora */
  }
};

export const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setPassword('');
      setError(null);
    }
  }, [open]);

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Digite sua senha para confirmar.');
      return;
    }
    setIsDeleting(true);
    setError(null);
    try {
      const response = await authFetch(`${import.meta.env.VITE_API_HOST}/user/account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (response.status === 403) {
        setError('Senha incorreta.');
        return;
      }
      if (response.status === 429) {
        setError('Muitas tentativas. Aguarde um minuto e tente novamente.');
        return;
      }
      if (!response.ok) throw new Error(`Erro ${response.status}`);

      clearLocalData();
      queryClient.clear();
      onOpenChange(false);
      navigate('/login', { replace: true });
      toast({ title: 'Conta excluída', description: 'Seus dados foram apagados. Que a Palavra continue a guiar seus passos.' });
    } catch {
      setError('Não foi possível excluir a conta. Verifique sua conexão e tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isDeleting && onOpenChange(next)}>
      <AlertDialogContent className="rounded-2xl">
        <form onSubmit={confirm} className="space-y-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Vamos apagar de forma permanente sua conta e tudo o que você guardou no Doresh: estudos, destaques e
                  comentários.
                </p>
                <p className="font-medium text-foreground">Essa ação não pode ser desfeita.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="delete-account-password">Digite sua senha para confirmar</Label>
            <Input
              id="delete-account-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? 'delete-account-error' : undefined}
              disabled={isDeleting}
            />
            {error && (
              <p id="delete-account-error" className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </p>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={isDeleting}>
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Excluir conta
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

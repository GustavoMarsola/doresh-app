import React from 'react';
import { Loader2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { useDeleteStudy, type Study } from '@/lib/studies';

interface DeleteStudyDialogProps {
  study: Study | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export const DeleteStudyDialog: React.FC<DeleteStudyDialogProps> = ({ study, onOpenChange, onDeleted }) => {
  const { toast } = useToast();
  const deleteStudy = useDeleteStudy();

  const confirm = () => {
    if (!study) return;
    deleteStudy.mutate(study.id, {
      onSuccess: () => {
        toast({ title: 'Estudo excluído', description: study.title });
        onOpenChange(false);
        onDeleted?.();
      },
      onError: () =>
        toast({
          title: 'Não foi possível excluir o estudo',
          description: 'Verifique sua conexão e tente novamente.',
          variant: 'destructive',
        }),
    });
  };

  return (
    <AlertDialog open={!!study} onOpenChange={(open) => !deleteStudy.isPending && onOpenChange(open)}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir este estudo?</AlertDialogTitle>
          <AlertDialogDescription>
            “{study?.title}” será removido da sua biblioteca. Essa ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteStudy.isPending}>Cancelar</AlertDialogCancel>
          <Button variant="destructive" onClick={confirm} disabled={deleteStudy.isPending}>
            {deleteStudy.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Excluir estudo
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

import React from 'react';
import { User, Heart, ExternalLink, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DeleteAccountDialog } from '@/components/auth/DeleteAccountDialog';

export const Profile: React.FC = () => {
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  return (
    <div className="dashboard-content p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <User className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-red-500" />
            <span>Apoie o Doresh</span>
          </CardTitle>
          <CardDescription>
            O Doresh é gratuito e mantido com amor. Se ele tem sido útil na sua jornada com a Palavra, considere fazer uma doação voluntária.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Sua contribuição ajuda a manter os servidores no ar, financiar novas funcionalidades e garantir que mais pessoas tenham acesso a ferramentas de estudo bíblico de qualidade.
          </p>
          <Button
            className="w-full sm:w-auto"
            onClick={() => window.open('https://livepix.gg/doresh', '_blank')}
          >
            <Heart className="h-4 w-4 mr-2" />
            Fazer uma doação
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
          <p className="text-xs text-muted-foreground">
            Você será redirecionado para uma página segura de doações.
          </p>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            <span>Excluir conta</span>
          </CardTitle>
          <CardDescription>
            Apaga de forma permanente sua conta e tudo o que você guardou: estudos, destaques e comentários.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full sm:w-auto border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteOpen(true)}>
            Excluir minha conta
          </Button>
        </CardContent>
      </Card>

      <DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
    </div>
  );
};

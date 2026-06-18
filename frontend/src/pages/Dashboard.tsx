import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, BookOpen, ScrollText, MessageSquare, Highlighter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { authFetch } from '@/components/auth/utils';

interface Highlight {
  id: string;
  text: string;
  color: string;
  created_at: string;
}

interface Comment {
  id: string;
  biblical_text: string;
  comment: string;
  created_at: string;
}

interface UserData {
  highlights: Highlight[];
  comments: Comment[];
}

export const Dashboard: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibleHighlights, setVisibleHighlights] = useState(3);
  const [visibleComments, setVisibleComments] = useState(3);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await authFetch(`${import.meta.env.VITE_API_HOST}/user/profile`);
        const data = await response.json();
        setUserData({ highlights: data.highlights, comments: data.comments });
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome section */}
      <div className="text-center py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Bem-vindo ao Doresh
        </h1>
        <p className="text-muted-foreground text-lg">
          Organize seus estudos e prepare-se para servir
        </p>
      </div>

      {/* Verse highlight */}
      {/* <div className="flex justify-center">
        <Card className="max-w-2xl p-6 bg-gradient-to-r from-primary/10 via-background to-primary/10 shadow-md border-l-4 border-primary">
          <CardContent className="flex items-center gap-4">
            <ScrollText className="w-12 h-12 text-primary flex-shrink-0" />
            <div>
              <p className="text-lg italic font-medium text-foreground">
                “Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.”
              </p>
              <p className="text-sm text-muted-foreground text-right">
                Salmo 119:105
              </p>
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link to="/ler">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <BookOpen className="w-12 h-12 text-accent mb-4" />
              <h3 className="text-lg font-semibold mb-2">Leitura Bíblica</h3>
              <p className="text-muted-foreground text-center">
                Leia e medite nas Escrituras
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/criar">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-primary/30 hover:border-primary/50">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <PlusCircle className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Novo Estudo</h3>
              <p className="text-muted-foreground text-center">
                Crie um estudo bíblico ou sermão
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* User Activity */}
      <Card className="shadow-md">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-4">Atividade Recente</h2>
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : !userData ? (
            <p className="text-muted-foreground">Não foi possível carregar os dados.</p>
          ) : (
            <div className="space-y-6">
              {/* Highlights */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Highlighter className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Destaques</h3>
                </div>
                {userData.highlights.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhum destaque criado.</p>
                ) : (
                  <>
                    <ul className="space-y-2">
                      {userData.highlights.slice(0, visibleHighlights).map((h) => (
                        <li
                          key={h.id}
                          className={`p-3 rounded-md border-l-4 ${
                            h.color === "red"
                              ? "border-red-500 bg-red-50"
                              : "border-primary bg-primary/5"
                          }`}
                        >
                          <p className="text-lg">{h.text}</p>
                        </li>
                      ))}
                    </ul>
                    {visibleHighlights < userData.highlights.length && (
                      <button
                        onClick={() => setVisibleHighlights((prev) => prev + 3)}
                        className="mt-2 text-sm text-primary hover:underline"
                      >
                        Mostrar mais
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Comments */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-accent" />
                  <h3 className="text-lg font-semibold">Comentários</h3>
                </div>
                {userData.comments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhum comentário feito.</p>
                ) : (
                  <>
                    <ul className="space-y-2">
                      {userData.comments.slice(0, visibleComments).map((c) => (
                        <li
                          key={c.id}
                          className="p-3 rounded-md bg-background border border-border"
                        >
                          <p className="text-lg font-medium text-foreground">{c.biblical_text}</p>
                          <p className="text-lg text-muted-foreground">{c.comment}</p>
                        </li>
                      ))}
                    </ul>
                    {visibleComments < userData.comments.length && (
                      <button
                        onClick={() => setVisibleComments((prev) => prev + 3)}
                        className="mt-2 text-sm text-primary hover:underline"
                      >
                        Mostrar mais
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

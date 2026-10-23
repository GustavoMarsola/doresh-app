import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, BookOpen, ScrollText, MessageSquare, Highlighter, CalendarCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { authFetch } from '@/components/auth/utils';
import { formatReference } from '@/data/bibleCanon';
import { bookName, commentVerses, groupHighlights, lastReaderVersion, type Annotations, type Comment } from '@/lib/annotations';
import { formatPassages, useMyPlans } from '@/lib/readingPlans';

const readerLink = (slug: string, chapter: number) =>
  `/ler?livro=${encodeURIComponent(bookName(slug))}&cap=${chapter}`;

const commentReference = (c: Comment) => formatReference(bookName(c.book), c.chapter, commentVerses(c));

export const Dashboard: React.FC = () => {
  const [userData, setUserData] = useState<Annotations | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibleHighlights, setVisibleHighlights] = useState(3);
  const [visibleComments, setVisibleComments] = useState(3);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await authFetch(`${import.meta.env.VITE_API_HOST}/user/profile?version=${lastReaderVersion()}`);
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

  const highlightGroups = React.useMemo(() => groupHighlights(userData?.highlights ?? []), [userData]);

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

      <ContinueReading />

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

        <Link to="/estudos/novo">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-primary/30 hover:border-primary/50">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <PlusCircle className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Novo Estudo</h3>
              <p className="text-muted-foreground text-center">
                Comece um novo estudo da Palavra
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
                {highlightGroups.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhum destaque criado.</p>
                ) : (
                  <>
                    <ul className="space-y-2">
                      {highlightGroups.slice(0, visibleHighlights).map((h) => (
                        <li key={h.key}>
                          <Link
                            to={`/ler?livro=${encodeURIComponent(h.bookName)}&cap=${h.chapter}`}
                            className={`block p-3 rounded-md border-l-4 hover:bg-muted/60 transition-colors ${
                              h.color === "red"
                                ? "border-red-500 bg-red-50"
                                : "border-primary bg-primary/5"
                            }`}
                          >
                            <p className="text-sm font-semibold text-foreground">
                              {formatReference(h.bookName, h.chapter, h.verses)}
                              <span className="ml-1.5 font-normal text-muted-foreground">{lastReaderVersion().toUpperCase()}</span>
                            </p>
                            <p className="mt-1 font-crimson text-lg leading-relaxed text-foreground">
                              {h.verses.map((verse, i) => (
                                <React.Fragment key={verse}>
                                  {h.verses.length > 1 && (
                                    <sup className="mr-0.5 font-inter text-[0.6em] font-semibold text-primary">{verse}</sup>
                                  )}
                                  {h.texts[i]}{' '}
                                </React.Fragment>
                              ))}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {visibleHighlights < highlightGroups.length && (
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
                          <Link to={readerLink(c.book, c.chapter)} className="text-lg font-medium text-foreground hover:underline">
                            {commentReference(c)}
                          </Link>
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

/** "Retomar de onde parei": a próxima leitura dos planos em andamento (os mais recentes primeiro). */
const ContinueReading: React.FC = () => {
  const plans = useMyPlans();
  const active = (plans.data ?? []).filter((p) => p.next_day).slice(0, 2);
  if (!active.length) return null;

  return (
    <section aria-labelledby="continue-heading" className="space-y-3">
      <h2 id="continue-heading" className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <CalendarCheck className="h-5 w-5 text-primary" />
        Continue sua leitura
      </h2>
      <ul className="grid gap-3 md:grid-cols-2">
        {active.map((plan) => (
          <li key={plan.id}>
            <Link
              to={`/planos/${plan.id}/dia/${plan.next_day!.index}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-4 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm text-muted-foreground">
                  {plan.title} · dia {plan.next_day!.index} de {plan.reading_days}
                </span>
                <span className="mt-0.5 block truncate font-crimson text-lg text-foreground">
                  {formatPassages(plan.next_day!.passages).join('; ')}
                </span>
              </span>
              <span className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Retomar</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

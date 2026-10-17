import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, BookOpen, ScrollText, MessageSquare, Highlighter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { authFetch } from '@/components/auth/utils';
import { findBookBySlug, formatReference } from '@/data/bibleCanon';

interface Highlight {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  color: string;
  text: string | null;
  updated_at: string;
}

interface Comment {
  id: string;
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number;
  comment: string;
  created_at: string;
}

interface HighlightGroup {
  key: string;
  bookName: string;
  chapter: number;
  verses: number[];
  texts: (string | null)[];
  color: string;
  updatedAt: string;
}

const bookName = (slug: string) => findBookBySlug(slug)?.name ?? slug;

const readerLink = (slug: string, chapter: number) =>
  `/ler?livro=${encodeURIComponent(bookName(slug))}&cap=${chapter}`;

/** Junta versículos seguidos do mesmo capítulo e cor ("João 3:16–18"); os mais recentes primeiro. */
const groupHighlights = (highlights: Highlight[]): HighlightGroup[] => {
  const sorted = [...highlights].sort(
    (a, b) => a.book.localeCompare(b.book) || a.chapter - b.chapter || a.verse - b.verse,
  );
  const groups: (HighlightGroup & { slug: string })[] = [];
  for (const h of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.slug === h.book && last.chapter === h.chapter && last.color === h.color && last.verses[last.verses.length - 1] === h.verse - 1) {
      last.verses.push(h.verse);
      last.texts.push(h.text);
      if (h.updated_at > last.updatedAt) last.updatedAt = h.updated_at;
    } else {
      groups.push({ key: h.id, slug: h.book, bookName: bookName(h.book), chapter: h.chapter, verses: [h.verse], texts: [h.text], color: h.color, updatedAt: h.updated_at });
    }
  }
  return groups.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

/** Versão que a pessoa usou por último no leitor (o leitor guarda em doresh:last-passage). */
const lastReaderVersion = () => {
  try {
    return JSON.parse(localStorage.getItem('doresh:last-passage') ?? 'null')?.version === 'ARA' ? 'ara' : 'nvi';
  } catch {
    return 'nvi';
  }
};

const commentReference = (c: Comment) =>
  formatReference(
    bookName(c.book),
    c.chapter,
    Array.from({ length: c.verse_end - c.verse_start + 1 }, (_, i) => c.verse_start + i),
  );

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

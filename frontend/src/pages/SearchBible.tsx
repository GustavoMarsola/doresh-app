
import React from 'react';
import { Search, Copy, Bookmark, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockVerses } from '@/data/mockData';
import { BiblicalVerse } from '@/types/sermon';

export const SearchBible: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedVerses, setSelectedVerses] = React.useState<string[]>([]);

  const filteredVerses = mockVerses.filter(verse =>
    verse.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    verse.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = (verse: BiblicalVerse) => {
    const text = `${verse.text} (${verse.reference})`;
    navigator.clipboard.writeText(text);
    // Toast notification would go here
  };

  const toggleBookmark = (reference: string) => {
    setSelectedVerses(prev =>
      prev.includes(reference)
        ? prev.filter(ref => ref !== reference)
        : [...prev, reference]
    );
  };

  const useAsBaseText = (verse: BiblicalVerse) => {
    // This would redirect to create sermon with this verse as base text
    console.log('Using as base text:', verse.reference);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Pesquisa Bíblica
        </h1>
        <p className="text-muted-foreground">
          Encontre versículos e referências para seus estudos
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Busque por referência (ex: João 3:16) ou palavras-chave (ex: amor, fé)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {searchTerm ? `Resultados para "${searchTerm}"` : 'Versículos Populares'}
        </h2>

        {filteredVerses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum resultado encontrado.' : 'Digite algo para pesquisar.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredVerses.map((verse, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-primary font-semibold">
                      {verse.reference}
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {verse.version}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed mb-4 text-lg">
                    "{verse.text}"
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(verse)}
                      className="gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copiar
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleBookmark(verse.reference)}
                      className={`gap-2 ${
                        selectedVerses.includes(verse.reference)
                          ? 'bg-primary text-primary-foreground'
                          : ''
                      }`}
                    >
                      <Bookmark className="w-4 h-4" />
                      {selectedVerses.includes(verse.reference) ? 'Marcado' : 'Marcar'}
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => useAsBaseText(verse)}
                      className="gap-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                      Usar como texto base
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bookmarked verses */}
      {selectedVerses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-primary" />
              Versículos Marcados ({selectedVerses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedVerses.map((reference) => (
                <span
                  key={reference}
                  className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                >
                  {reference}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

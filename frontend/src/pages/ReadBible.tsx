import React from 'react';
import { BookOpen, Highlighter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { bibleBooks, bibleVersions } from '@/data/bibleMockData';
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";
import { authFetch } from '@/components/auth/utils';


export const ReadBible: React.FC = () => {
	const token = localStorage.getItem("token");
	const { toast } = useToast();
	const [selectedBook, setSelectedBook]       = React.useState('Marcos');
	const [selectedChapter, setSelectedChapter] = React.useState(1);
	const [selectedVersion, setSelectedVersion] = React.useState('NVI');
	const [highlightColors, setHighlightColors] = React.useState<Record<string, string>>({});
	const [selectedVerses, setSelectedVerses]   = React.useState<string[]>([]);
	const [comment, setComment]                 = React.useState("");
	const [chapterData, setChapterData]         = React.useState<string[]>([]);
	const [totalChapters, setTotalChapters]     = React.useState<number>(1);
	const [showSpiral, setShowSpiral]           = React.useState(false);

	const fetchChapter = async (book: string, chapter: number, version: string) => {
		setShowSpiral(true);
		try {
	 	   const res = await authFetch(import.meta.env.VITE_API_HOST + `/bible/book?name=${encodeURIComponent(book)}&version=${version}`);
		   if (res.status !== 200) throw new Error("Erro ao buscar capítulo");
		   const data = await res.json();
		//    const data = await res.json();
		   const chapters = data.chapters;
		   setTotalChapters(chapters.length);
		   const chapterContent: string[] = chapters[chapter - 1] || [];

			if (chapterContent.length === 0) {
				throw new Error("Capítulo não encontrado.");
		   }

			setChapterData(chapterContent);

		} catch (error: any) {
			toast({
				title: "Erro ao carregar capítulo",
				description: error.message || "Tente novamente mais tarde.",
				variant: "destructive",
			});
			setChapterData([]);
		} finally {
			setShowSpiral(false);
		}
	};

	const toggleSelection = (verseId: string) => {
		setSelectedVerses(prev =>
		prev.includes(verseId)
			? prev.filter(id => id !== verseId)
			: [...prev, verseId]
		);
	};
	
	const goToPreviousChapter = () => {
  if (selectedChapter > 1) {
    setSelectedChapter(selectedChapter - 1);
	window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    const currentBookIndex = bibleBooks.findIndex(b => b === selectedBook);
    if (currentBookIndex > 0) {
      const previousBook = bibleBooks[currentBookIndex - 1];
      setSelectedBook(previousBook);
      // Vamos buscar o total de capítulos do livro anterior primeiro
      authFetch(import.meta.env.VITE_API_HOST + `/bible/book?name=${encodeURIComponent(previousBook)}&version=${selectedVersion}`)
        .then(res => res.json())
        .then(data => {
          const lastChapter = data.chapters.length;
          setSelectedChapter(lastChapter);
		  window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
  }
};

    const goToNextChapter = () => {
  if (selectedChapter < totalChapters) {
    setSelectedChapter(selectedChapter + 1);
	window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    const currentBookIndex = bibleBooks.findIndex(b => b === selectedBook);
    if (currentBookIndex < bibleBooks.length - 1) {
      const nextBook = bibleBooks[currentBookIndex + 1];
      setSelectedBook(nextBook);
      setSelectedChapter(1);
	  window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
};

	React.useEffect(() => {
		fetchChapter(selectedBook, selectedChapter, selectedVersion);
	}, [selectedBook, selectedChapter, selectedVersion]);

	const handleSaveComment = async (comment: string) => {
		setShowSpiral(true);
		try {
			const biblicalTexts = selectedVerses.map((id) => {
                        const [book, chapter, verse] = id.split("-");
                        const verseNumber = parseInt(verse);
                        const text = chapterData[verseNumber - 1];
                        return `${book} ${chapter}:${verse} - ${text}`;
            }).join("\n")
			const response = await authFetch(
				import.meta.env.VITE_API_HOST + `/bible/comment`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"Authorization": `Bearer ${token}`,
					},
					body: JSON.stringify(
						{ 
							comment: comment,
							// book_name: selectedBook,
							biblical_text: biblicalTexts
						}
					),
				}
			);
			if (response.status !== 201) {
				throw new Error("Erro ao salvar comentário");
			}
			toast({
				title: "Comentário salvo",
				description: "Seu comentário foi salvo com sucesso.",
				variant: "default",
			});
			setComment("");
		} catch (error: any) {
			toast({
				title: "Erro ao salvar comentário",
				description: error.message || "Tente novamente mais tarde.",
				variant: "destructive",
			});
		} finally {
			setShowSpiral(false);
			// setSelectedVerses([]);
		}
	}

	const handleHighlightVerses = async (color: string) => {
	if (selectedVerses.length === 0) return;
	setShowSpiral(true);
	try {
		const biblicalTexts = selectedVerses.map((id) => {
                        const [book, chapter, verse] = id.split("-");
                        const verseNumber = parseInt(verse);
                        const text = chapterData[verseNumber - 1];
                        return `${book} ${chapter}:${verse} - ${text}`;
        }).join("\n")
		const response = await authFetch(
			import.meta.env.VITE_API_HOST + `/bible/highlight`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${token}`,
				},
				body: JSON.stringify({
					color,
					text: biblicalTexts
				}),
			}
		);

		if (!response.ok) {
			throw new Error("Erro ao salvar grifo");
		}

		// Atualiza localmente o estado das cores (já está sendo feito nos botões)
		toast({
			title: "Texto grifado",
			description: `Versículos grifados com a cor ${color}`,
		});
	} catch (error: any) {
		toast({
			title: "Erro ao salvar marcação de texto",
			description: error.message || "Tente novamente mais tarde.",
			variant: "destructive",
		});
	} finally {
		setShowSpiral(false);
		setSelectedVerses([]); // limpa seleção
	}
};

	return (
		<div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-28 relative">
			
			{/* Header */}
			<div className="text-center py-8">
				<h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
					<BookOpen className="w-8 h-8 text-primary" />
					Leitura Bíblica
				</h1>
				<p className="text-muted-foreground">Leia, grife e estude as Escrituras</p>
			</div>
            
			{/* Loading Spinner */}
			{showSpiral && (
				<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
					<div className="w-20 h-20 border-4 border-transparent border-t-white rounded-full animate-spin"></div>
				</div>
			)}

			{/* Navigation */}
			<Card>
				<CardContent className="pt-6">
				<div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
  <div className="flex flex-col md:flex-row gap-2 items-start md:items-center w-full md:w-auto">
    <label className="text-muted-foreground">Versão</label>
    <Select value={selectedVersion} onValueChange={setSelectedVersion}>
      <SelectTrigger className="w-full md:w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {bibleVersions.map((version) => (
          <SelectItem key={version} value={version}>{version}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>

  <div className="flex flex-col md:flex-row gap-2 items-start md:items-center w-full md:w-auto">
    <label className="text-muted-foreground">Livro</label>
    <Select value={selectedBook} onValueChange={setSelectedBook}>
      <SelectTrigger className="w-full md:w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {bibleBooks.map((book) => (
          <SelectItem key={book} value={book}>{book}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>

  <div className="flex flex-col md:flex-row gap-2 items-start md:items-center w-full md:w-auto">
    <label className="text-muted-foreground">Capítulo</label>
    <Select value={selectedChapter.toString()} onValueChange={(val) => setSelectedChapter(parseInt(val))}>
      <SelectTrigger className="w-full md:w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: totalChapters }, (_, i) => i + 1).map((num) => (
          <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
</div>
				</CardContent>
			</Card>

			{/* Bible Text */}
			<Card>
				<CardHeader>
					<CardTitle className="text-xl text-primary">
						{selectedBook} {selectedChapter}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
				{chapterData.map((text, index) => {
	const verseNumber = index + 1;
	const id = `${selectedBook}-${selectedChapter}-${verseNumber}`;
	const highlightColor = highlightColors[id];
	const isSelected = selectedVerses.includes(id);

	const verseClass = cn(
		"p-4 rounded-lg border-l-4 transition-all cursor-pointer",
		isSelected
			? 'border-l-accent bg-accent/10 shadow-md'
			: highlightColor === 'yellow'
			? 'border-l-yellow-400 bg-yellow-100/30'
			: highlightColor === 'blue'
			? 'border-l-blue-400 bg-blue-100/30'
			: highlightColor === 'red'
			? 'border-l-red-400 bg-red-100/30'
			: 'border-l-transparent hover:border-l-muted-foreground hover:bg-muted/50'
	);

	return (
		<div
			key={id}
			className={verseClass}
			onClick={() => toggleSelection(id)}
		>
			<div className="flex items-start gap-3">
				<span className="text-primary font-semibold text-sm min-w-[2rem]">
					{verseNumber}
				</span>
				<p
					className={cn(
						"text-foreground leading-relaxed text-lg flex-1 cursor-pointer",
						isSelected && "underline underline-offset-4 decoration-primary"
					)}
					onClick={(e) => {
						e.stopPropagation();
						toggleSelection(id);
					}}
				>
					{text}
				</p>
			</div>
		</div>
	);
})}
				</CardContent>
			</Card>

			{chapterData.length > 0 && (
  <>
	{/* Botão Esquerda */}
	<div
  className="fixed bottom-16 left-4 z-40 md:top-[60%] md:left-[calc(50%-25rem)] md:flex"
>
  <Button
    variant="outline"
    size="icon"
    className="rounded-full shadow-lg"
    disabled={selectedBook === bibleBooks[0] && selectedChapter === 1}
    onClick={goToPreviousChapter}
  >
    <ChevronLeft className="w-5 h-5" />
  </Button>
</div>

	{/* Botão Direita */}
	{/* <div
	  className="fixed right-4 z-40 hidden md:flex"
	  style={{ top: 'calc(60% - 2rem)', right: 'calc(50% - 40rem)'  }}
	>
	  <Button
		variant="outline"
		size="icon"
		className="rounded-full shadow-lg"
		onClick={goToNextChapter}
		disabled={selectedBook === bibleBooks[bibleBooks.length - 1] && selectedChapter === totalChapters}
	  >
		<ChevronRight className="w-5 h-5" />
	  </Button>
	</div> */}
	<div
  className="fixed bottom-16 right-4 z-40 md:top-[60%] md:right-[calc(50%-40rem)] md:flex"
>
  <Button
    variant="outline"
    size="icon"
    className="rounded-full shadow-lg"
    onClick={goToNextChapter}
    disabled={selectedBook === bibleBooks[bibleBooks.length - 1] && selectedChapter === totalChapters}
  >
    <ChevronRight className="w-5 h-5" />
  </Button>
</div>
  </>
)}

		{/* Floating Action Panel for a Verse */}
		{selectedVerses.length > 0 && (
<div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md md:max-w-xl bg-card border border-border rounded-xl shadow-xl p-3 md:p-4 animate-fade-in">
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs md:text-sm text-muted-foreground font-medium">
        {selectedVerses.length} versículo{selectedVerses.length > 1 ? 's' : ''}
      </p>
      <Button variant="ghost" size="sm" onClick={() => setSelectedVerses([])}>
        <X className="w-4 h-4" />
      </Button>
    </div>
    <div className="flex flex-wrap gap-1 md:gap-2">
      {/* Botões de grifo */}
      <Button
        variant="ghost"
        className="bg-yellow-300/20 text-yellow-600 text-xs md:text-sm"
        onClick={() => {
          setHighlightColors(prev => {
            const updated = { ...prev };
            selectedVerses.forEach(id => {
              updated[id] = 'yellow';
            });
            return updated;
          });
          handleHighlightVerses('yellow');
        }}
      >
        🟡 Amarelo
      </Button>
      <Button
        variant="ghost"
        className="bg-blue-300/20 text-blue-600 text-xs md:text-sm"
        onClick={() => {
          setHighlightColors(prev => {
            const updated = { ...prev };
            selectedVerses.forEach(id => {
              updated[id] = 'blue';
            });
            return updated;
          });
          handleHighlightVerses('blue');
        }}
      >
        🔵 Azul
      </Button>
      <Button
        variant="ghost"
        className="bg-red-300/20 text-red-600 text-xs md:text-sm"
        onClick={() => {
          setHighlightColors(prev => {
            const updated = { ...prev };
            selectedVerses.forEach(id => {
              updated[id] = 'red';
            });
            return updated;
          });
          handleHighlightVerses('red');
        }}
      >
        🔴 Vermelho
      </Button>
    </div>
    {/* Copiar e comentário */}
    <div className="mt-2">
      <Button
        variant="ghost"
        className="w-full justify-start text-xs md:text-sm"
        onClick={() => {
          const selectedTexts = selectedVerses.map((id) => {
            const [book, chapter, verse] = id.split("-");
            const verseNumber = parseInt(verse);
            const text = chapterData[verseNumber - 1];
            return `${book} ${chapter}:${verse} - ${text}`;
          }).join("\n");
          navigator.clipboard.writeText(selectedTexts);
          setSelectedVerses([]);
        }}
      >
        📋 Copiar texto
      </Button>
      <Textarea
        placeholder="Escreva um comentário..."
        className="w-full mt-2 text-sm md:text-base"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <Button
        variant="secondary"
        disabled={comment.trim() === ""}
        className={cn(
          "mt-2 w-full justify-start text-sm md:text-base",
          comment.trim() !== "" && "bg-blue-500 text-white hover:bg-blue-600"
        )}
        onClick={() => {
          if (comment.trim() === "") return;
          handleSaveComment(comment);
          setComment("");
        }}
      >
        💬 Salvar comentário
      </Button>
    </div>
  </div>
)}
		</div>
		
	);
};

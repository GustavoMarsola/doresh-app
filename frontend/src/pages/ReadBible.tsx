import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronLeft, ChevronRight, MessageSquare, Minus, Plus, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PassagePicker } from '@/components/bible/PassagePicker';
import { VerseActions, type HighlightColor } from '@/components/bible/VerseActions';
import { authFetch } from '@/components/auth/utils';
import { useToast } from '@/hooks/use-toast';
import {
	BIBLE_VERSIONS,
	type BibleVersion,
	type Passage,
	findBook,
	nextPassage,
	previousPassage,
} from '@/data/bibleCanon';
import { cn } from '@/lib/utils';
import { FEATURES } from '@/lib/features';

const API = import.meta.env.VITE_API_HOST;
const LAST_PASSAGE_KEY = 'doresh:last-passage';
const FONT_SIZE_KEY = 'doresh:reader-font-size';
const DEFAULT_PASSAGE = { book: 'Marcos', chapter: 1, version: 'NVI' as BibleVersion };

const FONT_SIZES = [
	'text-[17px] md:text-[19px]',
	'text-[19px] md:text-[21px]',
	'text-[21px] md:text-[23px]',
	'text-[23px] md:text-[26px]',
];

const HIGHLIGHT_CLASSES: Record<string, string> = {
	yellow: 'bg-highlight-yellow',
	blue: 'bg-highlight-blue',
	red: 'bg-highlight-red',
};

interface ProfileHighlight {
	id: string;
	text: string;
	color: string;
	created_at: string;
}

interface ProfileComment {
	id: string;
	biblical_text: string;
	comment: string;
	created_at: string;
}

interface UserProfile {
	highlights: ProfileHighlight[];
	comments: ProfileComment[];
}

const readStorage = (key: string) => {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
};

const writeStorage = (key: string, value: string) => {
	try {
		localStorage.setItem(key, value);
	} catch {
		/* armazenamento indisponível: segue sem lembrar */
	}
};

const verseKey = (book: string, chapter: number, verse: number) => `${book}|${chapter}|${verse}`;

/** Linhas no formato "Livro C:V - texto", como o leitor envia ao salvar grifos e comentários. */
const parseVerseLines = (text: string) =>
	text
		.split('\n')
		.map((line) => line.match(/^(.+?) (\d+):(\d+) - /))
		.filter((m): m is RegExpMatchArray => m !== null)
		.map((m) => ({ book: m[1], chapter: Number(m[2]), verse: Number(m[3]) }));

/** "João 3:14–15" ou "João 3:3, 5, 7–9". */
const formatReference = (book: string, chapter: number, verses: number[]) => {
	const sorted = [...verses].sort((a, b) => a - b);
	const ranges: string[] = [];
	let start = sorted[0];
	let prev = sorted[0];
	for (const v of sorted.slice(1).concat(Number.NaN)) {
		if (v === prev + 1) {
			prev = v;
			continue;
		}
		ranges.push(start === prev ? `${start}` : `${start}–${prev}`);
		start = v;
		prev = v;
	}
	return `${book} ${chapter}:${ranges.join(', ')}`;
};

const fetchBook = async (book: string, version: BibleVersion): Promise<string[][]> => {
	const res = await authFetch(`${API}/bible/book?name=${encodeURIComponent(book)}&version=${version}`);
	if (!res.ok) throw new Error('Não foi possível carregar o livro.');
	const data = await res.json();
	return data.chapters;
};

const fetchProfile = async (): Promise<UserProfile> => {
	const res = await authFetch(`${API}/user/profile`);
	if (!res.ok) throw new Error('Não foi possível carregar seus grifos.');
	const data = await res.json();
	return { highlights: data.highlights ?? [], comments: data.comments ?? [] };
};

const postJson = async (path: string, body: unknown) => {
	const res = await authFetch(`${API}${path}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	if (!res.ok) throw new Error('request-failed');
	return res.json();
};

function usePassage() {
	const [params, setParams] = useSearchParams();

	const stored = React.useMemo(() => {
		try {
			return JSON.parse(readStorage(LAST_PASSAGE_KEY) ?? 'null');
		} catch {
			return null;
		}
	}, []);

	const rawBook = params.get('livro') ?? stored?.book ?? DEFAULT_PASSAGE.book;
	const bookInfo = findBook(rawBook) ?? findBook(DEFAULT_PASSAGE.book)!;
	const rawChapter = Number(params.get('cap') ?? stored?.chapter ?? DEFAULT_PASSAGE.chapter);
	const chapter = Math.min(Math.max(1, Number.isFinite(rawChapter) ? rawChapter : 1), bookInfo.chapters);
	const rawVersion = params.get('versao') ?? stored?.version;
	const version: BibleVersion = (BIBLE_VERSIONS as readonly string[]).includes(rawVersion ?? '')
		? (rawVersion as BibleVersion)
		: DEFAULT_PASSAGE.version;

	React.useEffect(() => {
		writeStorage(LAST_PASSAGE_KEY, JSON.stringify({ book: bookInfo.name, chapter, version }));
	}, [bookInfo.name, chapter, version]);

	const go = React.useCallback(
		(next: Partial<Passage & { version: BibleVersion }>) => {
			setParams({
				livro: next.book ?? bookInfo.name,
				cap: String(next.chapter ?? chapter),
				versao: next.version ?? version,
			});
			window.scrollTo({ top: 0 });
		},
		[bookInfo.name, chapter, version, setParams],
	);

	return { book: bookInfo.name, chapter, version, go };
}

export const ReadBible: React.FC = () => {
	const { toast } = useToast();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { book, chapter, version, go } = usePassage();

	const [pickerOpen, setPickerOpen] = React.useState(false);
	const [selected, setSelected] = React.useState<number[]>([]);
	const [fontSize, setFontSize] = React.useState(() => {
		const saved = Number(readStorage(FONT_SIZE_KEY));
		return Number.isInteger(saved) && saved >= 0 && saved < FONT_SIZES.length ? saved : 1;
	});

	const bookQuery = useQuery({
		queryKey: ['bible', 'book', version, book],
		queryFn: () => fetchBook(book, version),
		staleTime: Infinity,
		gcTime: 30 * 60 * 1000,
		retry: 1,
	});

	const profileQuery = useQuery({
		queryKey: ['user', 'profile'],
		queryFn: fetchProfile,
		staleTime: 60 * 1000,
	});

	const verses = bookQuery.data?.[chapter - 1] ?? [];
	const prev = previousPassage({ book, chapter });
	const next = nextPassage({ book, chapter });

	React.useEffect(() => setSelected([]), [book, chapter, version]);

	React.useEffect(() => writeStorage(FONT_SIZE_KEY, String(fontSize)), [fontSize]);

	// Esconde o botão flutuante do Ruach enquanto o painel de ações está aberto.
	React.useEffect(() => {
		if (selected.length === 0) return;
		document.body.dataset.versePanel = 'open';
		return () => {
			delete document.body.dataset.versePanel;
		};
	}, [selected.length]);

	const { highlights, comments } = React.useMemo(() => {
		const highlights = new Map<number, string>();
		const comments = new Map<number, string[]>();
		const profile = profileQuery.data;
		if (!profile) return { highlights, comments };

		[...profile.highlights]
			.sort((a, b) => a.created_at.localeCompare(b.created_at))
			.forEach((h) =>
				parseVerseLines(h.text).forEach((v) => {
					if (v.book === book && v.chapter === chapter) highlights.set(v.verse, h.color);
				}),
			);

		profile.comments.forEach((c) =>
			parseVerseLines(c.biblical_text).forEach((v) => {
				if (v.book === book && v.chapter === chapter) {
					comments.set(v.verse, [...(comments.get(v.verse) ?? []), c.comment]);
				}
			}),
		);

		return { highlights, comments };
	}, [profileQuery.data, book, chapter]);

	const selectedText = () =>
		[...selected]
			.sort((a, b) => a - b)
			.map((v) => `${book} ${chapter}:${v} - ${verses[v - 1]}`)
			.join('\n');

	const reference = selected.length > 0 ? formatReference(book, chapter, selected) : '';

	const highlightMutation = useMutation({
		mutationFn: (vars: { color: HighlightColor; text: string }) => postJson('/bible/highlight', vars),
		onMutate: async ({ color, text }) => {
			await queryClient.cancelQueries({ queryKey: ['user', 'profile'] });
			const previous = queryClient.getQueryData<UserProfile>(['user', 'profile']);
			if (previous) {
				queryClient.setQueryData<UserProfile>(['user', 'profile'], {
					...previous,
					highlights: [
						...previous.highlights,
						{ id: `tmp-${Date.now()}`, text, color, created_at: new Date().toISOString() },
					],
				});
			}
			setSelected([]);
			return { previous };
		},
		onError: (_err, _vars, context) => {
			if (context?.previous) queryClient.setQueryData(['user', 'profile'], context.previous);
			toast({
				title: 'Não foi possível salvar o grifo',
				description: 'Verifique sua conexão e tente novamente.',
				variant: 'destructive',
			});
		},
		onSettled: () => queryClient.invalidateQueries({ queryKey: ['user', 'profile'] }),
	});

	const commentMutation = useMutation({
		mutationFn: (vars: { comment: string; biblical_text: string }) => postJson('/bible/comment', vars),
		onSuccess: () => {
			toast({ title: 'Comentário salvo', description: `Você pode revê-lo em ${reference}.` });
			setSelected([]);
			queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
		},
		onError: () =>
			toast({
				title: 'Não foi possível salvar o comentário',
				description: 'Seu texto continua aqui. Tente novamente.',
				variant: 'destructive',
			}),
	});

	const toggleVerse = (verse: number) =>
		setSelected((current) => (current.includes(verse) ? current.filter((v) => v !== verse) : [...current, verse]));

	const copySelection = async () => {
		try {
			await navigator.clipboard.writeText(selectedText());
			toast({ title: 'Texto copiado', description: reference });
			setSelected([]);
		} catch {
			toast({ title: 'Não foi possível copiar', description: 'Selecione o texto e copie manualmente.', variant: 'destructive' });
		}
	};

	const askRuach = () => {
		const prompt = `Me ajude a entender ${reference} (${version}):\n\n${[...selected]
			.sort((a, b) => a - b)
			.map((v) => `${v} ${verses[v - 1]}`)
			.join('\n')}`;
		navigate('/assistente', { state: { prefill: prompt } });
	};

	const bookInfo = findBook(book)!;

	return (
		<div className="relative">
			{/* Barra do leitor */}
			<header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
				<div className="flex items-center gap-1 px-2 py-2 md:gap-2 md:px-8 md:py-3.5">
					<Button
						variant="ghost"
						size="icon"
						className="h-11 w-11 md:hidden"
						disabled={!prev}
						onClick={() => prev && go(prev)}
						aria-label={prev ? `Capítulo anterior: ${prev.book} ${prev.chapter}` : 'Não há capítulo anterior'}
					>
						<ChevronLeft className="h-5 w-5" />
					</Button>

					<button
						type="button"
						onClick={() => setPickerOpen(true)}
						className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3.5 text-base font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-10 md:flex-none md:rounded-lg md:text-[15px]"
					>
						{book} {chapter}
						<span className="font-medium text-muted-foreground md:hidden">· {version}</span>
						<ChevronDown className="h-4 w-4 text-muted-foreground" />
					</button>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" className="hidden h-10 gap-1.5 rounded-lg md:inline-flex" aria-label={`Versão: ${version}`}>
								{version}
								<ChevronDown className="h-4 w-4 text-muted-foreground" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							<DropdownMenuRadioGroup value={version} onValueChange={(v) => go({ version: v as BibleVersion })}>
								{BIBLE_VERSIONS.map((v) => (
									<DropdownMenuRadioItem key={v} value={v}>
										{v}
									</DropdownMenuRadioItem>
								))}
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>

					<Button
						variant="ghost"
						size="icon"
						className="h-11 w-11 md:hidden"
						disabled={!next}
						onClick={() => next && go(next)}
						aria-label={next ? `Próximo capítulo: ${next.book} ${next.chapter}` : 'Não há próximo capítulo'}
					>
						<ChevronRight className="h-5 w-5" />
					</Button>

					<div className="flex items-center gap-2 md:ml-auto">
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="ghost" size="icon" className="h-11 w-11 md:h-10 md:w-10 md:border md:border-border md:bg-card" aria-label="Tamanho do texto">
									<Type className="h-5 w-5" />
								</Button>
							</PopoverTrigger>
							<PopoverContent align="end" className="w-60 rounded-xl">
								<p className="mb-3 text-sm font-semibold">Tamanho do texto</p>
								<div className="flex items-center justify-between gap-3">
									<Button variant="outline" size="icon" onClick={() => setFontSize((s) => Math.max(0, s - 1))} disabled={fontSize === 0} aria-label="Diminuir texto">
										<Minus className="h-4 w-4" />
									</Button>
									<div className="flex flex-1 justify-center gap-1.5" aria-hidden="true">
										{FONT_SIZES.map((_, i) => (
											<span key={i} className={cn('h-1.5 w-6 rounded-full', i <= fontSize ? 'bg-primary' : 'bg-muted')} />
										))}
									</div>
									<Button variant="outline" size="icon" onClick={() => setFontSize((s) => Math.min(FONT_SIZES.length - 1, s + 1))} disabled={fontSize === FONT_SIZES.length - 1} aria-label="Aumentar texto">
										<Plus className="h-4 w-4" />
									</Button>
								</div>
							</PopoverContent>
						</Popover>

						<span className="hidden h-6 w-px bg-border md:block" aria-hidden="true" />
						<Button variant="outline" size="icon" className="hidden h-10 w-10 md:inline-flex" disabled={!prev} onClick={() => prev && go(prev)} aria-label={prev ? `Capítulo anterior: ${prev.book} ${prev.chapter}` : 'Não há capítulo anterior'}>
							<ChevronLeft className="h-5 w-5" />
						</Button>
						<Button variant="outline" size="icon" className="hidden h-10 w-10 md:inline-flex" disabled={!next} onClick={() => next && go(next)} aria-label={next ? `Próximo capítulo: ${next.book} ${next.chapter}` : 'Não há próximo capítulo'}>
							<ChevronRight className="h-5 w-5" />
						</Button>
					</div>
				</div>
			</header>

			<article
				aria-busy={bookQuery.isLoading}
				className={cn('mx-auto w-full max-w-[680px] px-5 pt-7 md:px-6 md:pt-14', selected.length > 0 ? 'pb-80' : 'pb-16')}
			>
				<p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground md:text-[13px]">
					{book}
					<span className="sr-only">, versão {version}</span>
				</p>
				<h1 className="mb-5 font-crimson text-4xl font-semibold leading-tight text-foreground md:mb-8 md:text-5xl">
					Capítulo {chapter}
				</h1>

				{bookQuery.isLoading && (
					<div className="space-y-5 pt-2" aria-label={`Carregando ${book} ${chapter}`}>
						{[100, 96, 99, 88, 100, 93, 62, 98, 100, 91, 74].map((w, i) => (
							<Skeleton key={i} className="h-3.5 rounded-full" style={{ width: `${w}%` }} />
						))}
					</div>
				)}

				{bookQuery.isError && (
					<div className="rounded-2xl border border-border bg-card p-6 text-center">
						<p className="font-medium text-foreground">Não foi possível carregar {book} {chapter}.</p>
						<p className="mt-1 text-sm text-muted-foreground">Verifique sua conexão e tente novamente.</p>
						<Button className="mt-4" variant="outline" onClick={() => bookQuery.refetch()}>
							Tentar novamente
						</Button>
					</div>
				)}

				{bookQuery.isSuccess && verses.length === 0 && (
					<div className="rounded-2xl border border-border bg-card p-6 text-center">
						<p className="font-medium text-foreground">Capítulo não encontrado.</p>
						<Button className="mt-4" variant="outline" onClick={() => go({ chapter: 1 })}>
							Ir para {book} 1
						</Button>
					</div>
				)}

				{verses.length > 0 && (
					<p className={cn('font-crimson leading-[1.75] text-foreground', FONT_SIZES[fontSize])}>
						{verses.map((text, index) => {
							const verse = index + 1;
							const isSelected = selected.includes(verse);
							const color = highlights.get(verse);
							const verseComments = comments.get(verse);
							return (
								<React.Fragment key={verse}>
									<span
										role="button"
										tabIndex={0}
										aria-pressed={isSelected}
										aria-label={`Versículo ${verse}${color ? ', grifado' : ''}`}
										onClick={() => toggleVerse(verse)}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault();
												toggleVerse(verse);
											}
										}}
										className={cn(
											'cursor-pointer rounded-[3px] py-px transition-colors [-webkit-box-decoration-break:clone] [box-decoration-break:clone] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
											color && HIGHLIGHT_CLASSES[color],
											isSelected
												? 'bg-verse-selected underline decoration-primary decoration-dotted decoration-2 underline-offset-[5px]'
												: !color && 'hover:bg-muted/70',
										)}
									>
										<sup className="mr-1 font-inter text-[0.6em] font-semibold text-primary">{verse}</sup>
										{text}
									</span>
									{verseComments && (
										<Popover>
											<PopoverTrigger asChild>
												<button
													type="button"
													aria-label={`Ver seu comentário em ${book} ${chapter}:${verse}`}
													className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-md bg-muted align-middle text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
												>
													<MessageSquare className="h-3.5 w-3.5" />
												</button>
											</PopoverTrigger>
											<PopoverContent className="w-80 rounded-xl">
												<p className="mb-2 text-sm font-semibold">
													{book} {chapter}:{verse}
												</p>
												<ul className="space-y-2">
													{verseComments.map((c, i) => (
														<li key={i} className="whitespace-pre-wrap text-sm text-foreground">
															{c}
														</li>
													))}
												</ul>
											</PopoverContent>
										</Popover>
									)}{' '}
								</React.Fragment>
							);
						})}
					</p>
				)}

				{verses.length > 0 && (
					<nav aria-label="Navegação entre capítulos" className="mt-14 flex flex-wrap gap-3 border-t border-border pt-8">
						{prev && (
							<button type="button" onClick={() => go(prev)} className="flex min-w-[200px] flex-1 flex-col gap-1 rounded-2xl border border-border bg-card px-5 py-4 text-left transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
								<span className="text-xs text-muted-foreground">Anterior</span>
								<span className="font-semibold text-foreground">‹ {prev.book} {prev.chapter}</span>
							</button>
						)}
						{next && (
							<button type="button" onClick={() => go(next)} className="flex min-w-[200px] flex-1 flex-col gap-1 rounded-2xl border border-border bg-card px-5 py-4 text-right transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
								<span className="text-xs text-muted-foreground">Próximo</span>
								<span className="font-semibold text-foreground">{next.book} {next.chapter} ›</span>
							</button>
						)}
					</nav>
				)}
			</article>

			{selected.length > 0 && (
				<VerseActions
					reference={reference}
					count={selected.length}
					onClose={() => setSelected([])}
					onHighlight={(color) => highlightMutation.mutate({ color, text: selectedText() })}
					onCopy={copySelection}
					onAskRuach={FEATURES.ruach ? askRuach : undefined}
					onSaveComment={(comment) => commentMutation.mutate({ comment, biblical_text: selectedText() })}
					savingComment={commentMutation.isPending}
				/>
			)}

			<PassagePicker
				open={pickerOpen}
				onOpenChange={setPickerOpen}
				book={book}
				chapter={chapter}
				version={version}
				onVersionChange={(v) => go({ version: v })}
				onSelect={(b, c) => {
					setPickerOpen(false);
					go({ book: b, chapter: c });
				}}
			/>

			<span className="sr-only" aria-live="polite">
				{bookInfo && bookQuery.isSuccess ? `${book} ${chapter} carregado` : ''}
			</span>
		</div>
	);
};

import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BookOpen, ExternalLink, FileDown, Loader2, MoreHorizontal, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AiBadge } from '@/components/studies/AiBadge';
import { DeleteStudyDialog } from '@/components/studies/DeleteStudyDialog';
import { exportStudyToPDF, formatReference, useStudies, type Study } from '@/lib/studies';

const useDebounced = <T,>(value: T, delay: number) => {
	const [debounced, setDebounced] = React.useState(value);
	React.useEffect(() => {
		const id = window.setTimeout(() => setDebounced(value), delay);
		return () => window.clearTimeout(id);
	}, [value, delay]);
	return debounced;
};

export const Library: React.FC = () => {
	const [params, setParams] = useSearchParams();
	const [search, setSearch] = React.useState(params.get('q') ?? '');
	const query = useDebounced(search, 300);
	const [toDelete, setToDelete] = React.useState<Study | null>(null);

	React.useEffect(() => {
		setParams(query.trim() ? { q: query.trim() } : {}, { replace: true });
	}, [query, setParams]);

	const studiesQuery = useStudies(query);
	const studies = studiesQuery.data?.pages.flatMap((p) => p.studies) ?? [];
	const total = studiesQuery.data?.pages[0]?.total ?? 0;
	const searching = query.trim().length > 0;
	const isNewUser = studiesQuery.isSuccess && total === 0 && !searching;

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-foreground md:text-3xl">Meus estudos</h1>
					<p className="mt-1 text-muted-foreground">Tudo o que você estudou na Palavra, num só lugar.</p>
				</div>
				<Button asChild>
					<Link to="/estudos/novo">
						<Plus className="h-4 w-4" />
						Novo estudo
					</Link>
				</Button>
			</div>

			{!isNewUser && (
				<div className="flex flex-wrap items-center gap-3">
					<div className="relative min-w-0 flex-1 basis-64">
						<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
						<Input
							type="search"
							aria-label="Buscar estudos"
							placeholder="Buscar por título ou introdução"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="h-11 rounded-xl bg-card pl-9"
						/>
					</div>
					{studiesQuery.isSuccess && (
						<p className="text-sm text-muted-foreground" aria-live="polite">
							{total} {total === 1 ? 'estudo' : 'estudos'}
							{searching && ' encontrados'}
						</p>
					)}
				</div>
			)}

			{studiesQuery.isLoading && (
				<div className="grid gap-4 md:grid-cols-2" aria-busy="true" aria-label="Carregando estudos">
					{Array.from({ length: 4 }, (_, i) => (
						<div key={i} className="space-y-3 rounded-2xl border border-border bg-card p-5">
							<Skeleton className="h-5 w-3/4" />
							<Skeleton className="h-4 w-1/3" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-2/3" />
						</div>
					))}
				</div>
			)}

			{studiesQuery.isError && (
				<div className="rounded-2xl border border-border bg-card p-8 text-center">
					<p className="font-medium text-foreground">Não foi possível carregar seus estudos.</p>
					<p className="mt-1 text-sm text-muted-foreground">Verifique sua conexão e tente novamente.</p>
					<Button className="mt-4" variant="outline" onClick={() => studiesQuery.refetch()}>
						Tentar novamente
					</Button>
				</div>
			)}

			{isNewUser && (
				<div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
					<span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
						<BookOpen className="h-7 w-7" />
					</span>
					<h2 className="text-lg font-semibold text-foreground">Seu primeiro estudo começa aqui</h2>
					<p className="mt-1 max-w-sm text-muted-foreground">
						Escolha uma passagem, organize a introdução, os pontos e a conclusão. Tudo é salvo automaticamente.
					</p>
					<Button asChild className="mt-6">
						<Link to="/estudos/novo">
							<Plus className="h-4 w-4" />
							Criar primeiro estudo
						</Link>
					</Button>
				</div>
			)}

			{studiesQuery.isSuccess && searching && total === 0 && (
				<div className="rounded-2xl border border-border bg-card p-8 text-center">
					<p className="font-medium text-foreground">Nenhum estudo encontrado para “{query.trim()}”.</p>
					<Button className="mt-4" variant="outline" onClick={() => setSearch('')}>
						<X className="h-4 w-4" />
						Limpar busca
					</Button>
				</div>
			)}

			{studies.length > 0 && (
				<ul className="grid gap-4 md:grid-cols-2">
					{studies.map((study) => (
						<li key={study.id}>
							<StudyCard study={study} onDelete={() => setToDelete(study)} />
						</li>
					))}
				</ul>
			)}

			{studiesQuery.hasNextPage && (
				<div className="flex justify-center">
					<Button variant="outline" onClick={() => studiesQuery.fetchNextPage()} disabled={studiesQuery.isFetchingNextPage}>
						{studiesQuery.isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" />}
						Carregar mais estudos
					</Button>
				</div>
			)}

			<DeleteStudyDialog study={toDelete} onOpenChange={(open) => !open && setToDelete(null)} />
		</div>
	);
};

const StudyCard: React.FC<{ study: Study; onDelete: () => void }> = ({ study, onDelete }) => {
	const navigate = useNavigate();
	const edited = formatDistanceToNow(new Date(study.updated_at), { addSuffix: true, locale: ptBR });
	const points = study.sections.length;

	return (
		<article className="group relative flex h-full flex-col gap-2 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/60 focus-within:ring-2 focus-within:ring-ring">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 space-y-2">
					{study.ai_generated && <AiBadge />}
					<h2 className="line-clamp-2 text-lg font-semibold leading-snug text-foreground">
						<Link to={`/estudos/${study.id}`} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">
							{study.title}
						</Link>
					</h2>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="relative z-10 -mr-2 -mt-1 h-10 w-10 shrink-0" aria-label={`Ações para ${study.title}`}>
							<MoreHorizontal className="h-5 w-5" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-48">
						<DropdownMenuItem onSelect={() => navigate(`/estudos/${study.id}`)}>
							<ExternalLink className="h-4 w-4" />
							Abrir
						</DropdownMenuItem>
						<DropdownMenuItem onSelect={() => navigate(`/estudos/${study.id}/editar`)}>
							<Pencil className="h-4 w-4" />
							Editar
						</DropdownMenuItem>
						<DropdownMenuItem onSelect={() => exportStudyToPDF(study)}>
							<FileDown className="h-4 w-4" />
							Baixar PDF
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive">
							<Trash2 className="h-4 w-4" />
							Excluir
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{study.references.length > 0 && (
				<p className="text-sm font-medium text-primary">{study.references.map(formatReference).join(' · ')}</p>
			)}
			{study.introduction.trim() && <p className="line-clamp-2 text-muted-foreground">{study.introduction}</p>}

			<p className="mt-auto pt-2 text-sm text-muted-foreground">
				Editado {edited}
				{points > 0 && ` · ${points} ${points === 1 ? 'ponto' : 'pontos'}`}
			</p>
		</article>
	);
};

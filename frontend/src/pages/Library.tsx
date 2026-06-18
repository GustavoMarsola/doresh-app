import React from 'react';
import { Calendar, Tag, Search, SortDesc, Loader2, FileDown, Trash, Pencil, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SermonType } from '@/types/sermon';
import { authFetch } from '@/components/auth/utils';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { exportSermonToPDF } from "@/components/utils"; 

export const Library: React.FC = () => {
	const [searchTerm, setSearchTerm] = React.useState('');
	const [sortBy, setSortBy] = React.useState<'date' | 'title'>('date');
	const [sermons, setSermons] = React.useState<SermonType[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState(false);
	const [selectedSermon, setSelectedSermon] = React.useState<SermonType | null>(null);

	const [sermonToDelete, setSermonToDelete] = React.useState<SermonType | null>(null);
	const [deleting, setDeleting] = React.useState(false);

	const token = localStorage.getItem("token");

	const fetchSermons = async () => {
		setLoading(true);
		setError(false);
		try {
			const res = await authFetch(`${import.meta.env.VITE_API_HOST}/sermons`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			const data = await res.json();
			setSermons(data.sermons);
		} catch (err) {
			console.error(err);
			setError(true);
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteSermon = async (id: string) => {
		setDeleting(true);
		try {
			const res = await authFetch(`${import.meta.env.VITE_API_HOST}/sermon/${id}`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` }
			});
			if (!res.ok) throw new Error('Erro ao excluir');

			// Remove o sermão da lista sem recarregar tudo
			setSermons((prev) => prev.filter((s) => s.id !== id));
			setSermonToDelete(null);
		} catch (err) {
			console.error(err);
			alert('Erro ao excluir estudo. Tente novamente.');
		} finally {
			setDeleting(false);
		}
	};

	React.useEffect(() => {
		fetchSermons();
	}, []);

	const filteredAndSortedSermons = sermons
		.filter(sermon =>
			sermon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			sermon.bible_refs.toLowerCase().includes(searchTerm.toLowerCase())
		)
		.sort((a, b) => {
			if (sortBy === "date") return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
			return a.title.localeCompare(b.title);
		});

	return (
		<div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
			{/* Header */}
			<div className="text-center py-8">
				<h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
					Biblioteca de Estudos
				</h1>
				<p className="text-muted-foreground">
					Organize e gerencie todas suas mensagens
				</p>
			</div>

			{/* Loading */}
			{loading && (
				<div className="flex justify-center items-center py-12">
					<Loader2 className="w-8 h-8 text-primary animate-spin" />
				</div>
			)}

			{/* Error */}
			{error && (
				<Card>
					<CardContent className="text-center py-8 space-y-4">
						<p className="text-muted-foreground">Erro ao carregar estudos.</p>
						<Button onClick={fetchSermons}>Tentar novamente</Button>
					</CardContent>
				</Card>
			)}

			{!loading && !error && (
				<>
					{/* Statistics */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Card>
							<CardContent className="text-center py-6">
								<div className="text-2xl font-bold text-primary mb-1">
									{sermons.length}
								</div>
								<div className="text-sm text-muted-foreground">
									Total de Estudos
								</div>
							</CardContent>
						</Card>
						
						<Card>
							<CardContent className="text-center py-6">
								<div className="text-2xl font-bold text-blue-500 mb-1">
									{sermons.filter(s => new Date(s.updated_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length}
								</div>
								<div className="text-sm text-muted-foreground">
									Últimos 7 dias
								</div>
							</CardContent>
						</Card>
						
						<Card>
							<CardContent className="text-center py-6">
								<div className="text-2xl font-bold text-red-500 mb-1">
									{sermons.filter(s => new Date(s.updated_at).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000).length}
								</div>
								<div className="text-sm text-muted-foreground">
									Últimos 30 dias
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Filters */}
					<Card>
						<CardContent className="pt-6">
							<div className="flex flex-col md:flex-row gap-4">
								<div className="flex-1 relative">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
									<Input
										placeholder="Buscar estudos..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="pl-10"
									/>
								</div>
								
								<Select value={sortBy} onValueChange={(value: 'date' | 'title') => setSortBy(value)}>
									<SelectTrigger className="w-full md:w-48">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="date">
											<div className="flex items-center gap-2">
												<Calendar className="w-4 h-4" />
												Por data
											</div>
										</SelectItem>
										<SelectItem value="title">
											<div className="flex items-center gap-2">
												<SortDesc className="w-4 h-4" />
												Por título
											</div>
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</CardContent>
					</Card>
					
					{/* Sermons List */}
					{filteredAndSortedSermons.length === 0 ? (
						<Card>
							<CardContent className="text-center py-8">
								<p className="text-muted-foreground">
									Nenhum estudo encontrado.
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="grid gap-4">
							{filteredAndSortedSermons.map((sermon) => (
								<Card key={sermon.id} className="hover:shadow-md transition-shadow">
									<CardHeader>
										<CardTitle className="flex items-start justify-between">
											<div className="flex-1">
												<button
													onClick={() => setSelectedSermon(sermon)}
													className="text-left text-lg font-semibold text-foreground hover:text-primary transition-colors mb-1 block"
												>
													{sermon.title}
												</button>
												<p className="text-sm text-primary font-medium">
													{sermon.bible_refs}
												</p>
											</div>
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-muted-foreground mb-4 line-clamp-2">
											{sermon.introduction}
										</p>
										
										<div className="flex items-center justify-between text-sm">
											<div className="flex items-center gap-4 text-muted-foreground">
												<span className="flex items-center gap-1">
													<Calendar className="w-4 h-4" />
													{new Date(sermon.updated_at).toLocaleDateString('pt-BR')}
												</span>
												<span className="flex items-center gap-1">
													<Tag className="w-4 h-4" />
													{sermon.developments.length} pontos
												</span>
											</div>
											
											<div className="flex gap-2">
												<Button variant="outline" size="sm" onClick={() => setSelectedSermon(sermon)}>
													<Eye className="w-4 h-4 mr-1" />
													Visualizar
												</Button>

												{/* <Button variant="outline" size="sm" >
													<Pencil className="w-4 h-4 mr-1" />
														Editar
												</Button> */}

												<Button variant="outline" size="sm" onClick={() => exportSermonToPDF(sermon)}>
													<FileDown className="w-4 h-4 mr-1" />
														Baixar
												</Button>

												<Button
													variant="destructive"
													size="sm"
													onClick={() => setSermonToDelete(sermon)}
												>
													<Trash className="w-4 h-4" />
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</>
			)}

			{/* Dialog para Visualizar Sermão */}
			<Dialog open={!!selectedSermon} onOpenChange={() => setSelectedSermon(null)}>
  <DialogContent className="max-w-2xl">
	{selectedSermon && (
	  <>
		<DialogHeader>
    <DialogTitle>{selectedSermon.title}</DialogTitle>
    <p className="text-sm text-primary">{selectedSermon.bible_refs}</p>
    
    <div className="flex space-x-2">
      {/* Botão de download */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportSermonToPDF(selectedSermon)}
      >
        <FileDown className="w-4 h-4 mr-1" />
        Baixar
      </Button>

      {/* <Button variant="outline" size="sm" >
          <Pencil className="w-4 h-4 mr-1" />
          Editar
      </Button> */}
    </div>
</DialogHeader>

		{/* This is the div you need to wrap the content and make scrollable */}
		<div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4"> 
		  {/* Introdução */}
		  <p className="text-muted-foreground">{selectedSermon.introduction}</p>

		  {/* Desenvolvimento */}
		  {selectedSermon.developments.map((dev, idx) => (
			<div key={dev.id ?? idx} className="border-l-2 pl-3">
			  <p className="font-medium">{dev.title}</p>
			  <p className="text-sm text-muted-foreground">{dev.text}</p>
			</div>
		  ))}

		  {/* Conclusão */}
		  {selectedSermon.conclusion && (
			<div className="mt-4 border-t pt-4">
			  <p className="font-medium">Conclusão</p>
			  <p className="text-sm text-muted-foreground">{selectedSermon.conclusion}</p>
			</div>
		  )}
		</div>
	  </>
	)}
  </DialogContent>
</Dialog>

			{/* Dialog de Confirmação de Exclusão */}
			<Dialog open={!!sermonToDelete} onOpenChange={() => setSermonToDelete(null)}>
				<DialogContent className="max-w-md">
					{sermonToDelete && (
						<>
							<DialogHeader>
								<DialogTitle>Excluir estudo</DialogTitle>
							</DialogHeader>
							<p className="text-sm text-muted-foreground">
								Tem certeza que deseja excluir <strong>{sermonToDelete.title}</strong>? 
								Essa ação não poderá ser desfeita.
							</p>
							<div className="flex justify-end gap-2 mt-6">
								<Button variant="outline" onClick={() => setSermonToDelete(null)}>
									Cancelar
								</Button>
								<Button
									variant="destructive"
									onClick={() => handleDeleteSermon(sermonToDelete.id)}
									disabled={deleting}
								>
									{deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
								</Button>
							</div>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
};

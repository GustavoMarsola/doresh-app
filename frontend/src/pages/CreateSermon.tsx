import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, Loader2, Eraser } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SermonFormData } from '@/types/sermon';
import { authFetch } from '@/components/auth/utils';
import { useToast } from '@/hooks/use-toast';


const defaultForm: SermonFormData = {
  title: '',
  bible_refs: '',
  introduction: '',
  development: [{ title: '', text: '' }],
  conclusion: ''
};


export const CreateSermon: React.FC = () => {
	const { toast } = useToast();
	const [isLoading, setIsLoading] = React.useState(false);
	const [formData, setFormData] = React.useState<SermonFormData>(defaultForm);
	const token = localStorage.getItem("token")

	// Carrega rascunho salvo ao abrir
	React.useEffect(() => {
		const saved = localStorage.getItem('draft-sermon');
		if (saved) {
			try {
				setFormData(JSON.parse(saved));
			} catch (e) {
				console.warn('Erro ao carregar rascunho:', e);
			}
		}
	}, []);

	// Salva rascunho sempre que o formulário mudar
	React.useEffect(() => {
		localStorage.setItem('draft-sermon', JSON.stringify(formData));
	}, [formData]);

	const updateField = (field: keyof SermonFormData, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }));
	};

	const updateArrayItem = (index: number, key: 'title' | 'text', value: string) => {
		setFormData(prev => ({
		...prev,
		development: prev.development.map((item, i) =>
				i === index ? { ...item, [key]: value } : item
			)
		}));
	};


	const addArrayItem = () => {
  setFormData(prev => ({
	...prev,
	development: [...prev.development, { title: '', text: '' }] // <--- text
  }));
};



	const removeArrayItem = (index: number) => {
  setFormData(prev => ({
	...prev,
	development: prev.development.length > 1 
	  ? prev.development.filter((_, i) => i !== index)
	  : prev.development
  }));
};


	const validateForm = () => {
		if (!formData.title.trim() || !formData.bible_refs.trim()) {
			alert('Título e Texto Base são obrigatórios.');
			return false;
		}
		return true;
	};

	const handleSave = async () => {
  if (!validateForm()) return;

  setIsLoading(true); // começa o loading
  try {
	const response = await authFetch(`${import.meta.env.VITE_API_HOST}/sermon`, {
	  method: 'POST',
	  headers: {
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${token}`
	  },
	  body: JSON.stringify(formData)
	});

	if (!response.ok) throw new Error('Erro ao salvar');

	localStorage.removeItem('draft-sermon');

	// 🎉 surpresa divertida
	toast({
		title: 'Estudo salvo com sucesso!',
		description: 'Continue meditando nas escrituras 📖🕎',
		variant: 'default',
	})
	handleClearDraft();
   } catch (err) {
	alert('Erro ao salvar a estudo. Tente novamente.');
	toast({
		title: 'Erro ao salvar a estudo!',
		description: `${(err as Error).message}`,
		variant: 'destructive',
	})
  } finally {
	setIsLoading(false); // termina o loading
  }
};


	const handleClearDraft = () => {
		localStorage.removeItem('draft-sermon');
		setFormData(defaultForm);
		toast({
			title: 'Rascunho limpo',
			description: 'Você pode começar um novo estudo agora.',
			variant: 'default',
		})
	};

	return (
		<div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl md:text-3xl font-bold text-foreground">Novo Estudo</h1>
					<p className="text-muted-foreground">Crie um esboço estruturado melhor organização</p>
				</div>

				<div className="flex gap-2">
					<Button
	variant="destructive"
	onClick={handleClearDraft}
	disabled={isLoading} // desabilita durante carregamento
  >
	{isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Eraser className="h-4 w-4 mr-2" />}
	Limpar Rascunho
  </Button>
				</div>
			</div>

			<div className="grid gap-6">
				{/* Informações Básicas */}
				<Card>
					<CardHeader>
						<CardTitle>Informações Básicas</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<Label htmlFor="title">Título do Estudo *</Label>
							<Input
								id="title"
								placeholder="Ex: O Amor de Deus Revelado"
								value={formData.title}
								onChange={(e) => updateField('title', e.target.value)}
							/>
						</div>

						<div>
							<Label htmlFor="bible_refs">Texto Base *</Label>
							<Input
								id="bible_refs"
								placeholder="Ex: João 3:16"
								value={formData.bible_refs}
								onChange={(e) => updateField('bible_refs', e.target.value)}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Introdução */}
				<Card>
					<CardHeader>
						<CardTitle>Introdução</CardTitle>
					</CardHeader>
					<CardContent>
						<Textarea
							placeholder="Como você iniciará seu estudo?"
							value={formData.introduction}
							onChange={(e) => updateField('introduction', e.target.value)}
							rows={10}
							
						/>
					</CardContent>
				</Card>

				{/* Desenvolvimento */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center justify-between">
							Desenvolvimento
							<Button variant="outline" size="sm" onClick={() => addArrayItem()} className="gap-2">
								<Plus className="w-4 h-4" />
								Adicionar
							</Button>
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{formData.development.map((point, index) => (
  <div key={index} className="flex gap-2">
	<div className="flex-1 space-y-2">
	  <div>
		<Label htmlFor={`point-title-${index}`}>Título do Ponto {index + 1}</Label>
		<Input
		  id={`point-title-${index}`}
		  placeholder={`Título do ponto ${index + 1}`}
		  value={point.title}
		  onChange={(e) => updateArrayItem(index, 'title', e.target.value)}
		/>
	  </div>

	  <div>
		<Label htmlFor={`point-text-${index}`}>Conteúdo do Ponto {index + 1}</Label>
		<Textarea
		  id={`point-text-${index}`}
		  placeholder={`Desenvolva o ponto ${index + 1}...`}
		  value={point.text}
		  onChange={(e) => updateArrayItem(index, 'text', e.target.value)}
		  rows={5}
		/>
	  </div>
	</div>

	{formData.development.length > 1 && (
	  <Button
		variant="outline"
		size="sm"
		onClick={() => removeArrayItem(index)}
		className="mt-6 hover:bg-red-600 hover:text-white border-red-600"
	  >
		<Trash2 className="w-4 h-4" />
	  </Button>
	)}
  </div>
))}

					</CardContent>
				</Card>

				{/* Conclusão */}
				<Card>
					<CardHeader>
						<CardTitle>Conclusão</CardTitle>
					</CardHeader>
					<CardContent>
						<Textarea
							placeholder="Como você encerrará seu estudo?"
							value={formData.conclusion}
							onChange={(e) => updateField('conclusion', e.target.value)}
							rows={10}
						/>
					</CardContent>
				</Card>

				{/* Ações */}
				<div className="flex gap-4 justify-end">
  <Button
	variant="destructive"
	onClick={handleClearDraft}
	disabled={isLoading} // desabilita durante carregamento
  >
	{isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Eraser className="h-4 w-4 mr-2" />}
	Limpar Rascunho
  </Button>

  <Button
	onClick={handleSave}
	className="gap-2"
	disabled={isLoading} // desabilita durante carregamento
  >
	{isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <><Save className="w-4 h-4" /> Salvar Estudo</>}
  </Button>
</div>

			</div>
		</div>
	);
};

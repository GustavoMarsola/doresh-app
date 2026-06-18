import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from '@/components/ui/logo';
import { MessageCircle, Sparkles, Users, CheckCircle, Star, Menu, X } from "lucide-react";
import { DoveIcon } from "@/components/ui/dove-icon";
import heroImage from "@/assets/hero-torah-3.jpeg";
import bibleStudyIcon from "@/assets/bible-study-icon.jpg";
import sermonPrepIcon from "@/assets/sermon-prep-icon.jpg";

export const LandingPage: React.FC = () => {
	return (
		<div className="min-h-screen bg-gradient-subtle">
			{/* Header */}
			<header className="container mx-auto px-4 py-6">
				<nav className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<Logo className="h-8 w-8 text-primary" />

						<div className="flex flex-col">
                            <h1 className="text-lg font-semibold text-foreground">
                                Doresh
                            </h1>
                            <p className="text-xs text-muted-foreground font-hebrew">
                                דּוֹרֵשׁ
                            </p>
                        </div>
					</div>
					<div className="hidden md:flex items-center space-x-6">
						<a href="#recursos" className="text-muted-foreground hover:text-primary transition-smooth">Recursos</a>
						<a href="#beneficios" className="text-muted-foreground hover:text-primary transition-smooth">Benefícios</a>
						{/* <a href="#testemunhos" className="text-muted-foreground hover:text-primary transition-smooth">Testemunhos</a> */}
						<Link to="/login">
							<Button variant="outline">Entrar</Button>
						</Link>
						<Link to="/registrar">
							<Button>Testar Agora</Button>
						</Link>
					</div>
				</nav>
			</header>

			{/* Hero Section */}
			<section className="relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-hero opacity-90"></div>
				<div
					className="absolute inset-0 bg-cover bg-center opacity-80"
					style={{ backgroundImage: `url(${heroImage})` }}
				></div>
				<div className="relative container mx-auto px-4 py-24 text-center">
					<h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
						Medite na
						<br />
						<span className="text-accent">Palavra de Deus</span>
					</h1>
					<p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto leading-relaxed">
						Um espaço para quem deseja estudar, meditar e organizar seus aprendizados da Bíblia em um só lugar.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Link to={"/registrar"}>
							<Button size="lg" className="text-lg px-8 py-4">
								<Sparkles className="mr-2 h-5 w-5" />
								Começar Gratuitamente
							</Button>
						</Link>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id="recursos" className="py-24 bg-background">
				<div className="container mx-auto px-4">
					<div className="text-center mb-16">
						<h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
							Recursos para o seu estudo bíblico
						</h2>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
							Doresh oferece ferramentas simples e poderosas para você mergulhar nas Escrituras e registrar suas descobertas.
						</p>
					</div>
					
					<div className="grid md:grid-cols-3 gap-8">
						<Card className="shadow-card hover:shadow-elegant transition-smooth group">
							<CardHeader className="text-center">
								<div className="w-20 h-20 mx-auto mb-4 rounded-lg overflow-hidden group-hover:scale-105 transition-bounce">
									<img src={sermonPrepIcon} alt="Criação de Notas" className="w-full h-full object-cover" />
								</div>
								<CardTitle className="text-2xl text-foreground">Anotações e Reflexões</CardTitle>
								<CardDescription className="text-lg">
									Organize seus estudos e insights com clareza
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ul className="space-y-3">
									<li className="flex items-center text-muted-foreground">
										<CheckCircle className="mr-3 h-5 w-5 text-primary" />
										Estruture seus estudos ou mensagens
									</li>
									<li className="flex items-center text-muted-foreground">
										<CheckCircle className="mr-3 h-5 w-5 text-primary" />
										Crie estruturas com pontos principais
									</li>
									<li className="flex items-center text-muted-foreground">
										<CheckCircle className="mr-3 h-5 w-5 text-primary" />
										Biblioteca pessoal de notas salvas
									</li>
								</ul>
							</CardContent>
						</Card>

						<Card className="shadow-card hover:shadow-elegant transition-smooth group">
							<CardHeader className="text-center">
								<div className="w-20 h-20 mx-auto mb-4 rounded-lg overflow-hidden group-hover:scale-105 transition-bounce">
									<img src={bibleStudyIcon} alt="Leitura Bíblica" className="w-full h-full object-cover" />
								</div>
								<CardTitle className="text-2xl text-foreground">Leitura Bíblica</CardTitle>
								<CardDescription className="text-lg">
									Estude as Escrituras de forma prática e organizada
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ul className="space-y-3">
									<li className="flex items-center text-muted-foreground">
										<CheckCircle className="mr-3 h-5 w-5 text-primary" />
										Bíblia completa em sua mão
									</li>
									<li className="flex items-center text-muted-foreground">
										<CheckCircle className="mr-3 h-5 w-5 text-primary" />
										Marque e destaque passagens importantes
									</li>
									<li className="flex items-center text-muted-foreground">
										<CheckCircle className="mr-3 h-5 w-5 text-primary" />
										Adicione comentários pessoais aos versículos
									</li>
								</ul>
							</CardContent>
						</Card>

						<Card className="shadow-card hover:shadow-elegant transition-smooth group">
							{/* Badge no topo */}
							{/* <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold absolute -top-3 left-1/2 transform -translate-x-1/2 bg-accent text-accent-foreground border-accent/50 shadow-sm">
								Em Breve
							</div> */}

							<CardHeader className="text-center mt-6">
								<div className="w-20 h-20 mx-auto mb-4 rounded-lg overflow-hidden group-hover:scale-105 transition-bounce">
									<DoveIcon size="lg" className="w-full h-full object-cover" />
								</div>
								<CardTitle className="text-2xl text-foreground">Ruach IA</CardTitle>
								<CardDescription className="text-lg">
									Inteligência artificial para enriquecer seus estudos
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ul className="space-y-3">
									<li className="flex items-center text-muted-foreground">
										<CheckCircle className="mr-3 h-5 w-5 text-accent" />
										Tire dúvidas sobre textos bíblicos
									</li>
									<li className="flex items-center text-muted-foreground">
										<CheckCircle className="mr-3 h-5 w-5 text-accent" />
										Compreenda melhor a Bíblia com explicações claras
									</li>
									<li className="flex items-center text-muted-foreground">
										<CheckCircle className="mr-3 h-5 w-5 text-accent" />
										Aprofunde-se em versículos e contextos históricos
									</li>
								</ul>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Benefits Section */}
			<section id="beneficios" className="py-24 bg-muted/30">
				<div className="container mx-auto px-4">
					<h2 className="text-4xl md:text-5xl font-bold text-foreground mb-12 text-center">
						Por que escolher o Doresh?
					</h2>

					<div className="grid md:grid-cols-3 gap-8">
						<div className="flex items-start space-x-4">
							<div className="bg-primary/10 p-3 rounded-lg">
								<Users className="h-6 w-6 text-primary" />
							</div>
							<div>
								<h3 className="text-xl font-semibold text-foreground mb-2">
									Para todos que amam a Palavra
								</h3>
								<p className="text-muted-foreground">
									Criado para estudiosos, líderes, grupos e qualquer pessoa que deseja crescer espiritualmente.
								</p>
							</div>
						</div>

						<div className="flex items-start space-x-4">
							<div className="bg-primary/10 p-3 rounded-lg">
								<MessageCircle className="h-6 w-6 text-primary" />
							</div>
							<div>
								<h3 className="text-xl font-semibold text-foreground mb-2">
									Estudo mais produtivo
								</h3>
								<p className="text-muted-foreground">
									Registre insights, conecte passagens e aprofunde seu conhecimento da Bíblia sem perder tempo.
								</p>
							</div>
						</div>

						<div className="flex items-start space-x-4">
							<div className="bg-primary/10 p-3 rounded-lg">
								<Sparkles className="h-6 w-6 text-primary" />
							</div>
							<div>
								<h3 className="text-xl font-semibold text-foreground mb-2">
									Organização e clareza
								</h3>
								<p className="text-muted-foreground">
									Mantenha seus estudos organizados e facilmente acessíveis em qualquer momento.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonials */}
			{/* <section id="testemunhos" className="py-24 bg-background">
				<div className="container mx-auto px-4">
					<div className="text-center mb-16">
						<h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
							O que dizem nossos usuários
						</h2>
						<p className="text-xl text-muted-foreground">
							Pessoas de diferentes ministérios e comunidades já estão aprofundando seu estudo com o Doresh
						</p>
					</div>
					
					<div className="grid md:grid-cols-3 gap-8">
						<Card className="shadow-card hover:shadow-elegant transition-smooth">
							<CardContent className="p-6">
								<div className="flex mb-4">
									{[1, 2, 3, 4, 5].map((star) => (
										<Star key={star} className="h-5 w-5 text-accent fill-current" />
									))}
								</div>
								<p className="text-muted-foreground mb-4">
									"O Doresh me ajuda a manter minhas anotações e estudos da Bíblia organizados. Nunca foi tão fácil revisar o que aprendi."
								</p>
								<div className="flex items-center">
									<div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
										<span className="text-primary font-semibold">AP</span>
									</div>
									<div>
										<div className="font-semibold text-foreground">Ana Paula</div>
										<div className="text-sm text-muted-foreground">Estudante da Palavra</div>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="shadow-card hover:shadow-elegant transition-smooth">
							<CardContent className="p-6">
								<div className="flex mb-4">
									{[1, 2, 3, 4, 5].map((star) => (
										<Star key={star} className="h-5 w-5 text-accent fill-current" />
									))}
								</div>
								<p className="text-muted-foreground mb-4">
									"A função de leitura bíblica e marcações é incrível. Consigo destacar e comentar os versículos que falam mais comigo."
								</p>
								<div className="flex items-center">
									<div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
										<span className="text-primary font-semibold">LC</span>
									</div>
									<div>
										<div className="font-semibold text-foreground">Lucas Carvalho</div>
										<div className="text-sm text-muted-foreground">Líder de Grupo</div>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="shadow-card hover:shadow-elegant transition-smooth">
							<CardContent className="p-6">
								<div className="flex mb-4">
									{[1, 2, 3, 4, 5].map((star) => (
										<Star key={star} className="h-5 w-5 text-accent fill-current" />
									))}
								</div>
								<p className="text-muted-foreground mb-4">
									"Antes eu tinha anotações espalhadas, agora o Doresh centraliza tudo em um só lugar. Muito mais fácil de estudar."
								</p>
								<div className="flex items-center">
									<div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
										<span className="text-primary font-semibold">JM</span>
									</div>
									<div>
										<div className="font-semibold text-foreground">João Marcos</div>
										<div className="text-sm text-muted-foreground">Ministério Jovem</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section> */}

			{/* CTA Section */}
			<section className="py-24 bg-gradient-hero relative overflow-hidden">
				<div className="absolute inset-0 bg-primary/10"></div>
				<div className="relative container mx-auto px-4 text-center">
					<h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
						Pronto para aprofundar seu estudo bíblico?
					</h2>
					<p className="text-xl text-black/90 mb-8 max-w-2xl mx-auto">
						Junte-se a uma comunidade que está redescobrindo a alegria de meditar na Palavra de Deus.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Link to={"/registrar"}>
							<Button size="lg" className="text-lg px-8 py-4">
								<Sparkles className="mr-2 h-5 w-5" />
								Começar Gratuitamente
							</Button>
						</Link>
					</div>
					<p className="text-black/70 mt-6">
						Teste gratuito por 7 dias
					</p>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-primary/5 py-12">
				<div className="container mx-auto px-4">					
					<div className="border-t border-border mt-8 pt-8 text-center text-black">
						<p>&copy; {new Date().getFullYear()} Doresh. Todos os direitos reservados.</p>
					</div>
				</div>
			</footer>
		</div>
	);
};

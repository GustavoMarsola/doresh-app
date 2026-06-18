import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, BookOpen, Book, LogOut, User, BirdIcon, BotIcon } from 'lucide-react';
import { handleLogout } from '@/components/utils'; 

const navItems = [
	{ to: '/home', icon: Home, label: 'Home', exact: true },
	{ to: '/ler', icon: BookOpen, label: 'Ler' },
	{ to: '/criar', icon: PlusCircle, label: 'Criar' },
	{ to: '/estudos', icon: Book, label: 'Estudos' },
	{ to: '/assistente', icon: BotIcon, label: 'Assistente IA' },
	{ to: '/perfil', icon: User, label: 'Perfil'},
];

export const MobileNavigation: React.FC = () => {
	return (
		<>
			{/* Bottom navigation for mobile */}
			<nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2 z-40">
				<div className="flex justify-around items-center">
					{navItems.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							end={item.exact}
							className={({ isActive }) =>
								`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors transition-transform transform-gpu active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
									isActive
										? 'text-primary bg-primary/10'
										: 'text-muted-foreground hover:text-foreground hover:bg-muted'
								}`
							}
						>
							<item.icon size={20} />
							<span className="text-xs font-medium">{item.label}</span>
						</NavLink>
					))}

					{/* Botão de Logout */}
				 <button
	onClick={handleLogout}
	className="flex flex-col items-center space-y-1 px-3 py-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-100 transition-colors transition-transform transform-gpu active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
>
	<LogOut size={20} />
	<span className="text-xs font-medium">Sair</span>
</button>
				</div>
			</nav>
		</>
	);
};

export const DesktopNavigation: React.FC = () => {
	return (
		<>
			{/* Sidebar navigation for desktop */}
			<nav className="hidden md:flex fixed left-0 top-16 bottom-0 w-64 bg-card border-r border-border p-4 z-30">
				<div className="flex flex-col space-y-2 w-full">
					{navItems.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							end={item.exact}
							className={({ isActive }) =>
								`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors transition-transform transform-gpu active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
									isActive
										? 'text-primary bg-primary/10 font-medium'
										: 'text-muted-foreground hover:text-foreground hover:bg-muted'
								}`
							}
						>
							<item.icon size={20} />
							<span className="font-medium">{item.label}</span>
						</NavLink>
					))}

					{/* Botão de Logout */}
					<button
	onClick={handleLogout}
	className="flex items-center space-x-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-100 transition-colors transition-transform transform-gpu active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
>
	<LogOut size={20} />
	<span className="font-medium">Sair</span>
</button>
				</div>
			</nav>
		</>
	);
};

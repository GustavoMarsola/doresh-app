import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTheme } from 'next-themes';
import {
	BookOpen,
	CalendarCheck,
	ChevronsUpDown,
	Heart,
	Home,
	Library,
	LogOut,
	Monitor,
	Moon,
	PanelLeftClose,
	PanelLeftOpen,
	Plus,
	Sun,
	User,
	type LucideIcon,
} from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DoveIcon } from '@/components/ui/dove-icon';
import { Logo } from '@/components/ui/logo';
import { handleLogout } from '@/components/utils';
import { cn } from '@/lib/utils';
import { FEATURES } from '@/lib/features';

const DONATION_URL = 'https://livepix.gg/doresh';

const RuachIcon: React.FC<{ className?: string }> = ({ className }) => (
	<DoveIcon size="sm" className={cn('h-5 w-5', className)} />
);

type NavItem = {
	to: string;
	label: string;
	shortLabel?: string;
	icon: LucideIcon | React.FC<{ className?: string }>;
};

const mainItems: NavItem[] = [
	{ to: '/home', label: 'Início', icon: Home },
	{ to: '/ler', label: 'Bíblia', icon: BookOpen },
	{ to: '/planos', label: 'Planos', icon: CalendarCheck },
	{ to: '/estudos', label: 'Meus estudos', shortLabel: 'Estudos', icon: Library },
	...(FEATURES.ruach ? [{ to: '/assistente', label: 'Ruach', icon: RuachIcon }] : []),
];

const mobileItems: NavItem[] = [...mainItems, { to: '/perfil', label: 'Perfil', icon: User }];

export const Brand: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
	<Link to="/home" className="flex items-center gap-3 rounded-lg px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
		<Logo size={compact ? "sm" : "md"} />
		<span className="flex flex-col leading-tight">
			<span className={cn('font-bold tracking-tight text-foreground', compact ? 'text-base' : 'text-lg')}>Doresh</span>
			{!compact && (
				<span lang="he" className="font-hebrew text-sm text-muted-foreground">
					דּוֹרֵשׁ
				</span>
			)}
		</span>
	</Link>
);

const ThemeOptions = [
	{ value: 'light', label: 'Claro', icon: Sun },
	{ value: 'dark', label: 'Escuro', icon: Moon },
	{ value: 'system', label: 'Sistema', icon: Monitor },
];

export const AccountMenu: React.FC<{ variant?: 'sidebar' | 'icon' | 'rail' }> = ({ variant = 'sidebar' }) => {
	const { theme, setTheme } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				{variant === 'sidebar' ? (
					<button
						type="button"
						className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:border-primary"
					>
						<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
							<User className="h-4 w-4" />
						</span>
						<span className="flex-1 text-sm font-semibold text-foreground">Minha conta</span>
						<ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
					</button>
				) : (
					<button
						type="button"
						aria-label="Abrir menu da conta"
						className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
							<User className="h-4 w-4" />
						</span>
					</button>
				)}
			</DropdownMenuTrigger>
			<DropdownMenuContent
				side={variant === 'sidebar' ? 'top' : variant === 'rail' ? 'right' : 'bottom'}
				align={variant === 'icon' ? 'end' : variant === 'rail' ? 'end' : 'start'}
				className="w-64 rounded-xl p-2"
			>
				<DropdownMenuItem asChild className="h-10 gap-3 rounded-lg">
					<Link to="/perfil">
						<User className="h-4 w-4 text-muted-foreground" />
						Meu perfil
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">Tema</DropdownMenuLabel>
				<DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
					{ThemeOptions.map(({ value, label, icon: Icon }) => (
						<DropdownMenuRadioItem key={value} value={value} className="h-9 gap-3 rounded-lg">
							<Icon className="h-4 w-4 text-muted-foreground" />
							{label}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild className="h-10 gap-3 rounded-lg">
					<a href={DONATION_URL} target="_blank" rel="noopener noreferrer">
						<Heart className="h-4 w-4 text-muted-foreground" />
						Apoiar o Doresh
					</a>
				</DropdownMenuItem>
				<DropdownMenuItem onSelect={handleLogout} className="h-10 gap-3 rounded-lg">
					<LogOut className="h-4 w-4 text-muted-foreground" />
					Sair da conta
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

/** Atalho de teclado (Ctrl/Cmd+B) e largura em `--sidebar-w`, usada pelo layout e por painéis fixos. */
export const SIDEBAR_COLLAPSED_KEY = 'doresh:sidebar-collapsed';

const RailTooltip: React.FC<{ label: string; enabled: boolean; children: React.ReactElement }> = ({ label, enabled, children }) =>
	enabled ? (
		<Tooltip delayDuration={150}>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			<TooltipContent side="right">{label}</TooltipContent>
		</Tooltip>
	) : (
		children
	);

export const DesktopSidebar: React.FC<{ collapsed: boolean; onToggle: () => void }> = ({ collapsed, onToggle }) => (
	<aside
		aria-label="Barra lateral"
		className={cn(
			'fixed inset-y-0 left-0 z-30 hidden flex-col gap-7 overflow-hidden border-r border-border bg-card py-6 transition-[width] duration-200 ease-out motion-reduce:transition-none md:flex',
			collapsed ? 'w-[4.5rem] items-center px-3' : 'w-64 px-4',
		)}
	>
		<div className={cn('flex items-center gap-2', collapsed ? 'flex-col' : 'justify-between')}>
			{collapsed ? (
				<Link to="/home" aria-label="Doresh — Início" className="rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
					<Logo size="md" />
				</Link>
			) : (
				<Brand />
			)}
			<RailTooltip label="Expandir barra lateral (Ctrl+B)" enabled={collapsed}>
				<button
					type="button"
					onClick={onToggle}
					aria-label={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
					aria-expanded={!collapsed}
					title={collapsed ? undefined : 'Recolher barra lateral (Ctrl+B)'}
					className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					{collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
				</button>
			</RailTooltip>
		</div>

		<nav aria-label="Principal" className={cn('flex flex-col gap-1', collapsed && 'items-center')}>
			{mainItems.map(({ to, label, icon: Icon }) => (
				<RailTooltip key={to} label={label} enabled={collapsed}>
					<NavLink
						to={to}
						aria-label={collapsed ? label : undefined}
						className={({ isActive }) =>
							cn(
								'flex h-11 items-center rounded-lg text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
								collapsed ? 'w-11 justify-center' : 'gap-3 px-3',
								isActive
									? 'bg-primary/10 font-semibold text-primary'
									: 'text-muted-foreground hover:bg-muted hover:text-foreground',
							)
						}
					>
						<Icon className="h-5 w-5 shrink-0" />
						{!collapsed && label}
					</NavLink>
				</RailTooltip>
			))}
		</nav>

		<RailTooltip label="Novo estudo" enabled={collapsed}>
			<Link
				to="/estudos/novo"
				aria-label={collapsed ? 'Novo estudo' : undefined}
				className={cn(
					'flex h-11 items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
					collapsed && 'w-11',
				)}
			>
				<Plus className="h-4 w-4 shrink-0" />
				{!collapsed && 'Novo estudo'}
			</Link>
		</RailTooltip>

		<div className={cn('mt-auto', !collapsed && 'w-full')}>
			<AccountMenu variant={collapsed ? 'rail' : 'sidebar'} />
		</div>
	</aside>
);

export const MobileTopBar: React.FC = () => (
	<header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-2 backdrop-blur md:hidden">
		<Brand compact />
		<AccountMenu variant="icon" />
	</header>
);

export const MobileNavigation: React.FC = () => (
	<nav
		aria-label="Principal"
		className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 md:hidden"
	>
		{mobileItems.map(({ to, label, shortLabel, icon: Icon }) => (
			<NavLink
				key={to}
				to={to}
				className={({ isActive }) =>
					cn(
						'group flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
						isActive ? 'font-semibold text-primary' : 'text-muted-foreground',
					)
				}
			>
				{({ isActive }) => (
					<>
						<span className={cn('flex h-7 w-14 items-center justify-center rounded-full transition-colors', isActive && 'bg-primary/10')}>
							<Icon className="h-5 w-5" />
						</span>
						{shortLabel ?? label}
					</>
				)}
			</NavLink>
		))}
	</nav>
);

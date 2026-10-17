import React from 'react';
import { DesktopSidebar, MobileNavigation, MobileTopBar, SIDEBAR_COLLAPSED_KEY } from './navigation';
import FloatingAssistant from '@/components/ai/FloatingAssistant';
import { cn } from '@/lib/utils';
import { FEATURES } from '@/lib/features';

interface LayoutProps {
  children: React.ReactNode;
  showAssistant?: boolean;
  /** Página controla a própria largura e barra superior (leitor bíblico, Ruach). */
  fullBleed?: boolean;
}

const readCollapsed = () => {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
};

/** Estado da sidebar do desktop: lembrado entre visitas, alternado por botão ou Ctrl/Cmd+B. */
function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = React.useState(readCollapsed);

  React.useEffect(() => {
    // Largura disponível para o layout e para painéis fixos (ex.: ações do leitor)
    document.documentElement.style.setProperty('--sidebar-w', collapsed ? '4.5rem' : '16rem');
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch {
      /* segue sem lembrar */
    }
  }, [collapsed]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setCollapsed((c) => !c);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return [collapsed, () => setCollapsed((c) => !c)] as const;
}

export const Layout: React.FC<LayoutProps> = ({ children, showAssistant = true, fullBleed = false }) => {
  const [collapsed, toggle] = useSidebarCollapsed();

  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar collapsed={collapsed} onToggle={toggle} />
      {!fullBleed && <MobileTopBar />}

      <main
        className={cn(
          'pb-24 transition-[margin] duration-200 ease-out motion-reduce:transition-none md:pb-0',
          collapsed ? 'md:ml-[4.5rem]' : 'md:ml-64',
          !fullBleed && 'md:pb-10',
        )}
      >
        {fullBleed ? children : <div className="mx-auto max-w-5xl px-4 pt-6 md:px-8 md:pt-10">{children}</div>}
      </main>

      <MobileNavigation />
      {showAssistant && FEATURES.ruach && <FloatingAssistant />}
    </div>
  );
};

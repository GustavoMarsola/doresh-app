import React from 'react';
import { Header } from './header';
import { MobileNavigation, DesktopNavigation } from './navigation';
import FloatingAssistant from '@/components/ai/FloatingAssistant';

interface LayoutProps {
  children: React.ReactNode;
  showAssistant?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, showAssistant = true }) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <MobileNavigation />
      <DesktopNavigation />

      <main className="pb-20 md:pb-6 md:ml-64 pt-4">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          {children}
        </div>
      </main>

      {showAssistant && <FloatingAssistant />}
    </div>
  );
};

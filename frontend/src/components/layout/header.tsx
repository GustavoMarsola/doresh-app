import React from 'react';
import { Logo } from '@/components/ui/logo';

export const Header: React.FC = () => {
  const headerHeight = '64px'; // altura usada também no spacer

  return (
    <>
      <header
        className="fixed top-0 z-50 w-full bg-card/70 backdrop-blur shadow-sm border-b border-border px-4 py-3 md:px-6"
        style={{ height: headerHeight }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between h-full">
          <div className="flex items-center space-x-3">
            <Logo size="md" className="text-primary" />
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-foreground">
                Doresh
              </h1>
              <p className="text-xs text-muted-foreground font-hebrew">
                דּוֹרֵשׁ
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer invisível para empurrar o conteúdo da página */}
      <div style={{ height: headerHeight }} aria-hidden="true" />
    </>
  );
};

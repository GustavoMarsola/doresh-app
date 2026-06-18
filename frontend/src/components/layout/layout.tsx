import React from 'react';
import { useEffect, useState } from 'react';
import { Header } from './header';
import { MobileNavigation, DesktopNavigation } from './navigation';
import FloatingAssistant from '@/components/ai/FloatingAssistant';
import AvisoTrialBadge from '@/components/ui/aviso-trial-badge';
import { jwtDecode } from 'jwt-decode';
interface LayoutProps {
  children: React.ReactNode;
  showAssistant?: boolean; // nova prop opcional
}

export const Layout: React.FC<LayoutProps> = ({ children, showAssistant = true }) => {
  const token = localStorage.getItem('token');
  const [hasAccess, setHasAccess] = useState(false);
  const [diasRestantes, setDiasRestantes] = useState(0);
  const [trialEndDate, setTrialEndDate] = useState('');
  const [subscriptionId, setSubscriptionId] = useState(null);
  
  useEffect(() => {
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        const trialEnd = new Date(decoded.trial_end_date);
        const hoje = new Date();
        
        const userHasAccess = decoded.subscription_id || decoded.trial_end_date > new Date().toISOString();
        setHasAccess(userHasAccess);

        const remainingDays = Math.ceil((trialEnd.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        setDiasRestantes(remainingDays);
        setTrialEndDate(decoded.trial_end_date);
        setSubscriptionId(decoded.subscription_id);
      } catch (error) {
        console.error("Failed to decode token", error);
        setHasAccess(false);
      }
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <MobileNavigation />
      <DesktopNavigation />
      
      <main className="pb-20 md:pb-6 md:ml-64 pt-4">
        <AvisoTrialBadge
          diasRestantes={150}
          trialEndDate={'01-01-2026'}
          subscriptionId={null}
        />
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          {children}
        </div>
      </main>

      {showAssistant && <FloatingAssistant />}
    </div>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';

interface AvisoTrialBadgeProps {
  diasRestantes: number;
  subscriptionId: string | null;
  trialEndDate: string; // ISO date
}

const getBadgeColor = (diasRestantes: number) => {
  if (diasRestantes >= 6) return 'bg-green-100 text-green-800 border-green-300';
  if (diasRestantes >= 4) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  if (diasRestantes >= 2) return 'bg-orange-100 text-orange-800 border-orange-300';
  if (diasRestantes >= 0) return 'bg-red-100 text-red-800 border-red-300';
  return 'bg-gray-100 text-gray-800 border-gray-300'; // expirado
};

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('pt-BR', {
    timeZone: 'UTC', // 👈 força UTC
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};


const AvisoTrialBadge: React.FC<AvisoTrialBadgeProps> = ({
  diasRestantes,
  subscriptionId,
  trialEndDate,
}) => {
  const navigate = useNavigate();

  const dataFormatada = formatDate(trialEndDate);

  // Se tiver plano ativo ou trial muito antigo, não mostra
  if (subscriptionId || diasRestantes < -30) return null;

  const cor = getBadgeColor(diasRestantes);

  let msg = '';
  if (diasRestantes === 0) {
    msg = `❌ Sua avaliação gratuita está prestes a encerrar!`;
  } 
  //   else if (diasRestantes > 0) {
  //   msg = `⏳ Sua avaliação gratuita encerrará em ${dataFormatada}, restam ${diasRestantes} dia(s).`;
  // } 
    else if (1 === 1) {
    msg = '✅ Aproveite o seu período de avaliação gratuita! '
  }
    else {
    msg = `❗ Seu período de avaliação gratuita expirou há ${Math.abs(
      diasRestantes
    )} dia(s), em ${dataFormatada}. Seu acesso às ferramentas poderá ser encerrado a qualquer momento.`;
  }

  return (
    <div
      className={`rounded-2xl px-6 py-3 border text-base font-semibold ${cor} shadow-md mb-6 flex flex-col sm:flex-row items-center justify-center gap-2 text-center sm:text-left`}
    >
      <span>{msg}</span>
      <button
        onClick={() => navigate('/perfil')}
        className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition"
      >
        Escolher plano
      </button>
    </div>
  );
};

export default AvisoTrialBadge;
